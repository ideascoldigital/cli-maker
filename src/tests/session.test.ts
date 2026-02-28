import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { InteractiveSession, renderMarkdown, getBuiltInSlashCommands } from '../session/index';
import { stripAnsiCodes } from '../common';
import type { SessionOptions, Tool, SlashCommand, SessionContext } from '../interfaces';

describe('InteractiveSession', () => {
  describe('constructor', () => {
    it('should create an instance with minimal options', () => {
      const session = new InteractiveSession({
        onMessage: async () => {},
      });
      assert.ok(session);
      assert.equal(typeof session.start, 'function');
      assert.equal(typeof session.stop, 'function');
      assert.equal(typeof session.getHistory, 'function');
    });

    it('should start with empty history', () => {
      const session = new InteractiveSession({
        onMessage: async () => {},
      });
      const history = session.getHistory();
      assert.equal(history.length, 0);
    });
  });
});

describe('renderMarkdown', () => {
  describe('headers', () => {
    it('should render h1 headers', () => {
      const result = stripAnsiCodes(renderMarkdown('# Hello'));
      assert.ok(result.includes('Hello'));
      assert.ok(result.includes('═'));
    });

    it('should render h2 headers', () => {
      const result = stripAnsiCodes(renderMarkdown('## Subtitle'));
      assert.ok(result.includes('Subtitle'));
      assert.ok(result.includes('─'));
    });

    it('should render h3 headers', () => {
      const result = stripAnsiCodes(renderMarkdown('### Small'));
      assert.ok(result.includes('Small'));
    });
  });

  describe('inline formatting', () => {
    it('should render bold text', () => {
      const result = renderMarkdown('This is **bold** text');
      assert.ok(stripAnsiCodes(result).includes('bold'));
      // Bold uses Bright ANSI code
      assert.ok(result.includes('\x1b[1m'));
    });

    it('should render italic text', () => {
      const result = renderMarkdown('This is *italic* text');
      assert.ok(stripAnsiCodes(result).includes('italic'));
      // Italic uses Dim ANSI code
      assert.ok(result.includes('\x1b[2m'));
    });

    it('should render inline code', () => {
      const result = renderMarkdown('Use `console.log` here');
      assert.ok(stripAnsiCodes(result).includes('console.log'));
      // Inline code uses Cyan
      assert.ok(result.includes('\x1b[36m'));
    });

    it('should render links', () => {
      const result = stripAnsiCodes(renderMarkdown('Visit [Google](https://google.com)'));
      assert.ok(result.includes('Google'));
      assert.ok(result.includes('https://google.com'));
    });
  });

  describe('code blocks', () => {
    it('should render fenced code blocks', () => {
      const md = '```js\nconsole.log("hi");\n```';
      const result = stripAnsiCodes(renderMarkdown(md));
      assert.ok(result.includes('js'));
      assert.ok(result.includes('console.log("hi");'));
      assert.ok(result.includes('┌'));
      assert.ok(result.includes('└'));
    });

    it('should render code blocks without language', () => {
      const md = '```\nsome code\n```';
      const result = stripAnsiCodes(renderMarkdown(md));
      assert.ok(result.includes('some code'));
      assert.ok(result.includes('┌'));
    });

    it('should handle unclosed code blocks', () => {
      const md = '```\nsome code without closing';
      const result = stripAnsiCodes(renderMarkdown(md));
      assert.ok(result.includes('some code without closing'));
    });
  });

  describe('lists', () => {
    it('should render unordered lists', () => {
      const md = '- item one\n- item two';
      const result = stripAnsiCodes(renderMarkdown(md));
      assert.ok(result.includes('•'));
      assert.ok(result.includes('item one'));
      assert.ok(result.includes('item two'));
    });

    it('should render ordered lists', () => {
      const md = '1. first\n2. second';
      const result = stripAnsiCodes(renderMarkdown(md));
      assert.ok(result.includes('1.'));
      assert.ok(result.includes('first'));
      assert.ok(result.includes('2.'));
      assert.ok(result.includes('second'));
    });
  });

  describe('blockquotes', () => {
    it('should render blockquotes', () => {
      const md = '> This is a quote';
      const result = stripAnsiCodes(renderMarkdown(md));
      assert.ok(result.includes('│'));
      assert.ok(result.includes('This is a quote'));
    });
  });

  describe('horizontal rules', () => {
    it('should render horizontal rules from dashes', () => {
      const result = stripAnsiCodes(renderMarkdown('---'));
      assert.ok(result.includes('─'));
    });

    it('should render horizontal rules from asterisks', () => {
      const result = stripAnsiCodes(renderMarkdown('***'));
      assert.ok(result.includes('─'));
    });
  });

  describe('plain text', () => {
    it('should pass through plain text', () => {
      const result = stripAnsiCodes(renderMarkdown('Hello world'));
      assert.ok(result.includes('Hello world'));
    });

    it('should handle empty input', () => {
      const result = renderMarkdown('');
      assert.equal(stripAnsiCodes(result), '');
    });
  });
});

describe('getBuiltInSlashCommands', () => {
  it('should return an array of slash commands', () => {
    const commands = getBuiltInSlashCommands();
    assert.ok(Array.isArray(commands));
    assert.ok(commands.length > 0);
  });

  it('should include /help command', () => {
    const commands = getBuiltInSlashCommands();
    const help = commands.find(c => c.name === 'help');
    assert.ok(help);
    assert.equal(typeof help!.action, 'function');
  });

  it('should include /clear command', () => {
    const commands = getBuiltInSlashCommands();
    const clear = commands.find(c => c.name === 'clear');
    assert.ok(clear);
  });

  it('should include /history command', () => {
    const commands = getBuiltInSlashCommands();
    const history = commands.find(c => c.name === 'history');
    assert.ok(history);
  });

  it('should include /tools command', () => {
    const commands = getBuiltInSlashCommands();
    const tools = commands.find(c => c.name === 'tools');
    assert.ok(tools);
  });

  it('should include /compact command', () => {
    const commands = getBuiltInSlashCommands();
    const compact = commands.find(c => c.name === 'compact');
    assert.ok(compact);
  });

  it('should include /exit command', () => {
    const commands = getBuiltInSlashCommands();
    const exit = commands.find(c => c.name === 'exit');
    assert.ok(exit);
  });

  it('every command should have name, description, and action', () => {
    const commands = getBuiltInSlashCommands();
    for (const cmd of commands) {
      assert.equal(typeof cmd.name, 'string');
      assert.ok(cmd.name.length > 0);
      assert.equal(typeof cmd.description, 'string');
      assert.ok(cmd.description.length > 0);
      assert.equal(typeof cmd.action, 'function');
    }
  });
});

describe('Tool interface validation', () => {
  it('should accept a valid tool definition', () => {
    const tool: Tool = {
      name: 'search',
      description: 'Search the web',
      parameters: [
        { name: 'query', description: 'Search query', type: 'string', required: true },
      ],
      execute: async (args) => {
        return `Results for: ${args.query}`;
      },
    };
    assert.equal(tool.name, 'search');
    assert.equal(tool.parameters!.length, 1);
    assert.equal(typeof tool.execute, 'function');
  });

  it('should accept a tool without parameters', () => {
    const tool: Tool = {
      name: 'ping',
      description: 'Ping the server',
      execute: async () => 'pong',
    };
    assert.equal(tool.name, 'ping');
    assert.equal(tool.parameters, undefined);
  });
});

describe('SlashCommand interface validation', () => {
  it('should accept a valid slash command', () => {
    const cmd: SlashCommand = {
      name: 'debug',
      description: 'Toggle debug mode',
      action: async (_args, _ctx) => {},
    };
    assert.equal(cmd.name, 'debug');
    assert.equal(typeof cmd.action, 'function');
  });
});
