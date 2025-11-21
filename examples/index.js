const { CLI, ParamType } = require('../src/index.ts');

const cli = new CLI("mycli", "A simple CLI", {
  interactive: false,
  version: '1.0.0',
  // branding: true, // Disable branding for this example
});

const subcommandExample = {
  name: 'subcommand-example',
  description: 'Subcommand example',
  params: [],
  action: () => {
    console.log('Subcommand example');
  }
}

let commandExample = {
  name: 'all-params',
  description: 'Show all params',
  params: [
    {
      name: 'favorite_fruit',
      description: 'select your favorite fruit',
      required: true,
      type: ParamType.List,
      options: ['manzana', 'pera', 'uva']
    },
    {
      name: 'url',
      description: 'The URL of your website',
      type: ParamType.Url,
      required: true
    },
    {
      name: "is_ok",
      description: "Is the user ok? (true or false)",
      type: ParamType.Boolean,
    },
    {
      name: 'email',
      description: 'The email',
      type: ParamType.Email,
      required: true
    },
    {
      name: 'age',
      description: 'The age of the user',
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
      description: '(["tag1", "tag2"] or {"key1": "value1", "key2": "value2"})',
      type: ParamType.Custom,
      required: false,
    }
  ],
  subcommands: [subcommandExample],
  action: (args) => {
    const { ProgressIndicator } = require('../src/index.ts');
    const progress = new ProgressIndicator();

    console.log('Starting processing...');
    progress.start('Processing data');

    setTimeout(() => {
      progress.update('Validating inputs');
      setTimeout(() => {
        progress.update('Saving results');
        setTimeout(() => {
          progress.success('All done!');
          console.log('EXAMPLE DATA:');
          console.log(args);
        }, 1000);
      }, 1000);
    }, 1000);
  }
}

cli.command(commandExample);

cli.parse(process.argv);
