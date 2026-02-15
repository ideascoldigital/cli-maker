---
name: cli-maker-setup-config
description: Implements and uses interactive setup/config flows in @ideascol/cli-maker, including encrypted password fields, default values, and config reads in commands.
---

# CLI Maker Setup Config

Use this skill when the user needs persistent CLI configuration (`setup`) and secrets handling.

## Goal
Create a `setup` command that stores config in `~/.cli-maker/<cli>-config.json` and consume values safely from other commands.

## Implementation workflow
1. Define setup steps in `src/cli.ts`.
```ts
cli.setupCommand({
  steps: [
    { name: 'api_key', description: 'API key', required: true, type: ParamType.Password },
    { name: 'environment', description: 'Environment', required: true, type: ParamType.List, options: ['dev', 'staging', 'prod'] },
    { name: 'telemetry', description: 'Allow telemetry', type: ParamType.Boolean, defaultValue: true }
  ],
  encryption: { enabled: true, prompt: 'Passphrase to encrypt/decrypt' }
});
```

2. Add commands that read config.
- Full config: `await cli.loadConfig()`
- Specific key: `await cli.getConfigValue('environment')`
- For password fields, pass passphrase or let CLI prompt interactively.

3. Run setup and verify persisted values.
- Execute: `<cli> setup`
- Validate file exists in `~/.cli-maker/`.

## Behavior details
- Password values are stored encoded (`__b64`) or encrypted (`__enc`) depending on encryption config.
- Existing values are reused as defaults in setup prompts.
- List steps in setup are selected by numeric index.

## Failure handling
- Wrong passphrase: decrypted password fields may be unavailable.
- Missing setup steps in code: `getConfigValue` falls back to raw config read.
- Invalid typed input (email/url/boolean/list): re-prompt until valid during setup.

## Verification checklist
1. `setup` command appears in help.
2. Running `setup` writes config file.
3. Command consuming a non-password key works without passphrase.
4. Command consuming password key requests passphrase or works with provided passphrase.
