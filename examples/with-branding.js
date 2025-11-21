const { CLI, ParamType } = require('../src/index.ts');

const cli = new CLI("mycli", "A simple CLI with branding enabled", {
  interactive: false,
  version: '1.0.0',
  branding: true, // Enable branding (default)
});

let commandExample = {
  name: 'hello',
  description: 'Say hello with branding',
  params: [
    {
      name: 'name',
      description: 'Your name',
      required: true,
      type: ParamType.Text,
    }
  ],
  action: (args) => {
    console.log(`Hello, ${args.name}!`);
  }
}

cli.command(commandExample);

cli.parse(process.argv);
