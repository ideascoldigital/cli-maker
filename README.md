# @ideascol/cli-maker

A library to help create CLIs with support for command parameters and interactive prompts.

[![Socket Badge](https://badge.socket.dev/npm/package/@ideascol/cli-maker/latest)](https://badge.socket.dev/npm/package/@ideascol/cli-maker/latest)

## Quick start

```bash
npx @ideascol/cli-maker
```

## Claude Code plugin

Install the bundled skills and slash commands inside Claude Code:

```bash
/plugin marketplace add ideascoldigital/cli-maker@plugin
/plugin install cli-maker@ideascoldigital
```

The `@plugin` ref points at a slim auto-generated branch (only `.claude-plugin/`, `skills/`, `commands/`), so users do not download the full library source.

Provides:
- Skills: `cli-maker-scaffold`, `cli-maker-command-authoring`, `cli-maker-setup-config`, `cli-maker-ai-guide`
- Commands: `/cli-maker:create`, `/cli-maker:add-command`, `/cli-maker:setup-config`

Plugin sources live on `main` under [`plugin-meta/`](plugin-meta/), [`skills/`](skills/), and [`commands/`](commands/). The `plugin` branch is rebuilt by `.github/workflows/publish-plugin.yml` on every push that touches those paths. Do not commit to the `plugin` branch directly.

Standalone skill install (without the plugin), copy any folder under `skills/` into `~/.claude/skills/`:

```bash
git clone --depth=1 --branch=plugin https://github.com/ideascoldigital/cli-maker /tmp/cli-maker-plugin
cp -r /tmp/cli-maker-plugin/skills/* ~/.claude/skills/
```

## Installation

To install the library, use npm:

```bash
npm install -g @ideascol/cli-maker
```

## Create your own CLI

```bash
cli-maker
```

## Usage

To use the library, import the `CliMaker` class and create a new instance of it. Then, you can add commands and prompts to the CLI.

```typescript

const { CLI, ParamType } = require('@ideascol/cli-maker');

const cli = new CLI("mycli", "A simple CLI", {
  interactive: true,
  version: '0.0.1',
  branding: true, // Show GitHub star message (default: true)
  introAnimation: {
    enabled: true,           // Show intro once per machine (unless overridden)
    preset: 'retro-space',   // Presets: retro-space, hacker, vaporwave, radar, pixel, steampunk, sonar
    title: 'mycli',          // Defaults to the CLI name
    subtitle: 'A simple CLI',// Defaults to the CLI description
    // Override any preset field if you want:
    // frames: ['✦', '✹', '✸', '✺'],
    // speedMs: 90,
    // loops: 2,
    // lines: ['Built with cli-maker'],
    // introMode: 'always',
    // asciiArt: ['custom ascii...'],
  },
});

let commandExample = {
  name: 'all-params',
  description: 'Show all params',
  params: [
    {
      name: 'favorite_fruit',
      description: 'select your favorite fruit',
      required: true,
      type: ParamType.List,
      options: ['manzana', 'pera', 'uva']
    },
    {
      name: 'url',
      description: 'The URL of your website',
      type: ParamType.Url,
      required: true
    },
    {
      name: "is_ok",
      description: "Is the user ok? (true or false)",
      type: ParamType.Boolean,
    },
    {
      name: 'email',
      description: 'The email',
      type: ParamType.Email,
      required: true
    },
    {
      name: 'age',
      description: 'The age of the user',
      type: ParamType.Number,
    },
    {
      name: 'metadata',
      description: 'List of tags',
      type: ParamType.List,
      options: ["tag1", "tag2"],
    },
    {
      name: 'tags',
      description: '(["tag1", "tag2"] or {"key1": "value1", "key2": "value2"})',
      type: ParamType.Custom,
      required: false,
    }
  ],
  action: (args) => {
    console.log('EXAMPLE DATA');
    console.log(args);
  }
}

cli.command(commandExample);

cli.parse(process.argv);

```

### Intro animation (first run)

Set `introAnimation.enabled` to `true` to display a small animated header the first time someone runs your CLI. A marker file is stored in `~/.cli-maker/<your-cli>-intro.json` so the intro is only shown once by default. You can customize the frames, title, subtitle, and extra lines or disable the persistence with `showOnce: false`.

To force the intro on any run (ignoring the stored marker), run your CLI with `--intro-always`. To skip it once, use `--no-intro`.

You can also configure this behavior via `introAnimation.introMode`:
- `introMode: 'always'` to always show.
- `introMode: 'never'` to never show.
- Omit it (default) to show once with the stored marker.
- Text animates progressively by default; set `animateText: false` to disable.

Available presets for `introAnimation.preset`:
- `retro-space` (naves y escáner)
- `hacker` (cursor parpadeante)
- `vaporwave` (frames ✦ ✺ ✹ ✸)
- `radar` (barras en arco)
- `pixel` (bloques ░▒▓█)
- `steampunk` (engranes ⚙)
- `sonar` (ondas ◉◎)
- `rainbow` (bordes y frames multicolor)

## Advanced param features (v2.1.0+)

All fields below are optional and additive. They work on both `Command` params and `SetupStep` (`SetupStep extends CommandParam`).

### Dynamic / lazy options
For lists whose contents come from the filesystem, an API, or depend on a previous answer.

```ts
{
  name: 'menu',
  type: ParamType.List,
  required: true,
  // Resolved at prompt time; receives previously collected answers
  optionsLoader: (answers) => listMenusForProject(answers.projectRoot),
}
```

### Searchable / paginated list picker
Auto-enabled when option count exceeds `pageSize * 2` (default >20). Force with `searchable: true`.

```ts
{
  name: 'icon',
  type: ParamType.List,
  optionsLoader: () => allCodicons(), // 200+ items
  pageSize: 12,
  optionLabel: (name) => `${name}  — ${categoryOf(name)}`,
}
```

Keys: type-to-filter · ↑/↓ navigate · PgUp/PgDn page · Home/End jump · Esc clear filter · Enter select · Ctrl+C cancel.
`optionLabel` is display-only; the raw option value is what reaches `action(args)`.

### Conditional params (`when`)
Skip a prompt based on previous answers. Honored in both interactive and flag modes — a `when`-false required param is not flagged missing.

```ts
{
  name: 'url',
  type: ParamType.Url,
  required: true,
  when: (a) => a.kind === 'url',
}
```

### Default values (`defaultValue`)
Shown as `[default]` in the prompt; pressing Enter accepts it. Static or context-aware (sync or async).

```ts
{
  name: 'label',
  type: ParamType.Text,
  required: true,
  defaultValue: (a) => capitalize(a.target),
}
```

### Array of items (`ParamType.Array`, v2.2.0+)
For repeated entries (menu items, allowed hosts, tags…). Each item is a sub-prompt with its own `itemParams`. Interactive mode runs an "add another?" loop; flag mode accepts a JSON array.

```ts
{
  name: 'menu',
  type: ParamType.Array,
  required: true,
  minItems: 1,
  maxItems: 10,
  itemLabel: (it) => it.label,
  itemParams: [
    { name: 'label', required: true, type: ParamType.Text, description: 'Label' },
    {
      name: 'kind', required: true, type: ParamType.List,
      options: ['command', 'url'], defaultValue: 'command',
      description: 'Action kind',
    },
    {
      name: 'command', required: true, type: ParamType.Text,
      when: (a) => a.kind === 'command',
      description: 'Command id',
    },
    {
      name: 'url', required: true, type: ParamType.Url,
      when: (a) => a.kind === 'url',
      description: 'External URL',
    },
  ],
}
```

Flag-mode equivalent:
```bash
mycli build --menu='[{"label":"Run","kind":"command","command":"hello"}]'
```

- `answers` inside `itemParams` only sees fields of the current item.
- Action receives the value as `Array<object>` (shape defined by `itemParams`).
- Without `itemParams`, each iteration prompts a single text value (primitive array).

> **Param order matters:** params are prompted in declaration order. Put producers (params feeding `when` / `optionsLoader` / `defaultValue` of others) **before** their consumers.

## Built-in default commands

Every CLI created with cli-maker auto-registers two commands. Hide either via `defaultCommands`:

```ts
new CLI('mycli', 'Demo', {
  version: '1.0.0',
  defaultCommands: {
    rotatePassphrase: false, // hide rotate-passphrase
    aiGuide: false,          // hide ai-guide
  },
});
```

### `rotate-passphrase`
Rotates the passphrase used to encrypt setup config values. Flags: `--config-file`, `--create-backup`, `--secure-delete-backup`.

### `ai-guide`
Prints a machine-readable spec of every command in the CLI (including itself + `rotate-passphrase` + your commands). Intended so an AI agent can run it once and know how to invoke the CLI end-to-end.

```bash
mycli ai-guide                       # JSON, pretty
mycli ai-guide --format markdown     # human/AI-friendly markdown
mycli ai-guide --command deploy      # spec for one top-level command
mycli ai-guide --pretty false        # compact JSON
```

Output covers: CLI metadata, global flags (`--help`, `--version`, `--intro-always`, `--no-intro`), flag formats, param-type semantics, every command with usage string, params (flag, type, required, options/loader/when/default/searchable), and subcommands.

## Setup command (step by step interactive)

You can generate a setup command for global variables:

```ts
import { CLI, ParamType } from '@ideascol/cli-maker';

const cli = new CLI('mycli', 'Demo CLI');

// Simplified method: setupCommand automatically infers the CLI name
cli.setupCommand({
  name: 'setup', // optional, defaults to 'setup'
  description: 'Configure global preferences', // optional
  steps: [
    { name: 'api_key', description: 'API key', required: true, type: ParamType.Text },
    { name: 'environment', description: 'Select environment', type: ParamType.List, options: ['dev', 'staging', 'prod'], required: true },
    { name: 'telemetry', description: 'Allow metrics', type: ParamType.Boolean, defaultValue: true },
    { name: 'secret', description: 'Secret key', type: ParamType.Password, required: true },
  ],
  encryption: {
    enabled: true,
    prompt: 'Passphrase para cifrar/descifrar',
  },
});

cli.parse(process.argv);
```

Alternatively, you can still use the standalone `createSetupCommand` function:

```ts
import { CLI, ParamType, createSetupCommand } from '@ideascol/cli-maker';

const cli = new CLI('mycli', 'Demo CLI');
const setup = createSetupCommand('mycli', { /* options */ });
cli.command(setup);
```

The stored config is saved in `~/.cli-maker/<cli>-config.json` (puedes cambiarlo con `configFileName`). Uses the previous value as default if exists, and validates according to `ParamType`.
Password fields are asked with hidden input and are stored in base64 (with `__b64` marker) to avoid leaving them in plain text. If a previous value exists, it is masked.

To read the configuration in code:

```ts
import { CLI, ParamType } from '@ideascol/cli-maker';

const cli = new CLI('mycli', 'Demo CLI');

// First, define your setup command
cli.setupCommand({
  steps: [
    { name: 'api_key', description: 'API key', type: ParamType.Password, required: true },
    { name: 'environment', description: 'Environment', type: ParamType.List, options: ['dev', 'prod'] },
  ],
  encryption: { enabled: true },
});

// Then use the CLI methods to access config
cli.command({
  name: 'deploy',
  description: 'Deploy to server',
  params: [],
  action: async () => {
    // Method 1: Load all config (automatically prompts for passphrase if Password fields exist)
    const config = await cli.loadConfig();
    console.log(config.api_key, config.environment);

    // Method 2: Get a specific value (automatically prompts for passphrase if it's a Password field)
    const apiKey = await cli.getConfigValue('api_key'); // Will prompt for passphrase
    const env = await cli.getConfigValue('environment'); // No passphrase needed (not a Password field)
    
    // Optional: Provide passphrase programmatically to avoid prompt
    const apiKeyWithPass = await cli.getConfigValue('api_key', 'my-passphrase');
  }
});
```

**Standalone functions** (still available for advanced use cases):

```ts
import { loadSetupConfig, getRawConfig, getConfigValue } from '@ideascol/cli-maker';

// Load with decryption (requires steps and passphrase)
const config = loadSetupConfig('mycli', steps, { passphrase: 'my-pass' });

// Get raw config (no decryption)
const rawConfig = getRawConfig('mycli');

// Get specific value (no decryption)
const environment = getConfigValue('mycli', 'environment');
```

## Utility Functions

### prompt and hiddenPrompt

You can use `prompt` and `hiddenPrompt` utility functions in your command actions:

```ts
import { prompt, hiddenPrompt } from '@ideascol/cli-maker';

cli.command({
  name: 'login',
  description: 'Login to the service',
  params: [],
  action: async () => {
    const username = await prompt('Enter your username: ');
    const password = await hiddenPrompt('Enter your password (hidden): ');
    
    console.log(`Logging in as ${username}...`);
    // Your login logic here
  }
});
```

- **`prompt(question: string)`**: Prompts the user for visible input
- **`hiddenPrompt(question: string)`**: Prompts the user for hidden input (password-like, input is not displayed)

### CLI Static Methods

The `CLI` class also provides static methods for prompting users, which can be used anywhere without creating a CLI instance:

```ts
import { CLI } from '@ideascol/cli-maker';

// Prompt for visible input
const name = await CLI.askQuestion('What is your name? ');
console.log(`Hello, ${name}!`);

// Prompt for hidden input (password-like)
const secret = await CLI.askHiddenQuestion('Enter your secret key: ');
console.log(`Secret received (length: ${secret.length})`);
```

- **`CLI.askQuestion(question: string)`**: Static method to prompt for visible input
- **`CLI.askHiddenQuestion(question: string)`**: Static method to prompt for hidden input (shows asterisks)

## Security

### Shell command execution in `InteractiveSession`

The `InteractiveSession` REPL supports a `!` prefix to run shell commands
(e.g. `! git status`). Because this passes user input to `child_process.execSync`,
**it is disabled by default**. Static analysis tools may still flag the
underlying call site; this is by design and is documented in [SECURITY.md](./SECURITY.md).

Opt in only when your REPL is local developer tooling and you trust the
input source:

```ts
new InteractiveSession({
  onMessage: async (msg, ctx) => { /* ... */ },
  shellCommandsEnabled: true,
  // Optional: restrict to a fixed set of command names (matched on the
  // first whitespace-delimited token).
  allowedShellCommands: ['git', 'ls', 'pwd'],
});
```

Behavior:

- `shellCommandsEnabled: false` (default) — `!` prints a disabled message; no shell call is made.
- `shellCommandsEnabled: true` with no allowlist — any shell command runs (30s timeout).
- `shellCommandsEnabled: true` with `allowedShellCommands` — only commands whose first token matches the allowlist run; others are blocked with a message.

If your CLI accepts input from untrusted sources, **do not** enable shell commands.

### Password Type in Interactive Mode

When using `ParamType.Password` in interactive mode, the input is automatically hidden from the screen, providing a secure way to collect sensitive information:

```ts
cli.command({
  name: 'secure-command',
  description: 'Command with password parameter',
  params: [
    {
      name: 'secret',
      description: 'Your secret key',
      required: true,
      type: ParamType.Password
    }
  ],
  action: (args) => {
    console.log('Secret received (length):', args.secret.length);
  }
});
```
