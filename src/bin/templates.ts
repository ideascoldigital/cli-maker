export const templateIndex = `export * from './lib';
`;

export const template = `import { CLI } from '@ideascol/cli-maker';

import CommandGreet from './commands/greetCommand';

const cli = new CLI('{{cliName}}', '{{cliDescription}}', {
  interactive: true,
  version: '1.0.0',
});

cli.command(CommandGreet);

cli.parse(process.argv);

export { cli };
`;

export const templateReadme = `# {{cliName}}

{{cliDescription}}

## Quick start
\`\`\`bash
# Using npm
npx {{cliName}}

# Using bun
bunx {{cliName}}
\`\`\`

## Installation

\`\`\`bash
# Using npm
npm install -g {{cliName}}

# Using bun
bun install -g {{cliName}}
\`\`\`

## Usage as cli
\`\`\`bash
# Using npm
npm link # to test the cli locally

# Using bun
bun link # to test the cli locally

{{binName}} greet --name=John
\`\`\`

## Usage as library

\`\`\`ts
import { Greet } from '{{cliName}}';

Greet('John'); // should print 'Hello, John!'

\`\`\`

`;

export const templateGreet = `// Greet example
const Greet = (name: string) => {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

export { Greet };
`;

export const templateBin = `#!/usr/bin/env node
require('../cli.js');
`;

export const templateCommand = `import { Command, ParamType } from '@ideascol/cli-maker';
import { Greet } from '../lib';

let commandGreet: Command = {
  name: 'greet',
  description: 'Greet the user',
  params: [
    {
      name: 'name',
      description: 'The name of the user to greet',
      required: true,
      type: ParamType.Text
    }],
  action: (args) => {
    const name = args.name;
    Greet(name);
  }
}

export default commandGreet;
`;

export const githubactionNpmTemplate = `on:
  push:
    branches: main
  pull_request:
    branches: main

jobs:
  test:
    if: github.event_name == 'push' || github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm test
  publish:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run build
      - uses: JS-DevTools/npm-publish@v3
        with:
          token: \${{ secrets.NPM_TOKEN }}
          access: public

`;

export const githubactionBunTemplate = `on:
  push:
    branches: main
  pull_request:
    branches: main

jobs:
  test:
    if: github.event_name == 'push' || github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install
      - run: bun test
  publish:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install
      - run: bun run build
      - uses: JS-DevTools/npm-publish@v3
        with:
          token: \${{ secrets.NPM_TOKEN }}
          access: public

`;

export const tsconfigTemplate = `{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": false
  },
  "include": ["src/**/*.ts"],
  "exclude": [
    "src/tests/**/*"
  ]
}
`;

export const tsconfigBaseTemplate = `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "declarationDir": "./dist"
  },
  "exclude": ["node_modules"]
}
`;

export const tsconfigTestTemplate = `{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src"
  },
  "include": ["tests/**/*.ts", "src/**/*.ts"]
}
`
