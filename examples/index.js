const { CLI, ParamType } = require('@ideascol/cli-maker');

const cli = new CLI("mycli", "A simple CLI", {
  version: "1.0.0",
  askForMissingParam: true,
});

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
      name: 'url',
      description: 'The URL of the user to get the email',
      type: ParamType.Url,
      required: true
    },
    {
      name: "is_ok",
      description: "Is the user ok?",
      type: ParamType.Boolean,
    },
    {
      name: 'email',
      description: 'The name of the user to get the email',
      type: ParamType.Email,
      required: true
    },
    {
      name: 'age',
      description: 'The age of the user to get the email',
      type: ParamType.Number,
    },
    {
      name: 'metadata',
      description: 'List of tags',
      type: ParamType.List,
      options: ["tag1", "tag2"],
    },
    {
      name: 'tags',
      description: '(e.g., ["tag1", "tag2"] or {"key1": "value1", "key2": "value2"})',
      type: ParamType.Custom,
    }
  ],
  action: (args) => {
    console.log('EXAMPLE DATA');
    console.log(args);
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
