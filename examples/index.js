const { 
  CLI,
  ParamType,
  createSetupCommand,
  loadSetupConfig,
  getRawConfig,
  getConfigValue,
  prompt,
  hiddenPrompt,
} = require('../src/index.ts');

const cliName = "@demo/mycli";
const setupSteps = [
  { name: 'api_key', description: 'API key', required: true, type: ParamType.Password },
  { name: 'environment', description: 'Select environment', type: ParamType.List, options: ['dev', 'staging', 'prod'], required: true },
  { name: 'telemetry', description: 'Allow metrics', type: ParamType.Boolean, defaultValue: true },
];


const cli = new CLI(cliName, "A simple CLI", {
  interactive: false,
  version: '1.0.0',
  // branding: true, // Disable branding for this example
  introAnimation: {
    enabled: true,           // Show intro once per machine (unless overridden)
    preset: 'rainbow',   // Presets: retro-space, hacker, vaporwave, radar, pixel, steampunk, sonar, rainbow
    title: 'mycli',          // Defaults to the CLI name
    subtitle: 'A simple CLI',// Defaults to the CLI description
    // Override any preset field if you want:
    // frames: ['✦', '✹', '✸', '✺'],
    // speedMs: 120,
    // loops: 2,
    lines: ['Built with cli-maker'],
    introMode: 'always',   // 'always' | 'never' | undefined (default: once)
  },
});

// Método simplificado: setupCommand infiere automáticamente el cliName
cli.setupCommand({
  steps: setupSteps,
  encryption: {
    enabled: true,
    prompt: 'Passphrase for encryption',
  },
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
    },
    {
      name: 'secret_from_setup',
      description: 'Valor secreto leído del setup (opcional)',
      type: ParamType.Password,
      required: false,
    }
  ],
  subcommands: [subcommandExample],
  action: async (args) => {
    const { ProgressIndicator } = require('../src/index.ts');
    const progress = new ProgressIndicator();

    const passphrase = await promptPassphrase();
    const setupConfig = loadSetupConfig(cliName, setupSteps, { passphrase });
    console.log('CONFIG loaded (setup):', {
      api_key: setupConfig.api_key ? setupConfig.api_key : 'no-set',
      environment: setupConfig.environment,
      telemetry: setupConfig.telemetry,
    });

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
          console.log('Secret from setup (if any):', setupConfig.api_key ? '***' : 'not set');
        }, 1000);
      }, 1000);
    }, 1000);
  }
}

cli.command(commandExample);

cli.command({
  name: 'show-config',
  description: 'Muestra API key y config desde el setup (requiere passphrase)',
  params: [],
  action: async () => {
    const passphrase = await promptPassphrase();
    const cfg = loadSetupConfig(cliName, setupSteps, { passphrase });
    console.log('\nCONFIG');
    console.log(`environment: ${cfg.environment || 'n/a'}`);
    console.log(`telemetry: ${cfg.telemetry === undefined ? 'n/a' : cfg.telemetry}`);
    console.log(`api_key: ${cfg.api_key ? '*** (cargada)' : 'no disponible (passphrase incorrecta o no configurada)'}`);
  }
});

cli.command({
  name: 'get-env',
  description: 'Obtiene solo el environment del setup usando getConfigValue (sin necesidad de setupSteps)',
  params: [],
  action: async () => {
    // No necesitas passphrase ni setupSteps para valores no-password
    const environment = getConfigValue(cliName, 'environment');
    console.log(`\nEnvironment: ${environment || 'not configured'}`);
  }
});

cli.command({
  name: 'get-all-raw',
  description: 'Obtiene toda la configuración raw (sin descifrar passwords)',
  params: [],
  action: async () => {
    const config = getRawConfig(cliName);
    console.log('\nRaw Config:');
    console.log(JSON.stringify(config, null, 2));
  }
});

cli.command({
  name: 'custom-prompts',
  description: 'Ejemplo de uso de prompt y hiddenPrompt en acciones',
  params: [],
  action: async () => {
    console.log('\nDemo de utilidades prompt y hiddenPrompt:\n');
    
    const username = await prompt('Enter your username: ');
    console.log(`Username entered: ${username}`);
    
    const password = await hiddenPrompt('Enter your password (hidden): ');
    console.log(`Password entered (length): ${password.length} characters\n`);
    
    console.log('✅ Prompts completed successfully!');
  }
});

cli.parse(process.argv);

async function promptPassphrase() {
  if (process.env.MYCLI_PASSPHRASE) return process.env.MYCLI_PASSPHRASE;
  return hiddenPrompt('Passphrase (not stored): ');
}
