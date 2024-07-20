import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';

export async function addScriptsToPackageJson(
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
      "dist/**/*",
      "!src/tests/**/*"
    ];

    packageJson.engines = {
      node: ">=20.15.1"
    };

    packageJson.publishConfig = {
      access: "public"
    };

    const updatedPackageJson = JSON.stringify(packageJson, null, 2);

    await fs.writeFile(packageJsonPath, updatedPackageJson, 'utf8');
    console.log('package.json updated successfully.');
  } catch (err) {
    console.error('Error updating package.json:', err);
  }
}

export async function installDependencies() {
  console.log('Installing TypeScript and @types/node...');
  execSync('npm install --save-dev typescript @types/node', { stdio: 'inherit' });

  console.log('Installing @ideascol/cli-maker...');
  execSync('npm install @ideascol/cli-maker', { stdio: 'inherit' });
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run start', { stdio: 'inherit' });
}
