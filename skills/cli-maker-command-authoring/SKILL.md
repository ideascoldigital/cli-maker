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
- `ParamType.List` requires `options` (or `optionsLoader`); value must be one of them.
- `ParamType.Custom` must be JSON object or array.
- Required params missing in non-interactive mode cause exit with error.

## Advanced param features (v2.1.0+)

All additive — adopt piecemeal, no breaking changes.

### Dynamic / lazy options (`optionsLoader`)
For lists whose options come from the filesystem, an API, or depend on previous answers.

```ts
{
  name: 'menu',
  type: ParamType.List,
  required: true,
  optionsLoader: (answers) => listMenusForProject(answers.projectRoot),
}
```

- Resolved at prompt time (not module load).
- Returning a Promise is fine.
- Throw to abort with an error message.

### Searchable / paginated picker
Auto-enabled when option count > `pageSize * 2` (default >20). Force with `searchable: true`.

```ts
{
  name: 'icon',
  type: ParamType.List,
  optionsLoader: () => CODICONS.map(c => c.name), // 200+ items
  pageSize: 12,
  optionLabel: (name) => `${name}  — ${categoryOf(name)}`,
}
```

UX: type-to-filter, ↑/↓ navigate, PgUp/PgDn page, Home/End jump, Esc clear filter, Enter select, Ctrl+C cancel.
`optionLabel` controls display only; the raw option reaches `action(args)`.

### Conditional params (`when`)
Skip prompts based on previous answers. Honored in interactive **and** flag modes — a `when`-false required param won't be flagged missing.

```ts
{
  name: 'url',
  type: ParamType.Url,
  required: true,
  when: (a) => a.kind === 'url',
}
```

### Default values (`defaultValue`)
Shown as `[default]` in the prompt; pressing Enter accepts it. Static or context-aware (sync or async).

```ts
{
  name: 'label',
  type: ParamType.Text,
  required: true,
  defaultValue: (a) => capitalize(a.target),
}
```

## Param order matters
Params are prompted in declaration order. Put params that feed `when` / `optionsLoader` / `defaultValue` of others **before** the dependents.

## Subcommands
- Define subcommands inside `subcommands: Command[]`.
- Help works per level:
  - `<cli> --help`
  - `<cli> <command> --help`
  - `<cli> <command> <subcommand> --help`

## Post-edit checks
1. Build/tests pass (`npm test` or `bun test`).
2. `--help` output includes the new command.
3. `<cli> ai-guide --command <new-name>` returns the new command with the expected `params[]` (flag, type, required, options, hasWhen, defaultValue, searchable). Use this as the canonical contract test — see `cli-maker-ai-guide` skill.
4. Run at least one valid invocation and one invalid invocation to validate errors.

## Built-in default commands
`new CLI(...)` auto-registers two commands: `rotate-passphrase` and `ai-guide`. Both appear in `--help` unless hidden:

```ts
new CLI('mycli', 'Demo', {
  version: '1.0.0',
  defaultCommands: { rotatePassphrase: false, aiGuide: false },
});
```

Do not redefine commands named `rotate-passphrase` or `ai-guide` unless you first hide the corresponding default — duplicate names cause unpredictable lookup.
