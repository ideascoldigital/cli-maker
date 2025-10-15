import readline from 'readline';
import { Colors } from '../colors';
import { ParamType, Command, CLIOptions, CommandParam } from '../interfaces';
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

  public setOptions(options: CLIOptions) {
    this.options = options;
  }

  public parse(argv: string[]) {
    const [nodePath, scriptPath, ...args] = argv;
    
    if (args.length === 0 || args[0] === '--version') {
      if (args[0] === '--version') {
        console.log(`\n${Colors.FgGreen}${this.name} version: ${this.options?.version}${Colors.Reset}\n`);
      } else {
        this.help();
      }
      return;
    }

    // Check if we're dealing with a command that has subcommands
    const commandPath = [];
    let currentArgs = [...args];
    let i = 0;
    
    // Build the command path (e.g., "create", "create project", etc.)
    while (i < args.length) {
      const potentialCommand = args[i];
      if (potentialCommand.startsWith('--')) break;
      
      commandPath.push(potentialCommand);
      currentArgs = args.slice(i + 1);
      i++;
      
      // Check if we've found a valid command path
      if (commandPath.length === 1) {
        const rootCommand = this.findCommand(commandPath[0]);
        if (!rootCommand) {
          this.showUnknownCommandError(commandPath[0]);
          return;
        }
        
        // If no subcommands or we've reached the end of args, stop here
        if (!rootCommand.subcommands || i >= args.length || args[i].startsWith('--')) break;
      } else {
        // We're looking for a subcommand
        const result = this.findSubcommand(commandPath);
        if (!result) {
          // If not found, back up one level and treat the rest as arguments
          commandPath.pop();
          currentArgs = args.slice(i);
          break;
        }
        
        // If no further subcommands or we've reached the end of args, stop here
        const { command } = result;
        if (!command.subcommands || i >= args.length || args[i].startsWith('--')) break;
      }
    }
    
    // Handle help flag for any command level
    if (currentArgs.includes('--help')) {
      if (commandPath.length === 1) {
        const command = this.findCommand(commandPath[0]);
        if (command) this.commandHelp(command);
      } else if (commandPath.length > 1) {
        const result = this.findSubcommand(commandPath);
        if (result) this.commandHelp(result.command);
      }
      return;
    }
    
    // Execute the command or subcommand
    let commandToExecute: Command | undefined;
    
    if (commandPath.length === 1) {
      commandToExecute = this.findCommand(commandPath[0]);
    } else if (commandPath.length > 1) {
      const result = this.findSubcommand(commandPath);
      if (result) commandToExecute = result.command;
    }
    
    if (!commandToExecute) {
      this.showUnknownCommandError(commandPath.join(' '));
      return;
    }
    
    const params = this.parseArgs(currentArgs, commandToExecute);
    if (params.error) {
      console.log(`\n${params.error}`);
      process.exit(1);
    }
    
    if (Object.keys(params.result!).length > 0 && this.options!.interactive) {
      this.options!.interactive = false;
    }
    
    const missingParams = this.getMissingParams(commandToExecute, params.result!);
    
    if (missingParams.length > 0 && this.options?.interactive) {
      this.handleMissingParams(commandToExecute.params, params.result!, commandToExecute);
    } else {
      if (missingParams.length > 0) {
        console.log(`\n${Colors.FgRed}error missing params${Colors.Reset}\n`);
        
        missingParams.map((param) => {
          console.log(`> ${Colors.FgRed}${param.name}${Colors.Reset}`);
          console.log(`  > ${Colors.FgGray}Type: ${param.type}${Colors.Reset}`);
          console.log(`  > ${Colors.FgGray}Description: ${param.description}${Colors.Reset}`);
          if (param.options) {
            console.log(`  > ${Colors.FgGray}Options: ${param.options}${Colors.Reset}`);
          }
        });
        
        console.log(`\n${Colors.FgYellow}Optional missing params${Colors.Reset}\n`);
        
        this.getOptionalParams(commandToExecute, params.result!).map((param) => {
          console.log(`> ${Colors.FgYellow}${param.name}${Colors.Reset}`);
          console.log(`  > ${Colors.FgGray}Type: ${param.type}${Colors.Reset}`);
          console.log(`  > ${Colors.FgGray}Description: ${param.description}${Colors.Reset}`);
          if (param.options) {
            console.log(`  > ${Colors.FgGray}Options: ${param.options}${Colors.Reset}`);
          }
        });
        
        process.exit(1);
      }
      
      commandToExecute.action(params.result!);
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
      if (cmd.subcommands && cmd.subcommands.length > 0) {
        cmd.subcommands.forEach(subcmd => {
          console.log(`${Colors.FgGreen}    ${cmd.name} ${subcmd.name}${Colors.Reset}: ${subcmd.description}`);
        });
      }
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
    
    if (command.subcommands && command.subcommands.length > 0) {
      console.log(`${Colors.FgGreen}Subcommands:${Colors.Reset}`);
      command.subcommands.forEach(subcmd => {
        console.log(`${Colors.FgGreen}  ${subcmd.name}${Colors.Reset}: ${subcmd.description}`);
      });
    }
  }

  private findCommand(commandName: string, commands: Command[] = this.commands): Command | undefined {
    return commands.find(cmd => cmd.name === commandName);
  }

  private findSubcommand(commandPath: string[]): { parentCommand: Command, command: Command } | undefined {
    if (commandPath.length < 2) return undefined;
    
    const rootCommandName = commandPath[0];
    const rootCommand = this.findCommand(rootCommandName);
    
    if (!rootCommand || !rootCommand.subcommands) return undefined;
    
    let currentCommand = rootCommand;
    let currentCommands = rootCommand.subcommands;
    let i = 1;
    
    while (i < commandPath.length - 1) {
      const subCmd = this.findCommand(commandPath[i], currentCommands);
      if (!subCmd || !subCmd.subcommands) return undefined;
      
      currentCommand = subCmd;
      currentCommands = subCmd.subcommands;
      i++;
    }
    
    const finalSubcommand = this.findCommand(commandPath[commandPath.length - 1], currentCommands);
    if (!finalSubcommand) return undefined;
    
    return { parentCommand: currentCommand, command: finalSubcommand };
  }

  private showUnknownCommandError(commandName: string) {
    console.log(`${Colors.FgRed}Unknown command: ${commandName}${Colors.Reset}`);
    this.help();
  }

  private getMissingParams(command: Command, result: any) {
    const requiredParams = command.params.filter(p => p.required === true);
    return requiredParams.filter(p => result[p.name] === undefined);
  }

  private getOptionalParams(command: Command, result: any) {
    const optionalParams = command.params.filter(p => p.required === false ||p.required === undefined);
    return optionalParams.filter(p => result[p.name] === undefined);
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
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        let key: string;
        let value: string | undefined;
        
        if (arg.includes('=')) {
          // Format: --param=value
          [key, value] = arg.split('=');
        } else {
          // Format: --param value
          key = arg;
          value = args[i + 1];
          if (value && !value.startsWith('--')) {
            i++; // Skip the next argument as it's the value
          } else {
            value = undefined;
          }
        }
        
        const paramName = key.slice(2);
        const commandParam = command.params.find(p => p.name === paramName);
        if (commandParam) {
          const validation = this.validateParam(value, commandParam.type, commandParam.required, commandParam.options, paramName);
          if (validation.error) {
            return { error: validation.error };
          }
          result[paramName] = validation.value;
        } else {
          return { error: `\nParam ${Colors.FgRed}${paramName}${Colors.Reset} ${Colors.Bright}is not allowed${Colors.Reset}` }
        }
      }
    }
    return { result };
  }

  private validateParam(value: string | undefined, type?: ParamType, isRequired?: boolean, options?: any[], paramName?: string): ValidatorResult {
    return this.validator.validateParam(value, type, isRequired, options, paramName)
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
          const isRequired = param.required ? '(required) ' : '';
          console.log(`\n${Colors.FgYellow}(${param.type}) ${Colors.Reset}${Colors.FgGreen}${param.name}${Colors.Reset} `);
          console.log(`${Colors.FgYellow}> ${Colors.Reset}${Colors.FgGray}${isRequired}${param.description}:${Colors.Reset}\n`);
          answer = await this.promptWithArrows(param);
          validation = { value: param.options[parseInt(answer, 10)] };
        } else {
          do {
            const isRequired = param.required ? '(required) ' : '(Enter to skip) ';
            const message = `\n${Colors.FgYellow}(${param.type}) ${Colors.Reset}${Colors.FgGreen}${param.name}${Colors.Reset}\n${Colors.FgYellow}> ${Colors.Reset}${Colors.FgGray}${isRequired}${param.description}:${Colors.Reset}\n`;

            answer = await askQuestion(message);
            validation = this.validateParam(answer, param.type, param.required, param.options);
            if (validation.error) {
              console.log(validation.error);
            }
          } while (validation.error);
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
          options.forEach((option, i) => {
            process.stdout.write('\x1B[2K\x1B[0G');
            if (i === index) {
              process.stdout.write(`${Colors.FgGreen}> ${option}${Colors.Reset}\n`);
            } else {
              process.stdout.write(`  ${option}\n`);
            }
          });
          process.stdout.write(`\x1B[${options.length}A`);
        };

        const clearLines = (numLines: number) => {
          for (let i = 0; i < numLines; i++) {
              process.stdout.write('\x1B[2K\x1B[1A');
          }
          process.stdout.write('\x1B[2K\x1B[0G');
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
            clearLines(options.length);
            options.forEach((option, i) => {
              if (i === index) {
                process.stdout.write(`${Colors.FgGreen}> ${option}${Colors.Reset}\n`);
              } else {
                process.stdout.write(`  ${option}\n`);
              }
            });
            process.stdout.write(`\nSelected: ${options[index]}\n`);
            resolve(index.toString());
            return;
          }
        };

        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }

        process.stdin.on('keypress', keypressHandler);
        renderOptions();
    });
}
}
