const { CLI, ParamType } = require('@ideascol/cli-maker');

const cli = new CLI("mycli", "A simple CLI");

let commandGreet = {
  name: 'greet',
  description: 'Greet the user',
  params: [{ name: 'name', description: 'The name of the user to greet', type: ParamType.Text }],
  action: (args) => {
    const name = args.name;
    if (name) {
      console.log(`Hello, ${name}!`);
    } else {
      console.log(`Error: Name parameter is required`);
    }
  }
}

let commandEmail = {
  name: 'email',
  description: 'Get the email of the user',
  params: [
    {
      name: 'email',
      description: 'The name of the user to get the email',
      type: ParamType.Email,
    },
    {
      name: 'age',
      description: 'The age of the user to get the email',
      type: ParamType.Number,
    }
  ],
  action: (args) => {
    const email = args.email;
    if (email) {
      console.log(`Email ${email}`);
    }
  }
}

cli.command(commandEmail);

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
