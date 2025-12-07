# @ideascol/cli-maker

A library to help create CLIs with support for command parameters and interactive prompts.

## Quick start

```bash
npx @ideascol/cli-maker
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
