// examples/example1.ts
import { CLI } from '@ideascol/cli-maker';

const cli = new CLI();

let commandGreet = {
  name: 'greet',
  description: 'Greet the user',
  params: [{ name: 'name', description: 'The name of the user to greet' }],
  action: (args) => {
    const name = args.name;
    if (name) {
      console.log(`Hello, ${name}!`);
    } else {
      console.log(`Error: Name parameter is required`);
    }
  }
}

cli.command(commandGreet);

let commandBye = {
  name: 'bye',
  description: 'Say goodbyes to the user',
  params: [{ name: 'name', description: 'The name of the user to say goodbye to' }],
  action: (args) => {
    const name = args.name;
    if (name) {
      console.log(`Goodbye, ${name}!`);
    } else {
      console.log(`Error: Name parameter is required`);
    }
  }
}

cli.command(commandBye);

cli.parse(process.argv);
