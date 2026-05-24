---
description: Add interactive setup and persisted config to a CLI built with @ideascol/cli-maker.
---

Use the `cli-maker-setup-config` skill to wire interactive setup, persisted config, password fields, and encryption passphrase flows.

Steps:
1. Add a `setup` command using interactive prompts.
2. Persist config under the standard config path.
3. For sensitive values, use password-type params and optional encryption passphrase.
4. Show how downstream commands read config values.
