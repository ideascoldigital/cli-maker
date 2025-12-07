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
      node: ">=24.11.1"
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

export async function validateProjectDirectory(name: string): Promise<boolean> {
  try {
    await fs.access(name);
    console.log(`\n❌ Error: The folder "${name}" already exists.`);
    console.log('Please choose a different name or delete the existing folder.\n');
    return false;
  } catch {
    return true;
  }
}

export async function installDependencies(package_manager = 'npm', projectName: string) {
  const installCmd = package_manager === 'bun' ? 'bun add' : 'npm install';
  const devFlag = package_manager === 'bun' ? '--dev' : '--save-dev';

  console.log('Installing TypeScript and @types/node...');
  execSync(`${installCmd} ${devFlag} typescript @types/node`, { stdio: 'inherit' });

  console.log('Installing @ideascol/cli-maker...');
  execSync(`${installCmd} @ideascol/cli-maker`, { stdio: 'inherit' });
  execSync(`${package_manager} run start`, { stdio: 'inherit' });

  console.log('\n🎉 Success! Your CLI project has been created.');
  console.log(`\nNext steps:\n  cd ${projectName.split('/')[1] || projectName}\n  ${package_manager} start\n\nEnjoy building your CLI! 🚀\n`);
}
