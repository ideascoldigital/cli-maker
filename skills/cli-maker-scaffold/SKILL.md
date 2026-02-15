---
name: cli-maker-scaffold
description: Creates a new CLI project as an end user with @ideascol/cli-maker, including required create parameters, non-interactive command execution, and post-generation verification.
---

# CLI Maker Scaffold

Use this skill when the user asks to create a new CLI project with `@ideascol/cli-maker`.

## Inputs you must collect
- `name` in package format: `@scope/package-name`
- `description`
- `author`
- `email`
- `package_manager`: `npm` or `bun`
- `git_init`: `yes` or `no`

## Execution workflow
1. Ensure target directory is appropriate.
- If current directory is not empty, `cli-maker` creates a subfolder from package name (part after `/`).

2. Run scaffold command.
- Preferred (no global install):
```bash
npx @ideascol/cli-maker create \
  --name=@scope/my-cli \
  --description="My CLI" \
  --author="Author Name" \
  --email="author@company.com" \
  --package_manager=npm \
  --git_init=yes
```

3. Verify generated project.
- Confirm these files exist:
  - `src/cli.ts`
  - `src/commands/greetCommand.ts`
  - `src/lib/greet.ts`
  - `src/index.ts`
  - `package.json`

4. Smoke-test.
- `npm test` or `bun test`
- Build command:
  - npm project: `npm run build`
  - bun project: `bun run build`

## Hard validation rules
- `name` must match `@company/package-name`.
- `email` must be valid format.
- URL params in later commands must start with `http://` or `https://`.
- Boolean params are literal values: `true` or `false`.

## Common failure handling
- Unknown parameter: retry using exact declared parameter names.
- Missing required params in non-interactive mode: supply all required `--param=value` pairs.
- Package manager mismatch: use scripts generated for selected manager.
