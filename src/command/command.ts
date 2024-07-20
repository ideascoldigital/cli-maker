import readline from 'readline';
import { Colors } from '../colors';
import { ParamType, Command, CLIOptions } from '../interfaces';
import { Validator, ValidatorResult } from './validator';

export class CLI {
  private commands: Command[] = [];
  private validator: Validator;

  constructor(private name: string, private description: string, private options?: CLIOptions) {
    if (this.options == null) {
      this.options = { interactive: true, version: '1.0.0' };
    }
    this.validator = new Validator()
  }

  public getCommands() {
    return this.commands;
  }

  public getName() {
    return this.name;
  }

  public getDescription() {
    return this.description;
  }

  public getOptions() {
    return this.options;
  }

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

    const command = this.findCommand(commandName);
    if (!command) {
      this.showUnknownCommandError(commandName);
      return;
    }

    if (args.includes('--help')) {
      this.commandHelp(command);
      return;
    }

    const params = this.parseArgs(args.slice(1), command);
    if (params.error) {
      console.log(params.error);
      return;
    }

    const missingParams = this.getMissingParams(command, params.result!);
    if (missingParams.length > 0) {
      this.handleMissingParams(missingParams, params.result!, command);
    } else {
      command.action(params.result!);
    }
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
        console.log(`${Colors.FgYellow}(${param.type}) ${Colors.Reset}${Colors.FgGreen}${param.name}${Colors.Reset}: ${param.description} ${param.required ? '(required)' : ''}`);
      });
    }
  }

  private findCommand(commandName: string) {
    return this.commands.find(cmd => cmd.name === commandName);
  }

  private showUnknownCommandError(commandName: string) {
    console.log(`${Colors.FgRed}Unknown command: ${commandName}${Colors.Reset}`);
    this.help();
  }

  private getMissingParams(command: Command, result: any) {
    const requiredParams = command.params.filter(p => p.required === true);
    return requiredParams.filter(p => result[p.name] === undefined);
  }

  private handleMissingParams(missingParams: any[], result: any, command: Command) {
    if (this.options!.interactive) {
      this.promptForMissingParams(missingParams, result).then(fullParams => {
        command.action(fullParams);
      });
    } else {
      console.log(`${Colors.FgRed}Missing required parameters:${Colors.Reset} ${missingParams.map(p => p.name).join(', ')}`);
      process.exit(1);
    }
  }

  private parseArgs(args: string[], command: Command): { error?: string; result?: { [key: string]: any } } {
    const result: { [key: string]: any } = {};
    for (const arg of args) {
      const [key, value] = arg.split('=');
      if (key.startsWith('--')) {
        const paramName = key.slice(2);
        const commandParam = command.params.find(p => p.name === paramName);
        if (commandParam) {
          const validation = this.validateParam(value, commandParam.type, commandParam.required, commandParam.options);
          if (validation.error) {
            return { error: validation.error };
          }
          result[paramName] = validation.value;
        } else {
          result[paramName] = value;
        }
      }
    }
    return { result };
  }

  private validateParam(value: string | undefined, type?: ParamType, isRequired?: boolean, options?: any[]): ValidatorResult {
    return this.validator.validateParam(value, type, isRequired, options)
  }

  private findParamType(paramName: string): { name: string; description: string; type?: ParamType; required?: boolean; options?: any[] } | undefined {
    return this.commands.flatMap(command => command.params).find(param => param.name === paramName);
  }

  private async promptForMissingParams(missingParams: { name: string; description: string, type?: ParamType; required?: boolean; options?: any[] }[], existingParams: { [key: string]: any }): Promise<{ [key: string]: any }> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (question: string): Promise<string> => {
      return new Promise(resolve => rl.question(question, resolve));
    };

    const prompts = missingParams.reduce((promise, param) => {
      return promise.then(async answers => {
        let answer: string;
        let validation: { error?: string; value?: any };
        if (param.type === ParamType.List && param.options) {
          const isRequired = param.required ? 'required' : '';
          console.log(`${Colors.FgYellow}(${param.type})>${Colors.Reset}  ${Colors.FgGreen}(${param.name}-${isRequired}) ${param.description}:${Colors.Reset} `);
          answer = await this.promptWithArrows(param);
          validation = { value: param.options[parseInt(answer, 10)] };
        } else {
          do {
            const isRequired = param.required ? 'required' : '';
            answer = await askQuestion(`${Colors.FgYellow}(${param.type})>${Colors.Reset}  ${Colors.FgGreen}(${param.name}-${isRequired}) ${param.description}:${Colors.Reset} `);
            validation = this.validateParam(answer, param.type, param.required, param.options);
            if (validation.error) {
              console.log(validation.error);
            }
          } while (validation.error && param.required);
        }
        return { ...answers, [param.name]: validation.value };
      });
    }, Promise.resolve(existingParams));

    return prompts.finally(() => rl.close());
  }

  private async promptWithArrows(param: { name: string; description: string, type?: ParamType; required?: boolean; options?: any[] }): Promise<string> {
    return new Promise(resolve => {
        let index = 0;
        const options = param.options!;
        const renderOptions = () => {
            process.stdout.write('\x1B[2K\x1B[0G');
            options.forEach((option, i) => {
                if (i === index) {
                    process.stdout.write(`${Colors.FgGreen}> ${option}${Colors.Reset}\n`);
                } else {
                    process.stdout.write(`  ${option}\n`);
                }
            });
            process.stdout.write('\x1B[1A'.repeat(options.length)); // Move the cursor back up
        };

        const keypressHandler = (str: string, key: readline.Key) => {
            if (key.name === 'up') {
                index = (index > 0) ? index - 1 : options.length - 1;
                renderOptions();
            } else if (key.name === 'down') {
                index = (index + 1) % options.length;
                renderOptions();
            } else if (key.name === 'return') {
                process.stdin.removeListener('keypress', keypressHandler);
                resolve(index.toString());
            }
        };

        process.stdin.on('keypress', keypressHandler);
        renderOptions();
    });
  }
}
