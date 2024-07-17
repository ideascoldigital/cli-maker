// examples/example1.ts
import { CLI } from '@ideascol/cli-maker';

const cli = new CLI();

cli.command('greet', 'Greet the user', (name: string) => {
  console.log(`Hello, ${name}!`);
});

cli.command('bye', 'Say goodbye to the user', (name: string) => {
  console.log(`Goodbye, ${name}!`);
});

cli.parse(process.argv);