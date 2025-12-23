#!/usr/bin/env node

const { CLI, ParamType } = require('../src/index.ts');

// Create a CLI instance
const cli = new CLI('example-cli', 'Example CLI with interactive config setup');

// Define setup steps for configuration
const setupSteps = [
  {
    name: 'api_key',
    description: 'Your API key for external services',
    required: true,
    type: ParamType.Password
  },
  {
    name: 'server_url',
    description: 'Server URL endpoint',
    required: true,
    type: ParamType.Url,
    defaultValue: 'https://api.example.com'
  },
  {
    name: 'environment',
    description: 'Deployment environment',
    required: true,
    type: ParamType.List,
    options: ['development', 'staging', 'production'],
    defaultValue: 'development'
  },
  {
    name: 'debug_mode',
    description: 'Enable debug logging',
    required: false,
    type: ParamType.Boolean,
    defaultValue: false
  },
  {
    name: 'user_email',
    description: 'Your email address',
    required: true,
    type: ParamType.Email
  }
];

// Add the setup command with interactive option
cli.setupCommand({
  name: 'config',
  description: 'Configure CLI settings',
  steps: setupSteps,
  onComplete: (config) => {
    console.log('Configuration completed!');
    console.log('Non-sensitive values:', {
      server_url: config.server_url,
      environment: config.environment,
      debug_mode: config.debug_mode,
      user_email: config.user_email
    });
  }
});

// Add a command that uses the config
cli.command({
  name: 'status',
  description: 'Show current configuration status',
  params: [],
  action: async () => {
    try {
      const config = await cli.loadConfig();
      console.log('\n📋 Current Configuration:');
      console.log(`   Server URL: ${config.server_url || 'Not set'}`);
      console.log(`   Environment: ${config.environment || 'Not set'}`);
      console.log(`   Debug Mode: ${config.debug_mode || 'Not set'}`);
      console.log(`   User Email: ${config.user_email || 'Not set'}`);
      console.log(`   API Key: ${config.api_key ? '✓ Configured' : '✗ Not set'}`);
    } catch (error) {
      console.log('❌ Error loading config:', error.message);
    }
  }
});

// Parse command line arguments
cli.parse(process.argv);
