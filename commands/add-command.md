---
description: Add or modify a command in an existing @ideascol/cli-maker CLI.
argument-hint: "[command-name]"
---

Use the `cli-maker-command-authoring` skill to add or modify a command.

Steps:
1. Locate the CLI entrypoint (typically `src/cli.ts`).
2. Add the new command file under `src/commands/`.
3. Define params with correct `ParamType` and validation rules.
4. Register the command on the CLI instance.
5. Build and smoke-test (`npm run build` then run the binary).

User arguments: $ARGUMENTS
