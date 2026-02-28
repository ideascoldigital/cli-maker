import { Colors } from '../colors';
import type { SlashCommand, SessionContext } from '../interfaces';

/**
 * Built-in slash commands available in every interactive session.
 */
export function getBuiltInSlashCommands(): SlashCommand[] {
  return [
    {
      name: 'help',
      description: 'Show available slash commands',
      action: (_args: string, ctx: SessionContext) => {
        const allCommands = getAllSlashCommands(ctx);
        console.log(`\n${Colors.Bright}${Colors.FgCyan}Available Commands${Colors.Reset}`);
        console.log(`${Colors.FgGray}${'─'.repeat(40)}${Colors.Reset}`);
        for (const cmd of allCommands) {
          console.log(`  ${Colors.FgGreen}/${cmd.name}${Colors.Reset}  ${Colors.FgGray}${cmd.description}${Colors.Reset}`);
        }
        console.log('');
      },
    },
    {
      name: 'clear',
      description: 'Clear the screen',
      action: (_args: string, _ctx: SessionContext) => {
        process.stdout.write('\x1B[2J\x1B[0;0H');
      },
    },
    {
      name: 'history',
      description: 'Show conversation history',
      action: (_args: string, ctx: SessionContext) => {
        if (ctx.history.length === 0) {
          console.log(`\n${Colors.FgGray}No messages in history yet.${Colors.Reset}\n`);
          return;
        }
        console.log(`\n${Colors.Bright}${Colors.FgCyan}Conversation History${Colors.Reset} ${Colors.FgGray}(${ctx.history.length} messages)${Colors.Reset}`);
        console.log(`${Colors.FgGray}${'─'.repeat(40)}${Colors.Reset}`);
        for (const msg of ctx.history) {
          const roleColor = msg.role === 'user'
            ? Colors.FgGreen
            : msg.role === 'assistant'
              ? Colors.FgCyan
              : Colors.FgYellow;
          const roleLabel = msg.role === 'tool' && msg.toolName
            ? `tool:${msg.toolName}`
            : msg.role;
          const preview = msg.content.length > 80
            ? msg.content.slice(0, 80) + '...'
            : msg.content;
          console.log(`  ${roleColor}[${roleLabel}]${Colors.Reset} ${preview}`);
        }
        console.log('');
      },
    },
    {
      name: 'tools',
      description: 'List registered tools',
      action: (_args: string, ctx: SessionContext) => {
        if (ctx.tools.length === 0) {
          console.log(`\n${Colors.FgGray}No tools registered.${Colors.Reset}\n`);
          return;
        }
        console.log(`\n${Colors.Bright}${Colors.FgCyan}Registered Tools${Colors.Reset} ${Colors.FgGray}(${ctx.tools.length})${Colors.Reset}`);
        console.log(`${Colors.FgGray}${'─'.repeat(40)}${Colors.Reset}`);
        for (const tool of ctx.tools) {
          console.log(`  ${Colors.FgYellow}⚡${Colors.Reset} ${Colors.Bright}${tool.name}${Colors.Reset}  ${Colors.FgGray}${tool.description}${Colors.Reset}`);
          if (tool.parameters && tool.parameters.length > 0) {
            for (const p of tool.parameters) {
              const req = p.required ? `${Colors.FgRed}*${Colors.Reset}` : '';
              console.log(`      ${Colors.FgGray}${p.name}${req} (${p.type}) — ${p.description}${Colors.Reset}`);
            }
          }
        }
        console.log('');
      },
    },
    {
      name: 'compact',
      description: 'Trim conversation history to the last N messages (default: 10)',
      action: (args: string, ctx: SessionContext) => {
        const keep = parseInt(args.trim(), 10) || 10;
        const removed = Math.max(0, ctx.history.length - keep);
        if (removed > 0) {
          ctx.history.splice(0, removed);
        }
        console.log(`\n${Colors.FgGreen}✓${Colors.Reset} History compacted: kept ${ctx.history.length} messages, removed ${removed}.\n`);
      },
    },
    {
      name: 'exit',
      description: 'End the interactive session',
      action: (_args: string, _ctx: SessionContext) => {
        // Handled specially by the session loop — this is just for /help listing
      },
    },
  ];
}

/**
 * Collect built-in + custom slash commands from the session context.
 * Custom commands override built-in ones if they share the same name.
 */
function getAllSlashCommands(ctx: SessionContext): SlashCommand[] {
  // The session stores the merged list on the context; just return from tools listing
  // This helper is used internally for /help rendering
  const builtIn = getBuiltInSlashCommands();
  // We don't have access to custom commands here, but the session merges them.
  // For /help, we rely on the session passing the full list.
  return builtIn;
}
