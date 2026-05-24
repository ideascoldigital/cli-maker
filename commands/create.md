---
description: Scaffold a new CLI project with @ideascol/cli-maker (non-interactive).
argument-hint: "[name] [description]"
---

Use the `cli-maker-scaffold` skill to create a new CLI project using `@ideascol/cli-maker`.

Required inputs to collect from the user (ask only if missing):
- package name in `@scope/name` format
- description
- author
- email
- package_manager (`npm` or `bun`)
- git_init (`yes` or `no`)

Run scaffold via:

```bash
npx @ideascol/cli-maker create \
  --name=@scope/my-cli \
  --description="..." \
  --author="..." \
  --email="..." \
  --package_manager=npm \
  --git_init=yes
```

After scaffold, verify generated files and run smoke test as defined in the skill.

User arguments: $ARGUMENTS
