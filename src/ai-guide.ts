import { Command, CommandParam, ParamType } from './interfaces';
import { Colors } from './colors';

export interface AiGuideCliInfo {
  name: string;
  description: string;
  executableName: string;
  version?: string;
  getCommands: () => Command[];
}

export function createAiGuideCommand(cli: AiGuideCliInfo): Command {
  return {
    name: 'ai-guide',
    description: 'Print machine-readable CLI spec for AI agents (JSON or markdown)',
    params: [
      {
        name: 'format',
        description: 'Output format: json (default) or markdown',
        required: false,
        type: ParamType.List,
        options: ['json', 'markdown'],
        defaultValue: 'json',
      },
      {
        name: 'command',
        description: 'Limit output to a single top-level command by name',
        required: false,
        type: ParamType.Text,
      },
      {
        name: 'pretty',
        description: 'Pretty-print JSON output (ignored for markdown)',
        required: false,
        type: ParamType.Boolean,
      },
    ],
    action: (args: any) => {
      const format = (args.format || 'json').toLowerCase();
      const allCommands = cli.getCommands();
      const commands = args.command
        ? allCommands.filter((c) => c.name === args.command)
        : allCommands;

      if (args.command && commands.length === 0) {
        console.log(`${Colors.Error}Unknown command: ${args.command}${Colors.Reset}`);
        process.exit(1);
      }

      const spec = buildSpec(cli, commands);

      if (format === 'markdown' || format === 'md') {
        console.log(renderMarkdown(spec));
      } else {
        const pretty = args.pretty !== false;
        console.log(JSON.stringify(spec, null, pretty ? 2 : 0));
      }
    },
  };
}

interface ParamSpec {
  name: string;
  description: string;
  type: string;
  required: boolean;
  options?: any[];
  hasOptionsLoader?: boolean;
  hasWhen?: boolean;
  defaultValue?: any;
  searchable?: boolean;
  pageSize?: number;
  flag: string;
}

interface CommandSpec {
  name: string;
  description: string;
  usage: string;
  params: ParamSpec[];
  subcommands?: CommandSpec[];
}

interface CliSpec {
  cli: {
    name: string;
    description: string;
    executable: string;
    version?: string;
    poweredBy: string;
    globalFlags: { name: string; description: string }[];
  };
  invocation: {
    runHelp: string;
    runVersion: string;
    runCommandHelp: string;
    flagFormats: string[];
    interactivePromptsNote: string;
    booleanFlagNote: string;
    listFlagNote: string;
    passwordFlagNote: string;
  };
  paramTypes: { type: string; meaning: string }[];
  commands: CommandSpec[];
}

function buildSpec(cli: AiGuideCliInfo, commands: Command[]): CliSpec {
  return {
    cli: {
      name: cli.name,
      description: cli.description,
      executable: cli.executableName,
      version: cli.version,
      poweredBy: '@ideascol/cli-maker',
      globalFlags: [
        { name: '--help', description: 'Show help for the CLI or a specific command' },
        { name: '--version', description: 'Print CLI version' },
        { name: '--intro-always', description: 'Force intro animation on this run' },
        { name: '--no-intro', description: 'Skip intro animation on this run' },
      ],
    },
    invocation: {
      runHelp: `${cli.executableName} --help`,
      runVersion: `${cli.executableName} --version`,
      runCommandHelp: `${cli.executableName} <command> --help`,
      flagFormats: ['--name value', '--name=value'],
      interactivePromptsNote:
        'When interactive mode is on and required params are missing, the CLI prompts the user. Pass all flags to run non-interactively.',
      booleanFlagNote: 'Boolean params: presence of the flag (or --flag true) means true.',
      listFlagNote: 'List params: value must match one of `options` exactly (case-sensitive).',
      passwordFlagNote:
        'Password params are stored encrypted via setup; reading them at runtime may prompt for a passphrase unless CLI_PASSPHRASE env var is set.',
    },
    paramTypes: [
      { type: 'text', meaning: 'free-form string' },
      { type: 'number', meaning: 'parsed as number' },
      { type: 'boolean', meaning: 'true/false flag' },
      { type: 'list', meaning: 'one of `options`' },
      { type: 'email', meaning: 'validated email' },
      { type: 'phone', meaning: 'validated phone' },
      { type: 'url', meaning: 'validated URL' },
      { type: 'password', meaning: 'hidden input; encrypted at rest when setup encryption is enabled' },
      { type: 'Package', meaning: 'npm package name, optionally scoped (@scope/name)' },
      { type: 'custom', meaning: 'free-form value, e.g. JSON string' },
    ],
    commands: commands.map((c) => specForCommand(c, cli.executableName, [])),
  };
}

function specForCommand(cmd: Command, exec: string, path: string[]): CommandSpec {
  const fullPath = [...path, cmd.name];
  const paramList = cmd.params
    .map((p) => (p.required ? `<${p.name}>` : `[${p.name}]`))
    .join(' ');
  const usage = `${exec} ${fullPath.join(' ')}${paramList ? ' ' + paramList : ''}`;
  return {
    name: cmd.name,
    description: cmd.description,
    usage,
    params: cmd.params.map(specForParam),
    subcommands: cmd.subcommands && cmd.subcommands.length > 0
      ? cmd.subcommands.map((s) => specForCommand(s, exec, fullPath))
      : undefined,
  };
}

function specForParam(p: CommandParam): ParamSpec {
  const spec: ParamSpec = {
    name: p.name,
    description: p.description,
    type: p.type || 'text',
    required: p.required === true,
    flag: `--${p.name}`,
  };
  if (p.options) spec.options = p.options;
  if (typeof p.optionsLoader === 'function') spec.hasOptionsLoader = true;
  if (typeof p.when === 'function') spec.hasWhen = true;
  if (p.defaultValue !== undefined) {
    spec.defaultValue = typeof p.defaultValue === 'function' ? '<dynamic>' : p.defaultValue;
  }
  if (p.searchable) spec.searchable = true;
  if (p.pageSize) spec.pageSize = p.pageSize;
  return spec;
}

function renderMarkdown(spec: CliSpec): string {
  const lines: string[] = [];
  lines.push(`# ${spec.cli.name}`);
  lines.push('');
  lines.push(spec.cli.description);
  lines.push('');
  lines.push(`- Executable: \`${spec.cli.executable}\``);
  if (spec.cli.version) lines.push(`- Version: \`${spec.cli.version}\``);
  lines.push(`- Powered by: \`${spec.cli.poweredBy}\``);
  lines.push('');

  lines.push('## Invocation');
  lines.push(`- Help: \`${spec.invocation.runHelp}\``);
  lines.push(`- Version: \`${spec.invocation.runVersion}\``);
  lines.push(`- Command help: \`${spec.invocation.runCommandHelp}\``);
  lines.push(`- Flag formats: ${spec.invocation.flagFormats.map((f) => `\`${f}\``).join(', ')}`);
  lines.push(`- ${spec.invocation.interactivePromptsNote}`);
  lines.push(`- ${spec.invocation.booleanFlagNote}`);
  lines.push(`- ${spec.invocation.listFlagNote}`);
  lines.push(`- ${spec.invocation.passwordFlagNote}`);
  lines.push('');

  lines.push('## Global flags');
  for (const f of spec.cli.globalFlags) lines.push(`- \`${f.name}\` — ${f.description}`);
  lines.push('');

  lines.push('## Param types');
  for (const t of spec.paramTypes) lines.push(`- \`${t.type}\` — ${t.meaning}`);
  lines.push('');

  lines.push('## Commands');
  for (const c of spec.commands) appendCommandMarkdown(lines, c, 3);

  return lines.join('\n');
}

function appendCommandMarkdown(lines: string[], cmd: CommandSpec, depth: number) {
  const hashes = '#'.repeat(Math.min(depth, 6));
  lines.push(`${hashes} \`${cmd.name}\``);
  lines.push(cmd.description);
  lines.push('');
  lines.push(`Usage: \`${cmd.usage}\``);
  lines.push('');

  if (cmd.params.length > 0) {
    lines.push('Params:');
    for (const p of cmd.params) {
      const flags: string[] = [p.required ? 'required' : 'optional', p.type];
      if (p.options) flags.push(`options: ${JSON.stringify(p.options)}`);
      if (p.hasOptionsLoader) flags.push('options loaded dynamically');
      if (p.hasWhen) flags.push('conditional');
      if (p.defaultValue !== undefined) flags.push(`default: ${JSON.stringify(p.defaultValue)}`);
      if (p.searchable) flags.push('searchable');
      lines.push(`- \`${p.flag}\` — ${p.description} (${flags.join(', ')})`);
    }
    lines.push('');
  }

  if (cmd.subcommands) {
    for (const s of cmd.subcommands) appendCommandMarkdown(lines, s, depth + 1);
  }
}
