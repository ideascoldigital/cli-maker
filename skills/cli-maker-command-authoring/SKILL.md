---
name: cli-maker-command-authoring
description: Adds or edits commands and parameters in a CLI built with @ideascol/cli-maker, including param typing, subcommands, help behavior, and execution checks.
---

# CLI Maker Command Authoring

Use this skill when the user asks to add/change CLI commands.

## Files to touch
- `src/commands/*.ts` for command definitions
- `src/cli.ts` to register commands with `cli.command(...)`
- optionally `src/lib/*` for command business logic

## Command contract
Each command must include:
- `name`
- `description`
- `params` array
- `action(args)`

Example skeleton:
```ts
import { Command, ParamType } from '@ideascol/cli-maker';

const myCommand: Command = {
  name: 'do-something',
  description: 'Does something useful',
  params: [
    { name: 'target', description: 'Target name', required: true, type: ParamType.Text },
    { name: 'dry_run', description: 'Preview mode', type: ParamType.Boolean }
  ],
  action: (args) => {
    console.log(args.target, args.dry_run);
  }
};

export default myCommand;
```

## Param behavior to respect
- Parsing formats accepted:
  - `--param=value`
  - `--param value`
- `ParamType.Boolean` expects explicit value: `--flag=true` or `--flag=false`.
- `ParamType.List` requires `options` and value must be one of them.
- `ParamType.Custom` must be JSON object or array.
- Required params missing in non-interactive mode cause exit with error.

## Subcommands
- Define subcommands inside `subcommands: Command[]`.
- Help works per level:
  - `<cli> --help`
  - `<cli> <command> --help`
  - `<cli> <command> <subcommand> --help`

## Post-edit checks
1. Build/tests pass (`npm test` or `bun test`).
2. `--help` output includes the new command.
3. Run at least one valid invocation and one invalid invocation to validate errors.
