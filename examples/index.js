const { CLI, ParamType } = require('@ideascol/cli-maker');

const cli = new CLI("mycli", "A simple CLI", {
  askForMissingParam: true,
  version: '1.0.0',
  showAlwaysParams: true,
});

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

cli.parse(process.argv);
