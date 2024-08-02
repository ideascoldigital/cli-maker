import { execSync } from 'node:child_process';
import { promises as fs, readdirSync } from 'node:fs';

import * as templates from '../templates'
import * as test_templates from '../test_templates'

export async function initializeProject() {
  console.log('Generating base project...');
  execSync('npm init -y', { stdio: 'inherit' });
}

export async function createProjectStructure() {
  console.log('Creating project structure...');
  execSync('mkdir -p src/commands src/utils src/tests', { stdio: 'inherit' });
  execSync('touch src/index.ts', { stdio: 'inherit' });
  execSync('mkdir dist', { stdio: 'inherit' });
}

export async function createGitIgnore() {
  console.log('Creating .gitignore...');
  execSync('echo "node_modules/\ndist/\n*.log" > .gitignore', { stdio: 'inherit' });
}

export async function generateIndexTs(cliName: string, cliDescription: string) {
  let result = templates.templateIndex

  try {
    await fs.writeFile('src/index.ts', result);
    console.log('index.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate index.ts:', err);
  }
}

export async function generateGreetExample() {
  try {
    await createFileWithDirectories('src/lib/greet.ts', templates.templateGreet);
    console.log('greet.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate greet.ts:', err);
  }
}

export async function generateLibIndex() {
  const result = `export { Greet } from './greet';`;

  try {
    await createFileWithDirectories('src/lib/index.ts', result);
    console.log('index.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate index.ts:', err);
  }
}

export async function generateBinTs(cliName: string, cliDescription: string) {
  let result = templates.template.replace('{{cliName}}', cliName).replace('{{cliDescription}}', cliDescription);

  try {
    await fs.writeFile('src/cli.ts', result);
    console.log('index.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate index.ts:', err);
  }
}

export async function generateCommandExample() {
  try {
    await fs.writeFile('src/commands/greetCommand.ts', templates.templateCommand);
    console.log('greetCommand.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate greetCommand.ts:', err);
  }
}

export async function createFileWithDirectories(path: string, data: any) {
  const directories = path.substring(0, path.lastIndexOf('/'));
  await fs.mkdir(directories, { recursive: true });
  await fs.writeFile(path, data);
}

export async function generateGithubAction() {
  try {
    await createFileWithDirectories('.github/workflows/publish.yml', templates.githubactionTemplate)
    console.log('github action has been generated!');
  } catch (err) {
    console.error('Failed to generate github action:', err);
  }
}


export async function createTsConfigFiles() {
  try {
    await fs.writeFile('tsconfig.base.json', templates.tsconfigBaseTemplate);
    await fs.writeFile('tsconfig.json', templates.tsconfigTemplate);
    await fs.writeFile('tsconfig.test.json', templates.tsconfigTestTemplate);
    console.log('tsconfig.base.json, tsconfig.json and tsconfig.test.json have been generated!');
  } catch (err) {
    console.error('Failed to generate tsconfig files:', err);
  }
}

export async function createBinFile() {
  try {
    await createFileWithDirectories('src/bin/cli.ts', templates.templateBin);
    console.log('bin/cli.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate bin/cli.ts:', err);
  }
}

export async function createReadmeFile(cliName: string, cliDescription: string) {
  const binName: string = cliName.split('/').pop() || cliName;
  const result = templates.templateReadme.replace(/{{cliName}}/g, cliName).replace(/{{cliDescription}}/g, cliDescription).replace(/{{binName}}/g, binName);

  try {
    await fs.writeFile('README.md', result);
    console.log('README.md has been generated!');
  } catch (err) {
    console.error('Failed to generate README.md:', err);
  }
}

export async function createCliTestFile(cliName: string, cliDescription: string) {
  const result = test_templates.testCli.replace(/{{cliName}}/g, cliName).replace(/{{cliDescription}}/g, cliDescription);

  try {
    await createFileWithDirectories('src/tests/cli/cli.test.ts', result);
    console.log('cli.test.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate cli.test.ts:', err);
  }
}

export async function createTestLibFile() {
  try {
    await createFileWithDirectories('src/tests/lib/lib.test.ts', test_templates.testLib);
    console.log('lib.test.ts has been generated!');
  } catch (err) {
    console.error('Failed to generate lib.test.ts:', err);
  }
}

export async function initializeGit() {
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
export function isFolderEmpty() : boolean {
  const files = readdirSync('.');
  return files.length === 0;
}

