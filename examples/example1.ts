// examples/example1.ts
import { CLI } from '@ideascol/cli-maker';

const cli = new CLI();

cli.command(
  'greet',
  'Greet the user',
  [{ name: 'name', description: 'The name of the user to greet' }],
  (args) => {
    const name = args.name;
    if (name) {
      console.log(`Hello, ${name}!`);
    } else {
      console.log(`Error: Name parameter is required`);
    }
  }
);

cli.command(
  'bye',
  'Say goodbyes to the user',
  [{ name: 'name', description: 'The name of the user to say goodbye to' }],
  (args) => {
    const name = args.name;
    console.log('args', args);
    if (name) {
      console.log(`Goodbye, ${name}!`);
    } else {
      console.log(`Error: Name parameter is required`);
    }
  }
);

cli.command(
  'other',
  'Other goodbyes to the user',
  [
    { name: 'name', description: 'The name of the user to say goodbye to' },
    { name: 'lastname', description: 'The lastname of the user to say goodbye to' }
  ],
  (args) => {
    const name = args.name;
    console.log('args', args);
    if (name) {
      console.log(`Goodbye, ${name}!`);
    } else {
      console.log(`Error: Name parameter is required`);
    }
  }
);

cli.parse(process.argv);
