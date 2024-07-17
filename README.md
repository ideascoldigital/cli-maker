# @ideascol/cli-maker

A library to help create CLIs with support for command parameters and interactive prompts.

## Installation

To install the library, use npm:

```bash
npm install @ideascol/cli-maker
```


## Usage

To use the library, import the `CliMaker` class and create a new instance of it. Then, you can add commands and prompts to the CLI.

```typescript
import { CliMaker } from '@ideascol/cli-maker';

const cli = new CliMaker();

cli.addCommand('hello', (params) => {
  console.log(`Hello, ${params.name}!`);
});

```

