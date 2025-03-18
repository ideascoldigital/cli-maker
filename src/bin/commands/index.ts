import { Command, ParamType } from '../../interfaces';
import * as commons from './common'
import * as libraries from '../libraries'

export const createCommand: Command = {
  name: 'create',
  description: 'Generate a base project for building a CLI',
  params: [
    {
      name: "name",
      description: "The name of the library, ex: @company/awesome-cli",
      required: true,
      type: ParamType.Package
    },
    {
      name: "description",
      description: "The description of the library to create",
      required: true,
      type: ParamType.Text
    },
    {
      name: "author",
      description: "The author of the library",
      required: true,
      type: ParamType.Text
    },
    {
      name: "email",
      description: "The email of the author",
      required: true,
      type: ParamType.Email
    },
    {
      name: "package_manager",
      description: "Select your preferred package manager",
      required: true,
      type: ParamType.List,
      options: ['npm', 'bun']
    },
    {
      name: "git_init",
      description: "Do you want to initialize a git repository?",
      required: true,
      type: ParamType.List,
      options: ['yes', 'no']
    },
  ],
  action: async (args: any) => {
    const {name, description, author, email, package_manager} = args;
    const projectName = name.split('/')[1] || name;

    const isValid = await libraries.validateProjectDirectory(projectName);
    if (!isValid) {
      return;
    }

    const isEmpty = commons.isFolderEmpty();
    if (!isEmpty) {
      commons.createNewFolder(projectName);
      commons.moveToFolder(projectName);
    }

    await commons.initializeProject();
    await commons.createTsConfigFiles();
    await commons.createProjectStructure();
    await commons.createGitIgnore();
    await commons.generateGithubAction();
    await commons.generateGreetExample();
    await commons.generateLibIndex();
    await commons.generateBinTs(name, description);
    await commons.generateIndexTs(name, description);
    await commons.generateCommandExample();

    const newScripts = {
      "build": "tsc",
      "build:test": "tsc -p tsconfig.test.json",
      "test": "npm run build:test && find dist/tests -name '*.test.js' -exec node {} \\;",
      "prepublishOnly": "npm run build",
      "start": "npm run build && node ./dist/cli.js"
    };

    await libraries.addScriptsToPackageJson(newScripts, name, description, author, email);
    await commons.createBinFile();
    await commons.createReadmeFile(name, description);
    await commons.createCliTestFile(name, description);
    await commons.createTestLibFile();
    await libraries.installDependencies(package_manager, name);

    if (args.git_init === 'yes') {
      await commons.initializeGit();
    } else {
      console.log('Skipping git initialization.');
    }

    console.log('Project initialized successfully.');
  }
}
