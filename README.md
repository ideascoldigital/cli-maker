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
