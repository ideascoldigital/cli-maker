---
name: cli-maker-ai-guide
description: Learn any CLI built with @ideascol/cli-maker in one shot by running the built-in `ai-guide` command. Use before invoking unfamiliar cli-maker CLIs so flags, types, required params, and subcommands are known with certainty.
---

# CLI Maker AI Guide

Every CLI built with `@ideascol/cli-maker` v2.2+ auto-registers an `ai-guide` command that prints a complete, machine-readable spec of itself. Use it instead of guessing flags or scraping `--help`.

## When to use
- Before invoking a cli-maker CLI you have never used.
- Before recommending exact flag values to the user.
- When `--help` output is ambiguous (param types, list options, defaults, subcommand paths).
- When writing scripts/agents that call the CLI non-interactively.

## How to invoke
```bash
<cli> ai-guide                    # JSON (pretty) — preferred for parsing
<cli> ai-guide --format markdown  # readable summary for the human
<cli> ai-guide --command <name>   # narrow to one top-level command
<cli> ai-guide --pretty false     # compact JSON (smaller token cost)
```

Run with `--no-intro` if the CLI ships an intro animation: `<cli> --no-intro ai-guide`.

## What the spec contains
- `cli`: `name`, `description`, `executable`, `version`, `poweredBy`, `globalFlags` (`--help`, `--version`, `--intro-always`, `--no-intro`).
- `invocation`: flag formats (`--name value`, `--name=value`), interactive-prompt note, boolean/list/password handling.
- `paramTypes`: semantics for `text`, `number`, `boolean`, `list`, `email`, `phone`, `url`, `password`, `Package`, `custom`.
- `commands[]`: each with `name`, `description`, `usage` string, `params[]` (`flag`, `type`, `required`, `options`, `hasOptionsLoader`, `hasWhen`, `defaultValue`, `searchable`, `pageSize`), and recursive `subcommands[]`.

## Rules for using the spec
- `required: true` params must be supplied as `--<flag> value` in non-interactive mode.
- `type: "list"` → value must be exactly one of `options` (case-sensitive). When `hasOptionsLoader: true` and `options` is absent, run the command interactively or ask the user to enumerate them.
- `type: "boolean"` → pass `--<flag>=true` / `--<flag>=false`.
- `type: "password"` → never pass on command line; rely on the setup flow / `CLI_PASSPHRASE` env var.
- `hasWhen: true` → param may be skipped depending on prior answers; do not flag it missing when its condition is false.
- `defaultValue: "<dynamic>"` → resolved at prompt time; CLI computes it from other answers.

## Hiding the command
The host CLI can opt out via `CLIOptions.defaultCommands.aiGuide: false`. If `ai-guide` is absent, fall back to `<cli> --help` per command and document params manually.

## Related defaults
`rotate-passphrase` is the other auto-registered default. Toggle with `defaultCommands.rotatePassphrase: false`. See `cli-maker-setup-config`.
