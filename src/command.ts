export interface Command {
  name: string;
  description: string;
  action: (...args: string[]) => void;
}
  
export class CLI {
  private commands: Command[] = [];

  public command(name: string, description: string, action: (...args: string[]) => void) {
    this.commands.push({ name, description, action });
  }

  public parse(argv: string[]) {
    const [nodePath, scriptPath, ...args] = argv;

    const commandName = args[0];
    const command = this.commands.find(cmd => cmd.name === commandName);

    if (!command) {
      console.log(`Unknown command: ${commandName}`);
      this.help();
      return;
    }

    command.action(...args.slice(1));
  }

  public help() {
    console.log('Available commands:');
    this.commands.forEach(cmd => {
      console.log(`  ${cmd.name}: ${cmd.description}`);
    });
  }
}