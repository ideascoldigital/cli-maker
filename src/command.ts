import { Colors } from './colors';
import readline from 'readline';

export interface Command {
  name: string;
  description: string;
  params: { name: string; description: string }[];
  action: (args: { [key: string]: string }) => void;
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
    const missingParams = command.params.filter(p => !params[p.name]);

    if (missingParams.length > 0) {
      this.promptForMissingParams(missingParams, params).then(fullParams => {
        command.action(fullParams);
      });
    } else {
      command.action(params);
    }
  }

  private parseArgs(args: string[]): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    args.forEach(arg => {
      const [key, value] = arg.split('=');
      if (key.startsWith('--')) {
        result[key.slice(2)] = value || '';
      }
    });
    return result;
  }

  private promptForMissingParams(missingParams: { name: string; description: string }[], existingParams: { [key: string]: string }): Promise<{ [key: string]: string }> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (question: string): Promise<string> => {
      return new Promise(resolve => rl.question(question, resolve));
    };

    const prompts = missingParams.reduce((promise, param) => {
      return promise.then(async answers => {
        const answer = await askQuestion(`${Colors.FgGreen}> (${param.name}) ${param.description}:${Colors.Reset} `);
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
        console.log(`  ${Colors.FgGreen}${param.name}${Colors.Reset}: ${param.description}`);
      });
    }
  }
}
