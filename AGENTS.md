## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file.

### Available skills
- cli-maker-scaffold: Use when the user wants to create a new CLI project using `@ideascol/cli-maker` from scratch (installation, `create`, and first verification). (file: ./skills/cli-maker-scaffold/SKILL.md)
- cli-maker-command-authoring: Use when the user wants to add/modify commands, params, subcommands, or command actions in a CLI built with `@ideascol/cli-maker`. (file: ./skills/cli-maker-command-authoring/SKILL.md)
- cli-maker-setup-config: Use when the user wants interactive setup/config persistence, password fields, encryption passphrase flows, or reading config values from commands. (file: ./skills/cli-maker-setup-config/SKILL.md)

### How to use skills
- If the task clearly matches one of the skills above, use it.
- If multiple skills apply, use only the minimum set and execute them in this order:
  1. `cli-maker-scaffold`
  2. `cli-maker-command-authoring`
  3. `cli-maker-setup-config`
- Prefer concrete terminal commands and file edits over generic explanations.
