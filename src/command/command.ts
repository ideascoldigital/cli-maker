import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { Colors } from '../colors';
import { ParamType, Command, CLIOptions, CommandParam } from '../interfaces';
import { Validator, ValidatorResult } from './validator';
import { formatParameterTable } from '../common';

export class CLI {
  private commands: Command[] = [];
  private validator: Validator;
  public executableName: string;

  constructor(private name: string, private description: string, private options?: CLIOptions) {
    if (this.options == null) {
      this.options = { interactive: true, version: '1.0.0', branding: true };
    } else if (this.options.branding === undefined) {
      this.options.branding = true;
    }
    this.validator = new Validator();

    // Auto-detect name from package.json bin if available
    const binName = this.getBinName();
    if (binName) {
      this.executableName = binName;
    } else {
      this.executableName = this.name;
    }
  }

  private getBinName(): string | null {
    try {
      const scriptDir = path.dirname(process.argv[1]);
      const packageJsonPath = path.join(scriptDir, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const bin = packageJson.bin;
      if (typeof bin === 'string') {
        return bin;
      } else if (typeof bin === 'object' && bin !== null) {
        // Return the first bin key
        const keys = Object.keys(bin);
        return keys.length > 0 ? keys[0] : null;
      }
    } catch (error) {
      // Ignore errors (file not found, invalid JSON, etc.)
    }
    return null;
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
        console.log(`\n${Colors.FgGreen}${this.executableName} version: ${this.options?.version}${Colors.Reset}\n`);
      } else {
        this.help();
      }
      return;
    }

    // Handle global help (when --help is the only argument)
    if (args.length === 1 && args[0] === '--help') {
      this.help();
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
        if (command) this.commandHelp(command, commandPath);
      } else if (commandPath.length > 1) {
        const result = this.findSubcommand(commandPath);
        if (result) this.commandHelp(result.command, commandPath);
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
        console.log(`\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Missing required parameters${Colors.Reset}\n`);

        missingParams.forEach((param) => {
          console.log(`${Colors.FgRed}❌ ${Colors.Bright}${param.name}${Colors.Reset}${Colors.FgRed} (${param.type})${Colors.Reset}`);
          console.log(`   ${Colors.FgGray}${param.description}${Colors.Reset}`);
          if (param.options) {
            console.log(`   ${Colors.FgGray}Options: ${param.options.join(', ')}${Colors.Reset}`);
          }
          console.log('');
        });

        const optionalParams = this.getOptionalParams(commandToExecute, params.result!);
        if (optionalParams.length > 0) {
          console.log(`${Colors.FgYellow}⚠️  Optional parameters you can provide:${Colors.Reset}\n`);

          optionalParams.forEach((param) => {
            console.log(`${Colors.FgYellow}○ ${param.name}${Colors.Reset}${Colors.FgYellow} (${param.type})${Colors.Reset}`);
            console.log(`  ${Colors.FgGray}${param.description}${Colors.Reset}`);
            if (param.options) {
              console.log(`  ${Colors.FgGray}Options: ${param.options.join(', ')}${Colors.Reset}`);
            }
            console.log('');
          });
        }

        console.log(`${Colors.FgGray}Try '${Colors.Bright}${this.executableName} ${commandToExecute.name} --help${Colors.Reset}${Colors.FgGray}' for more information.${Colors.Reset}\n`);
        process.exit(1);
      }

      commandToExecute.action(params.result!);
      this.showBranding();
    }
  }

  public help() {
    console.log(`\n${Colors.BgGreen}${Colors.FgBlack} ${this.name} ${Colors.Reset}`);
    console.log(`${Colors.FgGreen}${this.description}${Colors.Reset}\n`);

    console.log(`${Colors.Bright}${Colors.FgCyan}USAGE${Colors.Reset}`);
    console.log(`  ${Colors.FgGray}$ ${this.executableName} <command> [options]${Colors.Reset}\n`);

    console.log(`${Colors.Bright}${Colors.FgCyan}COMMANDS${Colors.Reset}`);
    this.commands.forEach(cmd => {
      console.log(`  ${Colors.FgGreen}${cmd.name.padEnd(15)}${Colors.Reset}${cmd.description}`);
      if (cmd.subcommands && cmd.subcommands.length > 0) {
        cmd.subcommands.forEach(subcmd => {
          console.log(`    ${Colors.FgGreen}${cmd.name} ${subcmd.name}${Colors.Reset}: ${subcmd.description}`);
        });
      }
    });
    console.log('');

    console.log(`${Colors.Bright}${Colors.FgCyan}OPTIONS${Colors.Reset}`);
    console.log(`  ${Colors.FgYellow}--help${Colors.Reset}${Colors.FgGray.padEnd(12)}Show help for a command${Colors.Reset}`);
    console.log(`  ${Colors.FgYellow}--version${Colors.Reset}${Colors.FgGray.padEnd(10)}Show version information${Colors.Reset}\n`);

    console.log(`${Colors.FgGray}Run '${Colors.Bright}${this.executableName} <command> --help${Colors.Reset}${Colors.FgGray}' for detailed help on a specific command.${Colors.Reset}\n`);
  }

  private showBranding() {
    if (this.options?.branding) {
      console.log(`\n${Colors.FgGray}─────────────────────────────────────────────────────────────────${Colors.Reset}`);
      console.log(`${Colors.FgYellow}⭐ ${Colors.Bright}Like this CLI? Star us on GitHub!${Colors.Reset}`);
      console.log(`${Colors.FgGray}   https://github.com/ideascoldigital/cli-maker${Colors.Reset}`);
      console.log(`${Colors.FgGray}─────────────────────────────────────────────────────────────────${Colors.Reset}\n`);
    }
  }

  private commandHelp(command: Command, fullCommandPath: string[]) {
    const fullCommand = fullCommandPath.join(' ');
    console.log(`\n${Colors.BgGreen}${Colors.FgBlack} ${this.name} ${fullCommand} ${Colors.Reset}`);
    console.log(`${Colors.FgGreen}${command.description}${Colors.Reset}\n`);

    console.log(`${Colors.Bright}${Colors.FgCyan}USAGE${Colors.Reset}`);
    const paramList = command.params.map(p => `${p.required ? '<' : '['}${p.name}${p.required ? '>' : ']'} `).join('');
    console.log(`  ${Colors.FgGray}$ ${this.executableName} ${fullCommand} ${paramList}${Colors.Reset}\n`);

    if (command.params.length > 0) {
      console.log(`${Colors.Bright}${Colors.FgCyan}PARAMETERS${Colors.Reset}\n`);
      console.log(formatParameterTable(command.params));
      console.log('');
    }

    if (command.subcommands && command.subcommands.length > 0) {
      console.log(`${Colors.Bright}${Colors.FgCyan}SUBCOMMANDS${Colors.Reset}`);
      command.subcommands.forEach(subcmd => {
        console.log(`  ${Colors.FgGreen}${subcmd.name}${Colors.Reset}: ${subcmd.description}`);
      });
      console.log('');
    }

    console.log(`${Colors.Bright}${Colors.FgCyan}EXAMPLES${Colors.Reset}`);
    console.log(`  ${Colors.FgGray}$ ${this.executableName} ${fullCommand} --help${Colors.Reset}`);
    if (command.params.some(p => p.required)) {
      const exampleParams = command.params.filter(p => p.required).slice(0, 2).map(p => {
        if (p.type === ParamType.List && p.options) {
          return `--${p.name} ${p.options[0]}`;
        } else if (p.type === ParamType.Boolean) {
          return `--${p.name}`;
        } else {
          return `--${p.name} value`;
        }
      }).join(' ');
      console.log(`  ${Colors.FgGray}$ ${this.executableName} ${fullCommand} ${exampleParams}${Colors.Reset}`);
    }
    console.log('');
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
    console.log(`\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Unknown command: '${Colors.Bright}${commandName}${Colors.Reset}${Colors.FgRed}'${Colors.Reset}\n`);
    console.log(`${Colors.FgYellow}Available commands:${Colors.Reset}\n`);
    this.commands.forEach(cmd => {
      console.log(`  ${Colors.FgGreen}${cmd.name}${Colors.Reset}: ${cmd.description}`);
      if (cmd.subcommands && cmd.subcommands.length > 0) {
        cmd.subcommands.forEach(subcmd => {
          console.log(`    ${Colors.FgGreen}${cmd.name} ${subcmd.name}${Colors.Reset}: ${subcmd.description}`);
        });
      }
    });
    console.log(`\n${Colors.FgGray}Try '${Colors.Bright}${this.executableName} --help${Colors.Reset}${Colors.FgGray}' for more information.${Colors.Reset}\n`);
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
          return {
            error: `\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Unknown parameter: '${Colors.Bright}${paramName}${Colors.Reset}${Colors.FgRed}'${Colors.Reset}\n${Colors.FgGray}       Available parameters: ${command.params.map(p => p.name).join(', ')}${Colors.Reset}\n`
          }
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

    console.log(`\n${Colors.BgBlue}${Colors.FgWhite} INTERACTIVE MODE ${Colors.Reset} ${Colors.FgBlue}Please provide the following information:${Colors.Reset}\n`);

    const prompts = missingParams.reduce((promise, param) => {
      return promise.then(async answers => {
        let answer: string;
        let validation: { error?: string; value?: any };

        // Show parameter header
        const requiredIndicator = param.required ? `${Colors.FgRed}*${Colors.Reset}` : `${Colors.FgGray}○${Colors.Reset}`;
        console.log(`${requiredIndicator} ${Colors.Bright}${param.name}${Colors.Reset} ${Colors.FgGray}(${param.type})${Colors.Reset}`);
        console.log(`  ${Colors.FgGray}${param.description}${Colors.Reset}`);

        if (param.options && param.options.length > 0) {
          console.log(`  ${Colors.FgGray}Options: ${param.options.join(', ')}${Colors.Reset}`);
        }
        console.log('');

        if (param.type === ParamType.List && param.options) {
          console.log(`${Colors.FgCyan}Use ↑/↓ arrow keys to navigate, Enter to select:${Colors.Reset}`);
          answer = await this.promptWithArrows(param);
          validation = { value: param.options[parseInt(answer, 10)] };
          console.log(`${Colors.Success}✓ Selected: ${validation.value}${Colors.Reset}\n`);
        } else {
          let attemptCount = 0;
          do {
            if (attemptCount > 0) {
              console.log(`${Colors.FgYellow}Please try again:${Colors.Reset}`);
            }

            const promptText = param.required
              ? `${Colors.FgGreen}Enter value${Colors.Reset} ${Colors.FgGray}(required)${Colors.Reset}: `
              : `${Colors.FgGreen}Enter value${Colors.Reset} ${Colors.FgGray}(or press Enter to skip)${Colors.Reset}: `;

            answer = await askQuestion(promptText);
            validation = this.validateParam(answer, param.type, param.required, param.options);

            if (validation.error) {
              console.log(validation.error);
              attemptCount++;
            } else if (validation.value !== undefined) {
              console.log(`${Colors.Success}✓ Accepted${Colors.Reset}\n`);
            } else {
              console.log(`${Colors.FgGray}○ Skipped${Colors.Reset}\n`);
            }
          } while (validation.error);
        }
        return { ...answers, [param.name]: validation.value };
      });
    }, Promise.resolve(existingParams));

    return prompts.finally(() => {
      rl.close();
      console.log(`${Colors.Success}✅ All parameters collected successfully!${Colors.Reset}\n`);
    });
  }

  private async promptWithArrows(param: { name: string; description: string, type?: ParamType; required?: boolean; options?: any[] }): Promise<string> {
    return new Promise(resolve => {
        let index = 0;
        const options = param.options!;

        const renderOptions = () => {
          console.clear();
          console.log(`${Colors.BgBlue}${Colors.FgWhite} SELECT OPTION ${Colors.Reset} ${Colors.FgBlue}for ${param.name}${Colors.Reset}\n`);

          options.forEach((option, i) => {
            const prefix = i === index ? `${Colors.FgGreen}❯ ${option}${Colors.Reset}` : `  ${option}`;
            const indicator = i === index ? ` ${Colors.FgCyan}← Current selection${Colors.Reset}` : '';
            console.log(`${prefix}${indicator}`);
          });

          console.log(`\n${Colors.FgGray}Use ↑/↓ to navigate, Enter to confirm, Ctrl+C to cancel${Colors.Reset}`);
          console.log(`${Colors.FgGray}Selected: ${options[index]}${Colors.Reset}`);
        };

        const clearScreen = () => {
          // Clear from cursor to end of screen
          process.stdout.write('\x1B[0J');
          // Move cursor to top
          process.stdout.write('\x1B[0;0H');
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
            clearScreen();
            resolve(index.toString());
            return;
          } else if (key.ctrl && key.name === 'c') {
            process.stdin.removeListener('keypress', keypressHandler);
            clearScreen();
            console.log(`${Colors.Warning}⚠️  Selection cancelled${Colors.Reset}\n`);
            process.exit(0);
          }
        };

        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }

        renderOptions();
    });
}
}
