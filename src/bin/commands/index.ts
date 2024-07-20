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
      type: ParamType.Text
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
    }
  ],
  action: async (args: any) => {
    const {name, description, author, email} = args;

    await commons.initializeProject();
    await commons.createTsConfigFiles();
    await commons.createProjectStructure();
    await commons.createGitIgnore();
    await commons.generateGithubAction();
    await commons.generateGreetExample();
    await commons.generateLibIndex();
    await commons.generateBinTs(name, description);
    await commons.generateIndexTs(name, description); // Transform to export library lib
    await commons.generateCommandExample();

    const newScripts = {
      "build": "tsc",
      "build:test": "tsc -p tsconfig.test.json",
      "test": "npm run build:test && for file in dist/tests/*.test.js; do node \"$file\"; done",
      "prepublishOnly": "npm run build",
      "start": "npm run build && node ./dist/cli.js"
    };

    await libraries.addScriptsToPackageJson(newScripts, name, description, author, email);
    await commons.createBinFile();
    await commons.createReadmeFile(name, description);
    await commons.createCliTestFile(name, description);
    await commons.createTestLibFile();
    await libraries.installDependencies();
    await commons.initializeGit();

    console.log('Project initialized successfully.');
  }
}
