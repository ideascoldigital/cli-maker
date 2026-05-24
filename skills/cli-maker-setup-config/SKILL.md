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
- List steps render with the standard list picker; lists >20 options auto-upgrade to the searchable/paginated picker.
- `SetupStep extends CommandParam`, so all advanced param features (v2.1.0+) work in setup steps too: `optionsLoader(answers)`, `when(answers)`, `defaultValue: (answers) => v`, `searchable`, `pageSize`, `optionLabel`. See the `cli-maker-command-authoring` skill for details.

## Failure handling
- Wrong passphrase: decrypted password fields may be unavailable.
- Missing setup steps in code: `getConfigValue` falls back to raw config read.
- Invalid typed input (email/url/boolean/list): re-prompt until valid during setup.

## Built-in `rotate-passphrase` command
Auto-registered by `new CLI(...)`. Re-encrypts every `__enc` field in the setup config under a new passphrase.

```bash
<cli> rotate-passphrase                          # default: no backup (secure)
<cli> rotate-passphrase --create-backup          # keep <config>.backup.<ts>
<cli> rotate-passphrase --create-backup --secure-delete-backup
<cli> rotate-passphrase --config-file=alt.json   # rotate a non-default config
```

Hide it via `CLIOptions.defaultCommands.rotatePassphrase: false` when the host CLI ships its own rotation flow.

## Verification checklist
1. `setup` command appears in help.
2. Running `setup` writes config file.
3. Command consuming a non-password key works without passphrase.
4. Command consuming password key requests passphrase or works with provided passphrase.
5. `<cli> ai-guide --command setup` lists every step as a param with correct `type`/`required`/`options`. Same for `rotate-passphrase`. See `cli-maker-ai-guide` skill.
