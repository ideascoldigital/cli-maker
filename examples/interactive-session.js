const { CLI, ParamType } = require('../src/index.ts');

const cli = new CLI('mycli', 'Interactive Session Demo', {
  interactive: true,
  version: '1.0.0',
  branding: false,
});

// ─── Example tools ──────────────────────────────────────────────────────────

const greetTool = {
  name: 'greet',
  description: 'Generate a greeting for someone',
  parameters: [
    { name: 'name', description: 'Name of the person', type: 'string', required: true },
    { name: 'formal', description: 'Use formal greeting', type: 'boolean', required: false },
  ],
  execute: async (args) => {
    if (args.formal) {
      return `Good day, ${args.name}. How may I assist you today?`;
    }
    return `Hey ${args.name}! What's up?`;
  },
};

const mathTool = {
  name: 'calculate',
  description: 'Evaluate a math expression',
  parameters: [
    { name: 'expression', description: 'Math expression to evaluate', type: 'string', required: true },
  ],
  execute: async (args) => {
    try {
      const sanitized = args.expression.replace(/[^0-9+\-*/().% ]/g, '');
      const result = Function(`"use strict"; return (${sanitized})`)();
      return `${args.expression} = ${result}`;
    } catch {
      return `Could not evaluate: ${args.expression}`;
    }
  },
};

const timeTool = {
  name: 'time',
  description: 'Get the current date and time',
  parameters: [],
  execute: async () => {
    return new Date().toLocaleString();
  },
};

const fileReadTool = {
  name: 'read-file',
  description: 'Read a file from disk',
  parameters: [
    { name: 'path', description: 'File path to read', type: 'string', required: true },
  ],
  execute: async (args) => {
    const fs = require('fs');
    try {
      return fs.readFileSync(args.path, 'utf-8').slice(0, 500);
    } catch (e) {
      return `Error: ${e.message}`;
    }
  },
};

// ─── Custom slash commands ──────────────────────────────────────────────────

const statusCommand = {
  name: 'status',
  description: 'Show session status',
  action: async (_args, ctx) => {
    console.log(`\n    Messages:  ${ctx.history.length}`);
    console.log(`    Tools:     ${ctx.tools.length}`);
    console.log(`    Uptime:    ${process.uptime().toFixed(1)}s\n`);
  },
};

// ─── Chat command — Claude Code-style UI ────────────────────────────────────

cli.command({
  name: 'chat',
  description: 'Start an interactive chat session',
  params: [],
  action: async () => {
    await cli.startSession({
      // Two-column welcome panel (like Claude Code)
      welcomeMessage: [
        '  Welcome to **MyCLI** v1.0.0',
        '',
        '  Built with `@ideascol/cli-maker`',
      ].join('\n'),

      tips: [
        {
          title: 'Getting started',
          lines: [
            'Type a message to get an echo response',
            'Use `greet <name>` to call the greet tool',
            'Use `calc <expr>` to evaluate math',
          ],
        },
        {
          title: 'Quick commands',
          lines: [
            '/tools    List available tools',
            '/help     Show all commands',
            '/status   Session info',
          ],
        },
      ],

      infoLines: [
        `v1.0.0 · ${process.cwd()}`,
      ],

      theme: {
        borderColor: '\x1b[32m',   // green
        borderStyle: 'rounded',
        promptColor: '\x1b[32m',
        accentColor: '\x1b[36m',
      },

      historySize: 50,
      tools: [greetTool, mathTool, timeTool, fileReadTool],
      slashCommands: [statusCommand],

      onMessage: async (message, ctx) => {
        const lower = message.toLowerCase();

        if (lower.startsWith('greet ')) {
          const name = message.slice(6).trim();
          const result = await ctx.callTool('greet', { name, formal: lower.includes('formal') });
          ctx.print(result);
          return;
        }

        if (lower.startsWith('calc ') || lower.startsWith('calculate ')) {
          const expr = message.replace(/^calc(ulate)?\s+/i, '');
          const result = await ctx.callTool('calculate', { expression: expr });
          ctx.print(result);
          return;
        }

        if (lower === 'time' || lower === 'what time is it') {
          const result = await ctx.callTool('time', {});
          ctx.print(result);
          return;
        }

        if (lower.startsWith('read ')) {
          const filePath = message.slice(5).trim();
          const result = await ctx.callTool('read-file', { path: filePath });
          ctx.printMarkdown(`\`\`\`\n${result}\n\`\`\``);
          return;
        }

        // Default: echo with markdown rendering
        ctx.printMarkdown(`> ${message}\n\nYou said: **${message}**`);
      },

      onEnd: async (ctx) => {
        console.log(`  Total messages: ${ctx.history.length}`);
      },
    });
  },
});

// ─── Streaming demo ─────────────────────────────────────────────────────────

cli.command({
  name: 'stream-chat',
  description: 'Demo interactive session with simulated streaming output',
  params: [],
  action: async () => {
    await cli.startSession({
      welcomeMessage: 'Streaming Demo\n\nType anything to see a **simulated streaming** response.',

      theme: {
        borderColor: '\x1b[35m',   // magenta
        borderStyle: 'rounded',
        promptColor: '\x1b[35m',
      },

      tools: [],
      onMessage: async (message, ctx) => {
        const response = `I received your message: "${message}". This response is being streamed token by token to demonstrate the printStream capability of cli-maker interactive sessions.`;

        const tokens = response.split(' ');
        async function* tokenStream() {
          for (const token of tokens) {
            yield token + ' ';
            await new Promise(r => setTimeout(r, 50));
          }
        }

        await ctx.printStream(tokenStream());
      },
    });
  },
});

cli.parse(process.argv);
