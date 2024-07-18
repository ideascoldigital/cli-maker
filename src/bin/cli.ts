#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';

import { CLI } from '../command';

const cli = new CLI("cli", "A simple CLI builder");

const templateIndex = `export { Greet } from './lib';
`;

const template = `import { CLI } from '@ideascol/cli-maker';

import CommandGreet from './commands/greetCommand';

const cli = new CLI('{{cliName}}', '{{cliDescription}}');

cli.command(CommandGreet);

cli.parse(process.argv);
`;

const templateReadme = `# {{cliName}}

{{cliDescription}}

## Installation
\`\`\`
npm install -g {{cliName}}
\`\`\`

## Usage as cli
\`\`\`bash

# npm link, to test the cli locally

{{cliName}} greet --name John
\`\`\`

## Usage as library

\`\`\`ts
import { Greet } from '{{cliName}}';

Greet('John');

\`\`\`

`;

const templateGreet = `// Greet example
const Greet = (name: string) => {
  console.log(\`Hello, \${name}!\`);
}

export { Greet };
`;

const templateBin = `#!/usr/bin/env node
require('../cli.js');
`;

const templateCommand = `import { Command } from '@ideascol/cli-maker';

let commandGreet: Command = {
  name: 'greet',
  description: 'Greet the user',
  params: [{ name: 'name', description: 'The name of the user to greet' }],
  action: (args) => {
    const name = args.name;
    if (name) {
      console.log(\`Hello, \${name}!\`);
    } else {
      console.log('Error: Name parameter is required');
    }
  }
}

export default commandGreet;
`;

const githubactionTemplate = `on:
  push:
    branches: main

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: JS-DevTools/npm-publish@v3
        with:
          token: \${{ secrets.NPM_TOKEN }}
`;

const tsconfigTemplate = `{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
`;

const tsconfigBaseTemplate = `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true
  },
  "exclude": ["node_modules"]
}
`;

const tsconfigTestTemplate = `{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "."
  },
  "include": ["tests/**/*.ts", "src/**/*.ts"]
}
`

async function initializeProject() {
  console.log('Generating base project...');
  execSync('npm init -y', { stdio: 'inherit' });
}

async function installDependencies() {
  console.log('Installing TypeScript and @types/node...');
  execSync('npm install --save-dev typescript @types/node', { stdio: 'inherit' });

  console.log('Installing @ideascol/cli-maker...');
  execSync('npm install @ideascol/cli-maker', { stdio: 'inherit' });
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run start', { stdio: 'inherit' });
}


async function createProjectStructure() {
  console.log('Creating project structure...');
  execSync('mkdir -p src/commands src/utils', { stdio: 'inherit' });
  execSync('touch src/index.ts', { stdio: 'inherit' });
  execSync('mkdir dist', { stdio: 'inherit' });
  execSync('mkdir tests', { stdio: 'inherit' });
}

async function createGitIgnore() {
  console.log('Creating .gitignore...');
  execSync('echo "node_modules/\ndist/\n*.log" > .gitignore', { stdio: 'inherit' });
}

async function generateIndexTs(cliName: string, cliDescription: string) {
  let result = templateIndex

  try {
    await fs.writeFile('src/index.ts', result);
    console.log('index.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate index.ts:', err);
  }
}

async function generateGreetExample() {
  try {
    await createFileWithDirectories('src/lib/greet.ts', templateGreet);
    console.log('greet.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate greet.ts:', err);
  }
}

async function generateLibIndex() {
  const result = `export { Greet } from './greet';`;

  try {
    await createFileWithDirectories('src/lib/index.ts', result);
    console.log('index.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate index.ts:', err);
  }
}

async function generateBinTs(cliName: string, cliDescription: string) {
  let result = template.replace('{{cliName}}', cliName).replace('{{cliDescription}}', cliDescription);

  try {
    await fs.writeFile('src/cli.ts', result);
    console.log('index.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate index.ts:', err);
  }
}

async function generateCommandExample() {
  try {
    await fs.writeFile('src/commands/greetCommand.ts', templateCommand);
    console.log('greetCommand.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate greetCommand.ts:', err);
  }
}

async function createFileWithDirectories(path: string, data: any) {
  const directories = path.substring(0, path.lastIndexOf('/'));
  await fs.mkdir(directories, { recursive: true });
  await fs.writeFile(path, data);
}

async function generateGithubAction() {
  try {
    await createFileWithDirectories('.github/workflows/publish.yml', githubactionTemplate)
    console.log('github action has been generated!');
  } catch (err) {
    console.error('Failed to generate github action:', err);
  }
}

async function addScriptsToPackageJson(
  scripts: any,
  name: string,
  description: string,
  author: string, email: string
) {
  const packageJsonPath = './package.json';

  try {
    const data = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(data);

    packageJson.scripts = {
      ...packageJson.scripts,
      ...scripts
    };

    packageJson.name = name;
    packageJson.description = description
    packageJson.version = "0.0.1";
    packageJson.author = `${author} <${email}>`;

    const binName: string = name.split('/').pop() || name;
    packageJson.bin = {
      [binName]: "dist/bin/cli.js"
    };

    packageJson.main = "dist/index.js";
    packageJson.types = "dist/index.d.ts";
    packageJson.license = "MIT";
    packageJson.files = [
      "dist"
    ];

    packageJson.engines = {
      node: ">=20.15.1"
    };

    const updatedPackageJson = JSON.stringify(packageJson, null, 2);

    await fs.writeFile(packageJsonPath, updatedPackageJson, 'utf8');
    console.log('package.json updated successfully.');
  } catch (err) {
    console.error('Error updating package.json:', err);
  }
}

async function createTsConfigFiles() {
  try {
    await fs.writeFile('tsconfig.base.json', tsconfigBaseTemplate);
    await fs.writeFile('tsconfig.json', tsconfigTemplate);
    await fs.writeFile('tsconfig.test.json', tsconfigTestTemplate);
    console.log('tsconfig.base.json, tsconfig.json and tsconfig.test.json have been generated!');
  } catch (err) {
    console.error('Failed to generate tsconfig files:', err);
  }
}

async function createBinFile() {
  try {
    await createFileWithDirectories('src/bin/cli.ts', templateBin);
    console.log('bin/cli.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate bin/cli.ts:', err);
  }
}

async function createReadmeFile(cliName: string, cliDescription: string) {
  const result = templateReadme.replace('{{cliName}}', cliName).replace('{{cliDescription}}', cliDescription);

  try {
    await fs.writeFile('README.md', result);
    console.log('README.md has been generated!');
  } catch (err) {
    console.error('Failed to generate README.md:', err);
  }
}


async function initializeGit() {
  try {
    console.log('Initializing git repository...');
    execSync('git init', { stdio: 'inherit' });
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Initial commit"', { stdio: 'inherit' });
    console.log('Git repository initialized and first commit made.');
  } catch (err) {
    console.error('Failed to initialize git:', err);
  }
}

let command = {
  name: 'create',
  description: 'Generate a base project for building a CLI',
  params: [
    {
      name: "name",
      description: "The name of the library, ex: @company/awesome-cli"
    },
    {
      name: "description",
      description: "The description of the library to create"
    },
    {
      name: "author",
      description: "The author of the library"
    },
    {
      name: "email",
      description: "The email of the author"
    }
  ],
  action: async (args: any) => {
    const {name, description, author, email} = args;

    await initializeProject();
    await createTsConfigFiles();
    await createProjectStructure();
    await createGitIgnore();
    await generateGithubAction();
    await generateGreetExample();
    await generateLibIndex();
    await generateBinTs(name, description);
    await generateIndexTs(name, description); // Transform to export library lib
    await generateCommandExample();

    const newScripts = {
      "build": "tsc",
      "test": "echo \"Error: no test specified\" && exit 0",
      "prepublishOnly": "npm run build",
      "start": "npm run build && node ./dist/cli.js"
    };

    await addScriptsToPackageJson(newScripts, name, description, author, email);
    await createBinFile();
    await createReadmeFile(name, description);
    await installDependencies();
    await initializeGit();

    console.log('Project initialized successfully.');
  }
}

cli.command(command);

cli.parse(process.argv);
