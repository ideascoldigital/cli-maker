// src/command.ts
import { Colors } from './colors';

export interface Command {
  name: string;
  description: string;
  params: { name: string; description: string }[];
  action: (...args: string[]) => void;
}

export class CLI {
  private commands: Command[] = [];

  public command(name: string, description: string, params: { name: string; description: string }[], action: (...args: string[]) => void) {
    this.commands.push({ name, description, params, action });
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

    command.action(...args.slice(1));
  }

  public help() {
    console.log(`${Colors.Bright}Available commands:${Colors.Reset}`);
    this.commands.forEach(cmd => {
      console.log(`${Colors.FgGreen}  ${cmd.name}${Colors.Reset}: ${cmd.description}`);
    });
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
