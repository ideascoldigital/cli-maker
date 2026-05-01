# Security Policy

## Reporting a Vulnerability

If you discover a security issue in `@ideascol/cli-maker`, please report it
privately by opening a [GitHub security advisory](https://github.com/ideascoldigital/cli-maker/security/advisories/new)
or emailing the maintainer listed in `package.json`.

Please do not open public issues for vulnerabilities.

## Scope

`@ideascol/cli-maker` is a library that helps developers build their own CLIs.
The security posture below applies to the library itself, not to CLIs built
with it (those inherit responsibility from their authors).

## Known sensitive surface

### Shell command execution (`InteractiveSession` `!` prefix)

The `InteractiveSession` REPL supports a `!` prefix that runs the rest of the
input as a shell command via `child_process.execSync`. This is a deliberate
feature, mirroring the same affordance in REPLs like Claude Code, Python's
IPython (`!ls`), and IRB. Static analysis tools (Socket, Snyk, etc.) will
flag the underlying `execSync` call because it executes user-supplied input.

To minimize risk:

- **Disabled by default.** Shell execution requires explicit opt-in via
  `shellCommandsEnabled: true` on `SessionOptions`. Sessions that do not set
  this flag will return a `disabled` result and never reach `execSync`.
- **Optional allowlist.** Set `allowedShellCommands: ['git', 'ls', ...]` to
  restrict the first token of any executed command. Commands outside the
  allowlist are blocked before reaching the shell.
- **Per-call timeout.** Every execution is capped at 30 seconds.
- **No automatic UI elsewhere.** Outside the opt-in `!` prefix, the library
  does not invoke `child_process` against user input.

If your CLI accepts untrusted input (for example, a hosted REPL exposed to
external users), do not enable `shellCommandsEnabled`. The flag is intended
for local developer tooling.

### Other surface

- The library reads and writes config files under `~/.cli-maker/` when the
  setup command is used. Encrypted password fields use a passphrase you
  supply at runtime; the passphrase is never persisted.
- The library does not perform any network I/O on its own.

## Supply chain

Releases are published from the official GitHub repository with npm
provenance enabled, so install-time tooling can verify the package was built
from the published source.
