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

