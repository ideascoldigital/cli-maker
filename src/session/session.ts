import readline from 'readline';
import { execSync } from 'child_process';
import { Colors } from '../colors';
import { ProgressIndicator, stripAnsiCodes } from '../common';
import { renderMarkdown } from './markdown';
import { getBuiltInSlashCommands } from './slash-commands';
import {
  drawBox,
  drawTwoColumnBox,
  toolCallHeader,
  toolCallArgs,
  toolResultBox,
  sectionHeader,
  alignedList,
  separator,
} from './ui';
import type {
  SessionOptions,
  SessionContext,
  SessionMessage,
  SessionTheme,
  SlashCommand,
  Tool,
} from '../interfaces';

/**
 * Interactive REPL session — enables persistent, multi-turn CLI experiences
 * with slash commands, tool calls, streaming output, and conversation history.
 */
export class InteractiveSession {
  private history: SessionMessage[] = [];
  private tools: Tool[];
  private slashCommands: SlashCommand[];
  private options: Required<Pick<SessionOptions, 'prompt' | 'historySize' | 'multiLineEnabled'>> & SessionOptions;
  private rl: readline.Interface | null = null;
  private inputHistory: string[] = [];
  private running = false;
  private theme: Required<SessionTheme>;

  constructor(options: SessionOptions) {
    this.options = {
      prompt: options.prompt ?? '> ',
      historySize: options.historySize ?? 100,
      multiLineEnabled: options.multiLineEnabled ?? true,
      ...options,
    };
    this.tools = options.tools ?? [];
    this.slashCommands = this.mergeSlashCommands(options.slashCommands ?? []);
    this.theme = {
      borderColor: options.theme?.borderColor ?? Colors.FgGreen,
      borderStyle: options.theme?.borderStyle ?? 'dashed',
      promptColor: options.theme?.promptColor ?? Colors.FgGreen,
      accentColor: options.theme?.accentColor ?? Colors.FgCyan,
    };
  }

  /**
   * Start the interactive session loop. Resolves when the user exits.
   */
  async start(): Promise<void> {
    this.running = true;
    const ctx = this.buildContext();

    // Render welcome screen
    this.renderWelcomeScreen();

    // Lifecycle: onStart
    if (this.options.onStart) {
      await this.options.onStart(ctx);
    }

    // Separator line before prompt area (like Claude Code)
    const termW = process.stdout.columns || 80;
    console.log(`  ${Colors.FgGray}${'─'.repeat(Math.max(10, termW - 4))}${Colors.Reset}\n`);

    // Main REPL loop
    while (this.running) {
      let input: string;
      try {
        input = await this.readInput();
      } catch {
        // EOF (Ctrl+D) or error — exit gracefully
        break;
      }

      const trimmed = input.trim();
      if (trimmed.length === 0) continue;

      // Shell command (! prefix)
      if (trimmed.startsWith('!')) {
        const shellCmd = trimmed.slice(1).trim();
        if (shellCmd.length === 0) {
          console.log(`  ${Colors.FgGray}Usage: ! <command>  (e.g. ! ls, ! pwd, ! git status)${Colors.Reset}\n`);
        } else {
          console.log(`  ${Colors.FgGray}$ ${shellCmd}${Colors.Reset}`);
          try {
            const output = execSync(shellCmd, {
              encoding: 'utf-8',
              stdio: ['pipe', 'pipe', 'pipe'],
              timeout: 30_000,
              cwd: process.cwd(),
            });
            if (output.trim().length > 0) {
              // Indent output for visual consistency
              const indented = output.trimEnd().split('\n').map(l => `  ${l}`).join('\n');
              console.log(indented);
            }
          } catch (err: any) {
            if (err.stderr) {
              const indented = err.stderr.toString().trimEnd().split('\n').map((l: string) => `  ${l}`).join('\n');
              console.log(`${Colors.FgRed}${indented}${Colors.Reset}`);
            }
            if (err.status != null) {
              console.log(`  ${Colors.FgGray}exit code: ${err.status}${Colors.Reset}`);
            }
          }
          console.log('');
        }
        continue;
      }

      // Slash command
      if (trimmed.startsWith('/')) {
        const spaceIdx = trimmed.indexOf(' ');
        const cmdName = spaceIdx === -1
          ? trimmed.slice(1)
          : trimmed.slice(1, spaceIdx);
        const cmdArgs = spaceIdx === -1
          ? ''
          : trimmed.slice(spaceIdx + 1);

        if (cmdName === 'exit' || cmdName === 'quit') {
          break;
        }

        const cmd = this.slashCommands.find(c => c.name === cmdName);
        if (cmd) {
          await cmd.action(cmdArgs, this.buildContext());
        } else {
          console.log(`  ${Colors.FgRed}✗${Colors.Reset} Unknown command: ${Colors.Bright}/${cmdName}${Colors.Reset}`);
          console.log(`  ${Colors.FgGray}Type ${Colors.FgGreen}/help${Colors.FgGray} for a list of commands.${Colors.Reset}\n`);
        }
        continue;
      }

      // Regular message — add to history and dispatch
      this.addToHistory({ role: 'user', content: trimmed });

      try {
        await this.options.onMessage(trimmed, this.buildContext());
      } catch (err: any) {
        console.log(`\n  ${Colors.FgRed}✗ Error:${Colors.Reset} ${err?.message ?? err}\n`);
      }
    }

    // Lifecycle: onEnd
    if (this.options.onEnd) {
      await this.options.onEnd(this.buildContext());
    }

    console.log(`\n  ${Colors.FgGray}Session ended. Goodbye!${Colors.Reset}\n`);
    this.cleanup();
  }

  /**
   * Programmatically stop the session from within a handler.
   */
  stop(): void {
    this.running = false;
  }

  /**
   * Get the current conversation history (read-only copy).
   */
  getHistory(): SessionMessage[] {
    return [...this.history];
  }

  // ---------------------------------------------------------------------------
  // Welcome screen rendering
  // ---------------------------------------------------------------------------

  private renderWelcomeScreen(): void {
    console.log('');

    const hasTips = this.options.tips && this.options.tips.length > 0;
    const hasWelcome = !!this.options.welcomeMessage;

    if (hasWelcome && hasTips) {
      // Two-column layout like Claude Code
      const leftLines = this.options.welcomeMessage!.split('\n').map(l => {
        // Simple inline formatting for welcome text
        return l
          .replace(/\*\*(.+?)\*\*/g, `${Colors.Bright}$1${Colors.Reset}`)
          .replace(/`([^`]+)`/g, `${Colors.FgCyan}$1${Colors.Reset}`);
      });

      const rightLines: string[] = [];
      for (const tip of this.options.tips!) {
        rightLines.push(`${Colors.FgYellow}${Colors.Bright}${tip.title}${Colors.Reset}`);
        for (const line of tip.lines) {
          rightLines.push(`${line}`);
        }
        rightLines.push(''); // spacing between tip sections
      }
      // Remove trailing empty line
      if (rightLines.length > 0 && rightLines[rightLines.length - 1] === '') {
        rightLines.pop();
      }

      console.log(drawTwoColumnBox(leftLines, rightLines, {
        borderColor: this.theme.borderColor,
        borderStyle: this.theme.borderStyle,
      }));
    } else if (hasWelcome) {
      // Single-column welcome panel
      const lines = this.options.welcomeMessage!.split('\n').map(l => {
        return l
          .replace(/\*\*(.+?)\*\*/g, `${Colors.Bright}$1${Colors.Reset}`)
          .replace(/`([^`]+)`/g, `${Colors.FgCyan}$1${Colors.Reset}`);
      });
      console.log(drawBox(lines, {
        borderColor: this.theme.borderColor,
        borderStyle: this.theme.borderStyle,
      }));
    }

    // Info lines below the panel
    if (this.options.infoLines && this.options.infoLines.length > 0) {
      for (const line of this.options.infoLines) {
        console.log(`  ${Colors.FgGray}${line}${Colors.Reset}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Input with real-time slash command autocomplete (fully raw-mode based)
  // ---------------------------------------------------------------------------

  private readInput(): Promise<string> {
    const isTTY = process.stdin.isTTY ?? false;

    // Non-TTY fallback: use readline normally (no autocomplete)
    if (!isTTY) {
      return new Promise<string>((resolve, reject) => {
        this.rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          terminal: false,
        });
        this.rl.question('> ', (answer: string) => {
          this.rl!.close();
          this.rl = null;
          resolve(answer);
        });
        this.rl.on('close', () => reject(new Error('EOF')));
      });
    }

    // TTY: fully custom raw-mode input with inline autocomplete
    return new Promise<string>((resolve, reject) => {
      let line = '';
      let cursor = 0;
      let historyIdx = -1;
      let savedLine = '';
      let menuItems: SlashCommand[] = [];
      let menuSelected = 0;
      let menuLineCount = 0;

      const promptStr = `${this.theme.promptColor}>${Colors.Reset} `;
      const promptVisualLen = 2; // "> "

      // ── Rendering helpers ───────────────────────────────────────────
      // The cursor is always logically on the prompt line after any render
      // operation. Menu lines are drawn below via \n. We track how many
      // extra lines exist below the prompt so we can erase them.

      const eraseBelow = () => {
        // From the prompt line, erase everything below
        if (menuLineCount > 0) {
          // Use "erase from cursor to end of screen"
          process.stdout.write('\x1b[J');
          menuLineCount = 0;
        }
      };

      const renderPromptLine = () => {
        process.stdout.write('\r\x1b[2K');
        process.stdout.write(promptStr + line);
        const cursorPos = promptVisualLen + cursor;
        process.stdout.write(`\r\x1b[${cursorPos + 1}G`);
      };

      const renderMenu = () => {
        if (menuItems.length === 0) return;

        const maxNameLen = Math.max(...menuItems.map(c => c.name.length));
        const gap = 4;

        const rows: string[] = [];
        for (let i = 0; i < menuItems.length; i++) {
          const cmd = menuItems[i];
          const nameStr = `/${cmd.name}`.padEnd(maxNameLen + 1 + gap);
          if (i === menuSelected) {
            rows.push(`  ${Colors.Dim}${Colors.Reverse} ${nameStr}${cmd.description} ${Colors.Reset}`);
          } else {
            rows.push(`  ${Colors.FgWhite}/${cmd.name}${Colors.Reset}${' '.repeat(maxNameLen - cmd.name.length + gap)}${Colors.FgGray}${cmd.description}${Colors.Reset}`);
          }
        }

        // Write menu lines below the prompt
        for (const row of rows) {
          process.stdout.write('\n\x1b[2K' + row);
        }
        menuLineCount = rows.length;

        // Move cursor back up to the prompt line
        if (menuLineCount > 0) {
          process.stdout.write(`\x1b[${menuLineCount}A`);
        }
        // Reposition cursor on the prompt line
        const cursorPos = promptVisualLen + cursor;
        process.stdout.write(`\r\x1b[${cursorPos + 1}G`);
      };

      const redraw = () => {
        eraseBelow();
        renderPromptLine();

        // Update autocomplete menu if line starts with /
        const isSlashPrefix = line.startsWith('/') && !line.includes(' ');
        if (isSlashPrefix) {
          const partial = line.slice(1).toLowerCase();
          menuItems = this.slashCommands.filter(c =>
            c.name.toLowerCase().startsWith(partial)
          );
          menuSelected = Math.min(menuSelected, Math.max(0, menuItems.length - 1));
          if (menuItems.length > 0) {
            renderMenu();
          }
        } else {
          menuItems = [];
          menuSelected = 0;
        }
      };

      const finish = (result: string) => {
        eraseBelow();
        process.stdin.removeListener('data', onData);
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(false);
        }
        process.stdout.write('\n');

        // Save to input history
        const trimmed = result.trim();
        if (trimmed.length > 0) {
          this.inputHistory.unshift(trimmed);
          if (this.inputHistory.length > 50) this.inputHistory.pop();
        }

        resolve(result);
      };

      // ── Keystroke handler ───────────────────────────────────────────

      const onData = (data: Buffer) => {
        const s = data.toString();

        // Ctrl+C
        if (s === '\x03') {
          eraseBelow();
          process.stdin.removeListener('data', onData);
          if (process.stdin.setRawMode) {
            process.stdin.setRawMode(false);
          }
          process.stdout.write('\n');
          reject(new Error('EOF'));
          return;
        }

        // Ctrl+D
        if (s === '\x04') {
          if (line.length === 0) {
            eraseBelow();
            process.stdin.removeListener('data', onData);
            if (process.stdin.setRawMode) {
              process.stdin.setRawMode(false);
            }
            process.stdout.write('\n');
            reject(new Error('EOF'));
            return;
          }
          return;
        }

        // Enter
        if (s === '\r' || s === '\n') {
          // If menu is visible, Enter selects the highlighted command
          if (menuItems.length > 0 && menuSelected < menuItems.length) {
            const selected = menuItems[menuSelected];
            line = `/${selected.name}`;
            cursor = line.length;
          }
          finish(line);
          return;
        }

        // Tab — accept highlighted menu item (don't submit)
        if (s === '\t') {
          if (menuItems.length > 0 && menuSelected < menuItems.length) {
            const selected = menuItems[menuSelected];
            line = `/${selected.name}`;
            cursor = line.length;
            menuItems = [];
            menuSelected = 0;
            redraw();
          }
          return;
        }

        // Backspace
        if (s === '\x7f' || s === '\b') {
          if (cursor > 0) {
            line = line.slice(0, cursor - 1) + line.slice(cursor);
            cursor--;
            menuSelected = 0;
            redraw();
          }
          return;
        }

        // Escape — clear menu or clear line
        if (s === '\x1b') {
          if (menuItems.length > 0) {
            menuItems = [];
            menuSelected = 0;
            redraw();
          }
          return;
        }

        // Arrow up
        if (s === '\x1b[A' || s === '\x1bOA') {
          if (menuItems.length > 0) {
            // Navigate menu
            menuSelected = (menuSelected - 1 + menuItems.length) % menuItems.length;
            eraseBelow();
            renderPromptLine();
            renderMenu();
          } else {
            // Navigate input history
            if (historyIdx === -1) savedLine = line;
            if (historyIdx < this.inputHistory.length - 1) {
              historyIdx++;
              line = this.inputHistory[historyIdx];
              cursor = line.length;
              redraw();
            }
          }
          return;
        }

        // Arrow down
        if (s === '\x1b[B' || s === '\x1bOB') {
          if (menuItems.length > 0) {
            // Navigate menu
            menuSelected = (menuSelected + 1) % menuItems.length;
            eraseBelow();
            renderPromptLine();
            renderMenu();
          } else {
            // Navigate input history
            if (historyIdx > 0) {
              historyIdx--;
              line = this.inputHistory[historyIdx];
              cursor = line.length;
              redraw();
            } else if (historyIdx === 0) {
              historyIdx = -1;
              line = savedLine;
              cursor = line.length;
              redraw();
            }
          }
          return;
        }

        // Arrow left
        if (s === '\x1b[D' || s === '\x1bOD') {
          if (cursor > 0) {
            cursor--;
            process.stdout.write('\x1b[1D');
          }
          return;
        }

        // Arrow right
        if (s === '\x1b[C' || s === '\x1bOC') {
          if (cursor < line.length) {
            cursor++;
            process.stdout.write('\x1b[1C');
          }
          return;
        }

        // Home
        if (s === '\x1b[H' || s === '\x01') {
          cursor = 0;
          process.stdout.write(`\r\x1b[${promptVisualLen + 1}G`);
          return;
        }

        // End
        if (s === '\x1b[F' || s === '\x05') {
          cursor = line.length;
          process.stdout.write(`\r\x1b[${promptVisualLen + cursor + 1}G`);
          return;
        }

        // Delete
        if (s === '\x1b[3~') {
          if (cursor < line.length) {
            line = line.slice(0, cursor) + line.slice(cursor + 1);
            menuSelected = 0;
            redraw();
          }
          return;
        }

        // Ignore other escape sequences
        if (s.startsWith('\x1b')) {
          return;
        }

        // Regular character input
        if (s.length === 1 && s.charCodeAt(0) >= 32) {
          line = line.slice(0, cursor) + s + line.slice(cursor);
          cursor++;
          historyIdx = -1;
          menuSelected = 0;
          redraw();
          return;
        }
      };

      // Activate raw mode and start listening
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
      }
      process.stdin.resume();

      // Draw initial prompt
      renderPromptLine();

      process.stdin.on('data', onData);
    });
  }

  // ---------------------------------------------------------------------------
  // Context builder
  // ---------------------------------------------------------------------------

  private buildContext(): SessionContext {
    const self = this;
    return {
      history: this.history,
      tools: this.tools,
      callTool: (name: string, args: Record<string, any>) => self.executeTool(name, args),
      print: (text: string) => self.print(text),
      printStream: (stream: AsyncIterable<string>) => self.printStream(stream),
      printMarkdown: (md: string) => self.printMarkdown(md),
      spinner: new ProgressIndicator(),
      session: self,
    };
  }

  // ---------------------------------------------------------------------------
  // Tool execution with Claude-style UI
  // ---------------------------------------------------------------------------

  private async executeTool(name: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    // Validate required parameters
    if (tool.parameters) {
      for (const param of tool.parameters) {
        if (param.required && (args[param.name] === undefined || args[param.name] === null)) {
          throw new Error(`Missing required parameter '${param.name}' for tool '${name}'`);
        }
      }
    }

    // Claude-style tool call header
    console.log('');
    console.log(toolCallHeader(tool.name, tool.description));

    // Show args if any
    if (Object.keys(args).length > 0) {
      console.log(toolCallArgs(args));
    }

    const spinner = new ProgressIndicator();
    spinner.start('  Running...');

    let result: any;
    try {
      result = await tool.execute(args, this.buildContext());
      spinner.success('Done');
    } catch (err: any) {
      spinner.error(err?.message ?? 'Tool execution failed');
      throw err;
    }

    // Render result with left accent bar
    const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    console.log(toolResultBox(resultStr));
    console.log('');

    // Add tool result to history
    this.addToHistory({ role: 'tool', content: resultStr, toolName: name });

    return result;
  }

  // ---------------------------------------------------------------------------
  // Output helpers
  // ---------------------------------------------------------------------------

  private print(text: string): void {
    console.log(`  ${text}`);
    this.addToHistory({ role: 'assistant', content: text });
  }

  private async printStream(stream: AsyncIterable<string>): Promise<void> {
    let full = '';
    process.stdout.write('  ');
    for await (const chunk of stream) {
      process.stdout.write(chunk);
      full += chunk;
    }
    process.stdout.write('\n\n');
    this.addToHistory({ role: 'assistant', content: full });
  }

  private printMarkdown(md: string): void {
    const rendered = renderMarkdown(md);
    // Indent each line for consistent look
    const indented = rendered.split('\n').map(l => `  ${l}`).join('\n');
    console.log(indented);
    this.addToHistory({ role: 'assistant', content: md });
  }

  // ---------------------------------------------------------------------------
  // History management
  // ---------------------------------------------------------------------------

  private addToHistory(message: SessionMessage): void {
    this.history.push(message);
    while (this.history.length > this.options.historySize) {
      this.history.shift();
    }
  }

  // ---------------------------------------------------------------------------
  // Slash command merging with improved /help
  // ---------------------------------------------------------------------------

  private mergeSlashCommands(custom: SlashCommand[]): SlashCommand[] {
    const builtIn = getBuiltInSlashCommands();
    const customNames = new Set(custom.map(c => c.name));

    const merged = builtIn.filter(b => !customNames.has(b.name));
    merged.push(...custom);

    // Override /help to use aligned layout with the merged list
    const helpIdx = merged.findIndex(c => c.name === 'help');
    if (helpIdx !== -1) {
      merged[helpIdx] = {
        name: 'help',
        description: 'Show available slash commands',
        action: (_args: string, _ctx: SessionContext) => {
          console.log(sectionHeader('Commands'));
          console.log('');
          const items = merged.map(cmd => ({
            key: `/${cmd.name}`,
            value: cmd.description,
            keyColor: Colors.FgGreen,
          }));
          console.log(alignedList(items));
          console.log('');
        },
      };
    }

    // Override /tools to use improved layout
    const toolsIdx = merged.findIndex(c => c.name === 'tools');
    if (toolsIdx !== -1) {
      const self = this;
      merged[toolsIdx] = {
        name: 'tools',
        description: 'List registered tools',
        action: (_args: string, _ctx: SessionContext) => {
          if (self.tools.length === 0) {
            console.log(`\n  ${Colors.FgGray}No tools registered.${Colors.Reset}\n`);
            return;
          }
          console.log(sectionHeader(`Tools ${Colors.FgGray}(${self.tools.length})${Colors.Reset}`));
          console.log('');
          for (const tool of self.tools) {
            console.log(`    ${Colors.FgYellow}⚡${Colors.Reset} ${Colors.Bright}${tool.name}${Colors.Reset}  ${Colors.FgGray}${tool.description}${Colors.Reset}`);
            if (tool.parameters && tool.parameters.length > 0) {
              for (const p of tool.parameters) {
                const req = p.required ? `${Colors.FgRed}*${Colors.Reset}` : '';
                console.log(`       ${Colors.FgGray}${p.name}${req} ${Colors.Dim}(${p.type})${Colors.Reset} ${Colors.FgGray}${p.description}${Colors.Reset}`);
              }
            }
          }
          console.log('');
        },
      };
    }

    // Override /history to use improved layout
    const historyIdx = merged.findIndex(c => c.name === 'history');
    if (historyIdx !== -1) {
      const self = this;
      merged[historyIdx] = {
        name: 'history',
        description: 'Show conversation history',
        action: (_args: string, _ctx: SessionContext) => {
          if (self.history.length === 0) {
            console.log(`\n  ${Colors.FgGray}No messages yet.${Colors.Reset}\n`);
            return;
          }
          console.log(sectionHeader(`History ${Colors.FgGray}(${self.history.length} messages)${Colors.Reset}`));
          console.log('');
          for (const msg of self.history) {
            const roleColor = msg.role === 'user'
              ? Colors.FgGreen
              : msg.role === 'assistant'
                ? Colors.FgCyan
                : Colors.FgYellow;
            const roleLabel = msg.role === 'tool' && msg.toolName
              ? `tool:${msg.toolName}`
              : msg.role;
            const icon = msg.role === 'user' ? '▸' : msg.role === 'assistant' ? '◂' : '⚡';
            const preview = msg.content.length > 80
              ? msg.content.slice(0, 80) + '…'
              : msg.content;
            console.log(`    ${roleColor}${icon} ${roleLabel}${Colors.Reset}  ${Colors.FgGray}${preview}${Colors.Reset}`);
          }
          console.log('');
        },
      };
    }

    return merged;
  }

  private cleanup(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    // Ensure raw mode is off and stdin is released so process can exit
    if (process.stdin.setRawMode) {
      try { process.stdin.setRawMode(false); } catch { /* ignore */ }
    }
    process.stdin.pause();
    process.stdin.unref();
  }
}
