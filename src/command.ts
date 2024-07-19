import readline from 'readline';
import { Colors } from './colors';

export enum ParamType {
  Text = 'text',
  Number = 'number',
  List = 'list',
  Boolean = 'boolean',
  Email = 'email',
  Phone = 'phone'
}

export interface Command {
  name: string;
  description: string;
  params: { name: string; description: string; type?: ParamType }[];
  action: (args: { [key: string]: any }) => void;
}

export class CLI {
  private commands: Command[] = [];

  constructor(private name: string, private description: string) {}

  public command(command: Command) {
    this.commands.push(command);
  }

  public parse(argv: string[]) {
    const [nodePath, scriptPath, ...args] = argv;
    const commandName = args[0];
    if (!commandName) {
      this.help();
      return;
    }

    const command = this.commands.find(cmd => cmd.name === commandName);
    if (!command) {
      console.log(`${Colors.FgRed}Unknown command: ${commandName}${Colors.Reset}`);
      this.help();
      return;
    }

    if (args.includes('--help')) {
      this.commandHelp(command);
      return;
    }

    const params = this.parseArgs(args.slice(1));
    if (params.error) {
      console.log(params.error);
      return;
    }

    const missingParams = command.params.filter(p => params.result && !params.result[p.name]);
    if (missingParams.length > 0) {
      this.promptForMissingParams(missingParams, params.result || {}).then(fullParams => {
        command.action(fullParams);
      });
    } else {
      command.action(params.result || {});
    }
  }

  private parseArgs(args: string[]): { error?: string; result?: { [key: string]: any } } {
    const result: { [key: string]: any } = {};
    for (const arg of args) {
      const [key, value] = arg.split('=');
      if (key.startsWith('--')) {
        const paramName = key.slice(2);
        const commandParam = this.findParamType(paramName);
        let validator
        if (commandParam) {
          switch (commandParam.type) {
            case ParamType.Number:
              validator = /^[0-9]+$/;
              if (!validator.test(value)) {
                return { error: `${Colors.FgRed}Invalid number:${Colors.Reset} ${value}` };
              }
              result[paramName] = Number(value);
              break;
            case ParamType.List:
              result[paramName] = value.split(',');
              break;
            case ParamType.Boolean:
              result[paramName] = value.toLowerCase() === 'true';
              break;
            case ParamType.Email:
              validator = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!validator.test(value)) {
                return { error: `${Colors.FgRed}Invalid email:${Colors.Reset} ${value}` };
              }
              result[paramName] = value;
              break;
            default:
              result[paramName] = value;
          }
        } else {
          result[paramName] = value;
        }
      }
    }
    return { result };
  }

  private findParamType(paramName: string): { name: string; description: string; type?: ParamType } | undefined {
    return this.commands.flatMap(command => command.params).find(param => param.name === paramName);
  }

  private promptForMissingParams(missingParams: { name: string; description: string, type?: ParamType }[], existingParams: { [key: string]: any }): Promise<{ [key: string]: any }> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (question: string): Promise<string> => {
      return new Promise(resolve => rl.question(question, resolve));
    };

    const prompts = missingParams.reduce((promise, param) => {
      return promise.then(async answers => {
        const answer = await askQuestion(`${Colors.FgYellow}(${param.type})>${Colors.Reset}  ${Colors.FgGreen}(${param.name}) ${param.description}:${Colors.Reset} `);
        return { ...answers, [param.name]: answer };
      });
    }, Promise.resolve(existingParams));

    return prompts.finally(() => rl.close());
  }

  public help() {
    console.log("");
    console.log(`${Colors.Bright}Welcome to ${Colors.FgGreen}${this.name}${Colors.Reset}`);
    console.log("");
    console.log(`${Colors.FgYellow}${this.description}${Colors.Reset}`);
    console.log("");
    console.log(`${Colors.Bright}Available commands:${Colors.Reset}`);
    this.commands.forEach(cmd => {
      console.log(`${Colors.FgGreen}  ${cmd.name}${Colors.Reset}: ${cmd.description}`);
    });
    console.log("");
  }

  private commandHelp(command: Command) {
    console.log(`${Colors.Bright}Help for command: ${Colors.FgGreen}${command.name}${Colors.Reset}`);
    console.log(`${Colors.FgGreen}Description:${Colors.Reset} ${command.description}`);
    if (command.params.length > 0) {
      console.log(`${Colors.FgGreen}Parameters:${Colors.Reset}`);
      command.params.forEach(param => {
        console.log(`${Colors.FgYellow}(${param.type}) ${Colors.Reset}${Colors.FgGreen}${param.name}${Colors.Reset}: ${param.description}`);
      });
    }
  }
}
