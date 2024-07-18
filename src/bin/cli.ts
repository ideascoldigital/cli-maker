#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';

import { CLI } from '../command';

const cli = new CLI("cli", "A simple CLI builder");

const template = `import { CLI } from '@ideascol/cli-maker';

import CommandGreet from './commands/greetCommand';

const cli = new CLI('{{cliName}}', '{{cliDescription}}');

cli.command(CommandGreet);

cli.parse(process.argv);
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

async function initializeProject() {
  console.log('Generating base project...');
  execSync('npm init -y', { stdio: 'inherit' });
}

async function installDependencies() {
  console.log('Installing TypeScript and @types/node...');
  execSync('npm install --save-dev typescript @types/node', { stdio: 'inherit' });

  console.log('Installing @ideascol/cli-maker...');
  execSync('npm install @ideascol/cli-maker', { stdio: 'inherit' });
}

async function createTsConfig() {
  console.log('Creating tsconfig.json...');
  execSync('npx tsc --init', { stdio: 'inherit' });
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
  let result = template.replace('{{cliName}}', cliName).replace('{{cliDescription}}', cliDescription);

  try {
    await fs.writeFile('src/index.ts', result);
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

async function generateGithubAction() {
  try {
    await fs.writeFile('.github/workflows/publish.yml', githubactionTemplate);
    console.log('github action has been generated!');
  } catch (err) {
    console.error('Failed to generate github action:', err);
  }
}

async function addScriptsToPackageJson(scripts: any) {
  const packageJsonPath = './package.json';

  try {
    const data = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(data);

    packageJson.scripts = {
      ...packageJson.scripts,
      ...scripts
    };

    packageJson.bin = {
      "awesome-cli": "./dist/index.js"
    };

    packageJson.main = "dist/index.js";
    packageJson.types = "dist/index.d.ts";
    packageJson.author = "Your Name <your@email>";
    packageJson.license = "MIT";
    packageJson.files = [
      "dist"
    ];

    const updatedPackageJson = JSON.stringify(packageJson, null, 2);

    await fs.writeFile(packageJsonPath, updatedPackageJson, 'utf8');
    console.log('package.json updated successfully.');
  } catch (err) {
    console.error('Error updating package.json:', err);
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
  params: [],
  action: async () => {
    await initializeProject();
    await installDependencies();
    await createTsConfig();
    await createProjectStructure();
    await createGitIgnore();
    await generateGithubAction();
    await generateIndexTs('awesome-cli', 'My own library');
    await generateCommandExample();
    const newScripts = {
      "build": "tsc",
      "test": "echo \"Error: no test specified\" && exit 0",
      "prepublishOnly": "npm run build"
    };

    await addScriptsToPackageJson(newScripts);
    await initializeGit();

    console.log('Project initialized successfully.');
  }
}

cli.command(command);

cli.parse(process.argv);
