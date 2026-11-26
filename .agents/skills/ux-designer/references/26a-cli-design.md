# CLI Design: Commands, Flags, Output Contracts & Errors

This file covers command-line tools that run, print, and exit. It covers naming, arguments
and flags, help, streams and exit codes, prompts and confirmations, errors, configuration,
robustness, versioning, telemetry, auth, and CLIs that AI agents call. A CLI has two
audiences at once: a human at a terminal and a program reading its output. Most CLI UX
failures come from serving one and breaking the other. Examples: a spinner in a CI log,
a prompt that hangs a script, a table that changes shape and breaks someone's `awk`.

> Colour, progress, symbols, tables, terminal accessibility, and full-screen TUIs:
> [26b-terminal-output-and-tui.md](26b-terminal-output-and-tui.md).
> Writing error messages in general: [09-ux-writing.md](09-ux-writing.md).

---

## Contents

- Human First, Machine Always
- Naming & Command Structure
- Arguments & Flags
- Help & Documentation
- Streams, TTY Detection & Output Contracts
- Exit Codes
- Prompts & Non-Interactive Mode
- Destructive Actions: Confirm, Dry-Run, Undo
- Error Messages
- Configuration & Environment
- Secrets
- Responsiveness, Ctrl-C & Robustness
- Stability, Versioning & Deprecation
- Telemetry & Update Notices
- Onboarding, Completion & Auth
- CLIs for AI Agents
- Quick Checklist
- Common Mistakes
- Sources

---

## Human First, Machine Always

- **Default output is for humans**, as long as the stream is a terminal. Every human-only
  behaviour must switch off when output goes to a pipe or file, or when it runs in CI.
  That covers colour, animation, prompts, truncation, and pagers.
- **Everything interactive has a flag equivalent.** A prompt is a convenience and never
  the only way in.
- **Composable by default.** Plain line-oriented text on stdout, diagnostics on stderr,
  and meaningful exit codes. That's what lets `grep`, `xargs`, `jq`, and shell scripts
  build on the tool.
- **Conversational.** Users learn a CLI through trial and error, so each run should teach
  the next one. Suggest the next command, correct typos with a suggestion, and say what
  changed.

## Naming & Command Structure

**The tool name** is short, lowercase, easy to type, and doesn't collide with an existing
command. POSIX recommends 2–9 lowercase letters and digits. Avoid generic words
(`convert`, `deploy`) that clash on users' PATHs.

**Subcommands.** Choose one grammar and use it everywhere:

| Pattern | Examples | Notes |
|---|---|---|
| noun verb | `gh pr create`, `docker container ls` | More common for multi-resource tools; groups by object |
| verb noun | `kubectl get pods`, `kubectl delete svc` | Fine if every command follows it |

- Consistency matters more than which order you choose. Use the same verbs across every
  resource: `list`/`create`/`delete` everywhere, not `ls` here and `list` there.
- Avoid near-synonyms that confuse (`update` vs `upgrade`, `remove` vs `delete`).
- Modifiers are flags, not new commands: `gh pr review 12 --approve`, not `gh pr approve`.
- Prefer short, established words (`repo`, `config`, `auth`).
- **No catch-all default subcommand** (`tool foo` silently meaning `tool run foo`). It
  makes every future subcommand name a breaking change.
- **No implicit prefix matching** (`tool ins` → `install`). It freezes the command
  namespace. Explicit, documented aliases are fine.
- **Bare invocation.** A multi-command tool lists its commands, and a single-purpose tool
  shows concise help. Neither runs a default action, unless the tool is interactive by
  nature (`npm init`, a REPL).

## Arguments & Flags

**Prefer flags to positional arguments.** One positional kind is fine and two is suspect.
Three is never right (12-Factor CLI). `tool fork --from a --to b` can't be mixed up, but
`tool fork b -a a` can. There are two exceptions: many arguments of one kind
(`rm *.log`), and a famous pair (`cp src dst`).

**Rules:**
- Every flag has a long form (`--output`). Single-letter shortcuts are only for frequent
  flags, so the short namespace isn't burned on rare ones.
- Short flags can combine (`-xvf`). Accept both `--flag value` and `--flag=value`.
- Allow flags before or after the subcommand where the parser allows it.
- `--` ends option parsing and passes the rest through: `tool run -- npm test --watch`.
- `-` as a filename means stdin, or stdout for an output argument.
- Positional files are inputs. Outputs go through `-o/--output`.
- Booleans get a `--no-` negation when the default can be on (`--no-color`, `--no-input`).
- For an "optional value", use a sentinel word, not an empty string (`ssh -F none`).
- Multiple values: repeat the flag (`--tag a --tag b`) or take one comma-separated value.
  Document which.
- Validate every flag combination before doing anything with side effects.

**Standard flag names.** Users expect these; don't reuse them for something else:

| Flag | Meaning | Note |
|---|---|---|
| `-h`, `--help` | Help | Never overload `-h` (e.g. as `--host`) |
| `--version` | Version | `-V` is common; avoid `-v` for it |
| `-v`, `--verbose` | More output | Ambiguous with version. Pick one meaning and keep it |
| `-q`, `--quiet` | Less output | Errors and the essential result only |
| `-f`, `--force` | Skip confirmation / overwrite | |
| `-n`, `--dry-run` | Show what would change | |
| `-y`, `--yes` | Assume yes to prompts | |
| `-o`, `--output` | Output file (or format, kubectl-style `-o json`) | Pick one meaning |
| `--json`, `--format` | Machine-readable output | |
| `--no-input` | Never prompt; fail if input is missing | |
| `--no-color`, `--color=auto\|always\|never` | Colour control | |
| `-a`, `--all` | All items | |
| `--debug` | Internals, stack traces | |

## Help & Documentation

**Entry points.** `tool`, `tool -h`, `tool --help`, `tool help sub`, and
`tool sub --help` all work. `-h` anywhere on the line shows help and ignores the other
arguments. `--help` and `--version` print to **stdout** and exit **0** (GNU).

**Structure of `--help`:**

```
Deploy an app to a target environment.

Usage: tool deploy <app> [--env <name>] [--dry-run]

Examples:
  tool deploy web                     Deploy to the default env
  tool deploy web --env prod --dry-run  Preview a production deploy

Flags:
  -e, --env <name>   Target environment (default: staging)
  -n, --dry-run      Show the plan without applying it
  -h, --help         Show this help

Docs: https://example.com/docs/deploy
```

- Lead with a one-line description, then usage, then **examples**. Users copy examples
  far more than they read flag tables.
- List the most-used flags and commands first, not alphabetically.
- Synopsis notation: `[optional]`, `<placeholder>`, `a|b` for choices, `...` for repeats.
- Bold headings are fine on a TTY. Use no escape codes when piped.
- End with a docs URL (deep-linked per command) and where to report bugs.
- **Concise help on missing arguments.** If a required argument is missing, print the
  description, one or two examples, and "Run `tool deploy --help` for more". Don't dump the
  full manual.
- If the tool expects piped stdin but stdin is a terminal, print a hint and exit.
  Don't sit waiting silently.

**Typos.** Suggest, never auto-run: `Unknown command "stauts". Did you mean "status"?`
Silent autocorrection hides the real syntax, and the typo becomes an interface you have
to support forever.

**`--version`.** The first line is machine-parseable: a constant program name, then the
version as the last word (`tool 2.4.1`). Build and commit details can go on later lines.

**Docs.** Offer web docs (searchable and linkable) and offline docs that match the
installed version: a man page or `tool help <topic>`. Keep paragraphs short (about 3
sentences), since CLI users skim.

## Streams, TTY Detection & Output Contracts

**stdout** carries the result: the data the user asked for, in a form another program can
consume. **stderr** carries everything else: progress, status messages ("Uploading…"),
warnings, errors, prompts, and debug logs. That way `tool list | wc -l` counts items, not
log lines. When wrapping a child process, pass its stderr through.

**Check each stream for a TTY separately.** stdout can be piped while stderr is still a
terminal, so progress can still show on stderr.

| When stdout is… | Do |
|---|---|
| A terminal | Colour, aligned columns, truncation to width, relative times, pager for long output, hints |
| A pipe/file | Plain text, one record per line, no truncation, no colour, ISO 8601 times, no pager, no hints |

**Machine-readable output:**
- Offer `--json`, or `--format json|yaml|csv`. For streams, large lists, and pagination,
  emit **NDJSON** (one object per line) so consumers can process items incrementally.
- Offer `--plain` (or tab-separated output) when the human table breaks line-based
  tools. gh, for example, switches to tab-separated output with no truncation when piped.
- Let users pick fields (`--json name,url`, `--fields`) and filter with built-in
  queries (`--jq`, `--query`, `-o jsonpath=`).
- **JSON is a contract. Human output isn't.** Add fields freely, and never rename or remove
  fields or change their types without a major version. Say so in the docs. kubectl
  explicitly documents that its default table output is not a stable interface.
- JSON uses raw values: integers for bytes and milliseconds, RFC 3339 timestamps with
  timezone, and stable IDs. Leave human formatting (`12 MB`, `3 min ago`) to the human view.

**Say what happened.** Success output is short but never empty:
`✓ Created repo acme/web (private)`. Report state changes and the new state. Silent
success leaves users guessing. In a CHI study, a blind developer created duplicate cloud
resources because a command printed nothing.

**Cross boundaries visibly.** Say when the tool writes outside the paths it was given,
modifies a config file, or contacts the network for the first time.

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success, including "nothing to do" |
| `1` | General failure |
| `2` | Usage error: bad flags or arguments (convention of getopt, argparse, clap, and shell builtins) |
| `126` / `127` | Shell: not executable / command not found. Don't use them |
| `128+n` | Killed by signal n: `130` = Ctrl-C (SIGINT), `143` = SIGTERM |
| `64–78` | `sysexits.h` (64 usage, 65 data, 66 no input, 69 unavailable, 75 temp fail, 77 no permission, 78 config). Optional, but meaningful when used |

- Give distinct codes to the failure modes callers will branch on: auth required, not
  found, conflict, partial failure. Document them. gh uses 0 ok, 1 error, 2 cancelled,
  4 auth required.
- Never exit 0 after printing an error. Never exit non-zero on success with warnings,
  unless a `--strict` flag asks for it.
- Codes are 0–255. Keep custom codes clear of 126–165 and 255.
- On Ctrl-C, exit 130. Ideally, restore the default handler and re-raise SIGINT so the
  parent shell sees the signal.

## Prompts & Non-Interactive Mode

- **Prompt only when stdin is a TTY.** If it isn't, never prompt. Fail fast and name the
  flag: `error: --region is required in non-interactive mode`.
- Honour `--no-input`. Also treat `CI` (set by GitHub Actions, GitLab, and most CI
  systems) as non-interactive.
- **Prompting to fill in missing arguments is good UX** in a terminal. Handle all three
  cases: no flags given, some given, all given. Only prompt for what's missing. Show
  defaults in the prompt: `Region (eu-west-1):`.
- **Echo the equivalent command** after an interactive flow, so the user can script it
  next time:
  `Next time: tool init --template api --region eu-west-1`.
- Password input: echo off. Always show how to cancel (`Ctrl-C to cancel`).
- Arrow-key pickers need an accessible fallback: a numbered list typed by number, and
  y/n typed as text (see [26b](26b-terminal-output-and-tui.md)).

## Destructive Actions: Confirm, Dry-Run, Undo

Scale the friction to the damage (clig.dev):

| Severity | Example | Pattern |
|---|---|---|
| Mild | Delete one local file, in a command named `delete` | No prompt needed |
| Moderate | Delete a directory, a remote resource, bulk changes | `Delete 14 files? [y/N]` with the default on the safe side, plus `--dry-run` |
| Severe | Delete an app, database, or repo | Type the resource name to confirm; `--confirm=<name>` for scripts |

- When non-interactive, a destructive command requires `-f/--force` (or `--yes`) and
  refuses otherwise.
- The prompt names the target and the count: `Delete database "orders-prod" (2.1 GB,
  14 tables)?`, not `Are you sure?`.
- Watch for **non-obvious destruction**. A config change that implicitly deletes nine
  resources is severe, even if the command looks harmless.
- **`--dry-run` prints the exact plan**, structured under `--json`. For high-stakes
  infrastructure, a separate plan/apply pair (Terraform) beats a flag.
- **Idempotency.** Prefer declarative `apply` (safe to re-run) over `create` (fails if
  the resource exists). After a transient failure, re-running the same command should
  pick up where it stopped.
- **Undo beats confirmation** where the domain allows it. Options: soft-delete with a
  retention window, a trash, or print the inverse command (`Restore with: tool restore
  42`).
- Offer a read-only mode for tools that can do serious damage (`k9s --readonly`).

## Error Messages

Rewrite expected errors for humans: **what happened, why, and how to fix it.**

```
✗ Can't write to config.yaml: permission denied.
  The file is owned by root.
  Fix: sudo chown $USER config.yaml   (or pass --config <path>)
```

- Put the key fact or the fix **last**, where the eye lands after the output stops.
- Format: `tool: message` or `tool: file:line: message` (GNU). Lowercase after the
  prefix. Include the offending value: `unknown region "eu-wset-1"`.
- One cause per error. When many things fail the same way, group them under one heading
  instead of repeating 200 lines.
- **No stack traces by default.** Show them with `--debug` or `TOOL_DEBUG=1`. For
  unexpected crashes, write the details to a log file and print its path plus a
  pre-filled bug-report URL.
- Errors go to stderr, and the exit code is non-zero.
- Make errors understandable when **read aloud** by a screen reader. Raw regexes, hex
  dumps, and bare URLs are hard to follow. In the CHI 2021 study, one regex-laden error
  turned a 30-minute task into 6 hours.
- Validate input up front, before any side effects, so a failure never leaves things
  half-changed.

## Configuration & Environment

**Precedence, highest first:** flags → environment variables → project config (checked
in) → user config → system config.

| Setting changes… | Put it in |
|---|---|
| Per run (debug, dry-run, output format) | Flags |
| Per machine or user (colour, proxy, editor, paths) | Env vars + user config |
| Per project, shared with the team | A config file in the repo |

**Env var names:** `UPPER_SNAKE` with an app prefix (`TOOL_REGION`), single-line
values, and no reuse of standard names for other meanings. Honour these standard
variables: `NO_COLOR`, `FORCE_COLOR`, `DEBUG`, `EDITOR`/`VISUAL`, `PAGER`, `HTTP(S)_PROXY`,
`NO_PROXY`, `TMPDIR`, `HOME`, `TERM`, `COLUMNS`/`LINES`, `CI`.

**File locations: XDG Base Directory** on Linux, and sensibly on macOS:

| Kind | Variable | Default |
|---|---|---|
| Config | `XDG_CONFIG_HOME` | `~/.config/<tool>/` |
| Data | `XDG_DATA_HOME` | `~/.local/share/<tool>/` |
| State (history, logs) | `XDG_STATE_HOME` | `~/.local/state/<tool>/` |
| Cache (safe to delete) | `XDG_CACHE_HOME` | `~/.cache/<tool>/` |
| Sockets, runtime | `XDG_RUNTIME_DIR` | No default; user-only, cleared at logout |

- Ignore relative paths in XDG variables, and fall back to the defaults when they're
  unset or empty.
- On Windows use `%APPDATA%` / `%LOCALAPPDATA%`. Don't add new dotfiles to `$HOME`.
- `tool config get|set|list` beats making users hand-edit files. Show where each
  effective value came from (`tool config list --show-origin`).
- Editing a file the tool doesn't own (shell rc, `/etc`) needs consent and a statement
  of exactly what will change. Prefer a drop-in file over appending, and mark the edit.

## Secrets

- **Never accept secrets as flag values.** They leak into `ps` output and shell history.
- Read secrets from a file (`--token-file`), stdin, the OS keychain, or an interactive
  hidden prompt.
- Environment variables leak too, through child processes, `docker inspect`, and crash
  dumps. clig.dev advises against them. In practice CI and agents need a token variable
  (`GH_TOKEN`), so support one for automation, and default humans to stored keychain
  credentials.
- Never print a secret back. Mask it (`ghp_****abcd`) in status output and logs.

## Responsiveness, Ctrl-C & Robustness

**Speed** (12-Factor CLI bands):

| Time to complete | Feels |
|---|---|
| < 100 ms | Instant |
| 100–500 ms | Target for common commands |
| 0.5–2 s | Acceptable |
| > 2 s | Needs progress feedback; users start wondering |

- **Print something within 100 ms**, before any network call. Startup time is UX:
  lazy-load heavy modules and don't phone home synchronously.
- Show progress for anything that may take more than about a second. Patterns are in
  [26b](26b-terminal-output-and-tui.md).
- Network calls need **default timeouts**, configurable and never infinite. Retry
  only transient failures, with backoff and jitter, and only for idempotent operations.

**Ctrl-C:**
1. Respond immediately: print `Cancelling…` and stop work.
2. Clean up with a timeout. Cleanup must never hang.
3. A **second Ctrl-C skips cleanup** and exits now. Say so: `Press Ctrl-C again to
   force quit`.
4. Ctrl-C must work even while blocked on network I/O.

**Crash-only design.** Assume the last run died without cleaning up. Defer cleanup to the
next run, make operations resumable, and write files atomically (write to a temp file,
then rename).

**Assume misuse.** Expect scripts, parallel runs, bad networks, read-only filesystems,
odd locales, and very long inputs.

## Stability, Versioning & Deprecation

- The public interface is the subcommands, flags, env vars, config keys, exit codes,
  and machine-readable output. Change it **additively**. A new flag beats changing an
  old flag's meaning.
- Human-readable text can change, and scripts shouldn't parse it. That's why `--json`
  and `--plain` exist.
- **Deprecate loudly and slowly.** Warn on stderr when the old form is used and name
  the replacement. Keep the old form working for a documented window. git 2.23 added
  `switch`/`restore` and kept `checkout` working.
- Use semver. Don't treat it as permission to ship frequent breaking majors.
- No time bombs: the tool must not depend on a service (analytics, update check,
  license ping) whose disappearance would break it.

## Telemetry & Update Notices

**Telemetry:**
- No usage or crash data without consent. Prefer opt-in. If it's opt-out, disclose it on
  first run and in the docs, and make disabling one command or variable.
- State what's collected, why, how it's anonymized, and how long it's kept.
- Honour `DO_NOT_TRACK=1` and an app-specific switch. gh's `GH_TELEMETRY=log` prints
  events to stderr instead of sending them, which is a good transparency pattern.

**Update checks:**
- At most once per 24 hours, cached, and non-blocking.
- Print to stderr, only when interactive. Skip in CI, under `--quiet`, and when output is
  piped.
- Provide an off switch (`NO_UPDATE_NOTIFIER`, `TOOL_NO_UPDATE_NOTIFIER`).
- Show the exact upgrade command for the user's install method:
  `brew upgrade tool`, not "please update".

## Onboarding, Completion & Auth

- **First run.** Detect missing config or auth and print the one next command:
  `Not logged in. Run: tool login`. After each step of a workflow, suggest the next
  (`tool login` → "Next: `tool init`").
- A `status` (or `doctor`) command shows the current state and how to change it.
  `doctor` checks the environment and prints fixes.
- **Shell completion** for bash, zsh, fish, and PowerShell, generated by the tool
  (`tool completion zsh`). Complete dynamic values (resource names, branches) where you
  can.
- **Browser login.** Open the browser, but **always print the URL too**, for SSH and
  headless machines.
- **Device code flow (RFC 8628)** for headless and limited-input devices:
  - Show the `user_code` and a short, typeable `verification_uri`. Never show the
    `device_code`.
  - Codes are about 8 characters from an unambiguous set, case-insensitive, and grouped
    with a dash (`WDJB-MJHT`). Avoid 0/O and 1/l/I.
  - Poll at the server's interval, 5 s by default, slowing down on `slow_down`.
  - Start the flow only when the user asks for it. Unsolicited device codes are a
    phishing vector.
- For CI and agents, accept a token from an env var or file and skip the browser.

## CLIs for AI Agents

Coding agents increasingly drive CLIs through a shell. There's no standard yet, but
practitioner guidance (Anthropic, Speakeasy, Google's `gws` CLI author) converges on a
few rules. Most of them are just the rules above, applied strictly:

- **Same tool, opt-in machine mode.** `--json` (or NDJSON) and `--no-input`/`--yes`.
  Agents stall on prompts, wizards, pagers, and spinners. Don't try to detect agents
  through env-var heuristics. Make the non-interactive path explicit and complete.
- **Deterministic exit codes** per failure class, and errors that name the bad input and
  show a correct example. An agent repairs its call from the error text.
- **Help is agent documentation.** Make it complete, example-led, and token-lean: say
  what the output looks like, list the exit codes, and show common recipes.
  Machine-readable introspection helps too (`tool schema <command>`, `--help --json`).
- **Context discipline.** Field selection, pagination, `--limit`, and a concise default.
  When output is truncated, say so and say how to narrow the query. Agent harnesses
  cap tool output; Claude Code's default cap is 25k tokens.
- **`--dry-run` on every mutation**, and treat agent-supplied input as untrusted: reject
  control characters, canonicalize paths (block `../`), and validate IDs.
- Ship a short agent-facing doc (`AGENTS.md`, a skill file) for the invariants help
  can't express, such as "always dry-run before delete".
- **CLI vs MCP.** A CLI is cheap for local, shell-capable agents: there's no schema
  preload, and it composes with pipes. MCP fits multi-user OAuth, governance, and typed
  calls without shell quoting. Generating both from one definition is common. The
  published token-cost and success-rate comparisons are single-vendor benchmarks, so
  don't quote them as fact.

---

## Quick Checklist

- [ ] Consistent grammar (noun-verb or verb-noun); no catch-all subcommand, no prefix matching
- [ ] Flags over positionals; every flag has a long form; standard names keep standard meanings
- [ ] `-h`/`--help` works everywhere, leads with examples, ends with a docs link; typos get "did you mean"
- [ ] Results on stdout, everything else on stderr; each stream TTY-checked separately
- [ ] Piped output: plain, untruncated, uncoloured, one record per line; `--json` is a stable contract
- [ ] Exit 0 on success, 2 on usage error, documented codes for failures callers branch on
- [ ] Prompts only on a TTY; `--no-input` and `CI` fail fast and name the missing flag
- [ ] Destructive actions confirm in proportion to the damage; `--force` when non-interactive; `--dry-run`
- [ ] Errors say what, why, and the fix; no stack trace without `--debug`
- [ ] Precedence: flags > env > project > user > system; XDG paths; no secrets in flags
- [ ] First output within 100 ms; timeouts on network calls; double Ctrl-C force-quits
- [ ] Additive changes and loud deprecations; telemetry consented; update checks quiet and capped at once a day
- [ ] Completion scripts; first-run hint; browser login also prints the URL

## Common Mistakes

- Spinners, colour, and progress bars written into pipes and CI logs
- A prompt that hangs a script or CI job because the tool didn't check for a TTY
- Logs and status messages on stdout, corrupting piped data
- Human table output with no `--json`, so users parse columns that later change
- Exit code 0 after a failure, or a single non-zero code for every failure
- Silent success: the command prints nothing, and the user re-runs it
- `Are you sure? [y/N]` with no target named, or no confirmation at all for deleting production
- A Python traceback as the error message for a missing config file
- Auto-correcting typos, or accepting arbitrary abbreviations, and then being unable to add commands
- Tokens passed as `--token abc123`, now saved in shell history
- A synchronous update check or analytics call that adds a second to every run
- Ctrl-C that's ignored during network calls, or cleanup that hangs forever
- Renaming a JSON field in a minor release

---

## Sources

- [Command Line Interface Guidelines (clig.dev)](https://clig.dev/)
- [12 Factor CLI Apps — Jeff Dickey](https://medium.com/@jdxcode/12-factor-cli-apps-dd3c227a0e46)
- [Heroku CLI style guide](https://devcenter.heroku.com/articles/cli-style-guide)
- [GNU Coding Standards — command-line interfaces, --help, --version](https://www.gnu.org/prep/standards/html_node/Command_002dLine-Interfaces.html)
- [POSIX Utility Conventions](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap12.html)
- [GitHub Primer — CLI foundations](https://primer.style/native/cli/foundations) · [gh exit codes](https://cli.github.com/manual/gh_help_exit-codes) · [gh environment](https://cli.github.com/manual/gh_help_environment) · [Scripting with GitHub CLI](https://github.blog/engineering/scripting-with-github-cli/)
- [Atlassian — 10 design principles for delightful CLIs](https://www.atlassian.com/blog/it-teams/10-design-principles-for-delightful-clis)
- [kubectl conventions](https://kubernetes.io/docs/reference/kubectl/conventions/)
- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir/latest/)
- [Advanced Bash-Scripting Guide — exit codes](https://tldp.org/LDP/abs/html/exitcodes.html)
- [RFC 8628 — OAuth 2.0 Device Authorization Grant](https://www.rfc-editor.org/rfc/rfc8628.html)
- [Sampath, Merrick, Macvean — Accessibility of Command Line Interfaces (CHI '21)](https://research.google/pubs/accessibility-of-command-line-interfaces/)
- [Anthropic — Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) · [Speakeasy — Engineering an agent-friendly CLI](https://www.speakeasy.com/blog/engineering-agent-friendly-cli) · [Poehnelt — Rewrite your CLI for AI agents](https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/)
