# Terminal Output & TUI Design

This file covers what a terminal program looks like and how it behaves on screen: colour,
progress, symbols, layout and tables, hyperlinks and paging, terminal accessibility, and
full-screen or inline TUIs (layout, keys, focus, mouse, rendering, terminal state). The
terminal isn't a canvas you control. The user owns the palette, font, size, and
multiplexer, and a screen reader may be reading the character grid. Good terminal design
defers to the user's setup and degrades cleanly when a capability is missing.

> Commands, flags, help, streams, exit codes, prompts, errors, and config:
> [26a-cli-design.md](26a-cli-design.md).
> General accessibility (WCAG): [03-accessibility.md](03-accessibility.md). Loading-state
> patterns: [22-performance-ux.md](22-performance-ux.md).

---

## Contents

- Capability Detection Cheat Sheet
- Colour
- Text Attributes
- Progress & Activity
- Symbols, Unicode & Emoji Width
- Layout, Width & Tables
- Hyperlinks, Paging, Time & Units
- Terminal Accessibility
- Windows Specifics
- TUIs: When and Which Kind
- TUI Layout & Resizing
- TUI Keyboard Design
- Discoverability
- Focus, Selection & Mouse
- Rendering & Performance
- Terminal State Hygiene
- Feedback, Errors & Notifications in TUIs
- Frameworks & Testing
- Exemplars
- Quick Checklist
- Common Mistakes
- Sources

---

## Capability Detection Cheat Sheet

| Question | How to answer it |
|---|---|
| Is a human watching? | `isatty()` on **each** stream; `CI` env var means no |
| Colour allowed? | `--color` flag > config > `NO_COLOR` > `FORCE_COLOR`/`CLICOLOR_FORCE` > `TERM=dumb` > isatty |
| How many colours? | `COLORTERM=truecolor\|24bit` → 24-bit; `TERM=*-256color` → 256; else 16 |
| Dark or light background? | OSC 11 query (TTY only, ~100 ms timeout); else assume dark and allow config override |
| Width? | `ioctl(TIOCGWINSZ)` / console API, then `COLUMNS`, else 80; listen for `SIGWINCH` |
| UTF-8 glyphs OK? | `LC_ALL` → `LC_CTYPE` → `LANG` contains `UTF-8`; not `TERM=linux`/`dumb` |
| Synchronized output? | DECRQM `CSI ? 2026 $ p` → reply 1 or 2 means supported |
| Kitty keyboard protocol? | `CSI ? u` followed by DA1; DA1 reply with no flags reply means unsupported |
| Hyperlinks? | No reliable detection. Emit OSC 8 on a TTY; the visible text must stand alone |

Detection is a hint, never a gate. Every capability needs a user override, because
SSH, `sudo`, tmux, and containers routinely drop or fake these signals.

## Colour

**Use colour for meaning, not decoration.** Red for errors, yellow for warnings, green
for success, and dim for secondary metadata. Use one accent to highlight the thing to
act on (an ID, a URL, the next command). If everything is coloured, nothing stands out.

**Never use colour as the only signal.** Pair it with a word or symbol: `✗ error:` or
`✓ done`. This covers colour-blind users (red/green is the classic confusion; blue/orange
is safer for diffs and status pairs), monochrome terminals, screen readers, and
`NO_COLOR` users.

**Turn colour off when:**
- the stream isn't a TTY (check stdout and stderr separately)
- `NO_COLOR` is set to any non-empty value (`NO_COLOR=0` still disables colour)
- `TERM=dumb`
- the user passed `--no-color` / `--color=never`

**Overrides:**
- `NO_COLOR` covers colour only, not bold or underline. An explicit `--color=always`
  flag or user config beats it (no-color.org).
- `FORCE_COLOR` and `CLICOLOR_FORCE` force colour into pipes. Their semantics differ:
  force-color.org says any non-empty value forces colour, while Node's
  chalk/supports-color treats `FORCE_COLOR=0` as off and `1`/`2`/`3` as 16/256/truecolor.
  Document which you follow. Treating `0`/`false` as off is the practical choice.

**Prefer the 16 ANSI colours.** Users theme those 16 slots to suit their background,
taste, and vision, while hard-coded 256-colour or RGB values bypass that. GitHub CLI moved
back to 4-bit colours in 2025 after its hard-coded palette produced unreadable text on
some themes.
- Body text uses the **default foreground** (`\e[39m`), never forced black or white.
  Forced white on a light theme is invisible.
- Reserve truecolor for user-selected themes. If you ship RGB colours, check ≥ 4.5:1
  contrast against both a typical dark and a light background, or choose the palette from
  the OSC 11 background query.
- Offer colour-blind-friendly themes if the product has themes at all.
- Fall back truecolor → 256 → 16. Windows conhost maps everything to 16.
- `COLORTERM` is often lost across `ssh` and `sudo`, so let users force the depth.

**Sequences:** 16-colour `\e[31m`, bright `\e[91m`; 256-colour `\e[38;5;Nm`; truecolor
`\e[38;2;R;G;Bm`; reset `\e[0m`. Reset at the end of every coloured span, so output
cut off by Ctrl-C or `head` doesn't bleed colour into the prompt.

## Text Attributes

| Attribute | Support & use |
|---|---|
| Bold `1` | Universal. Some terminals render it as "bright colour" instead of heavier weight |
| Dim `2` | Unsupported or nearly invisible in some terminals. Never put essential info only in dim |
| Italic `3` | Missing in some terminals and in tmux with a wrong `TERM` |
| Underline `4` | Common. Curly or coloured underline only in newer terminals |
| Reverse `7` | Safe, theme-respecting highlight for selection |
| Blink `5` | Don't. Motion and accessibility hazard |

## Progress & Activity

**Timing:** first output within 100 ms. Show an indicator for anything that may take more
than about 1 s. When the total is known and the work takes more than about 10 s, show
how far along it is.

**Pick the pattern** (after Evil Martians):

| Pattern | Use when | Example |
|---|---|---|
| Spinner + step label | Seconds-long work, total unknown | `⠋ Resolving dependencies…` |
| **X of Y** (default when countable) | Countable units | `Uploading 12/40 files` |
| Progress bar | Long work, or several similar parallel jobs | `[████░░░░] 52% 1.2/2.3 GB · ~40s` |
| Per-task lines | Parallel heterogeneous jobs (docker pull, cargo) | One line per task with status, plus an overall line |

- Tie spinner frames to real progress events where you can. A timer-driven spinner keeps
  spinning when the work has hung, while a counter that stops moving shows the stall.
- **Always end with a persistent summary line** that switches the verb to past tense:
  `✓ Uploaded 40 files (12.3 MB) in 4.2s`. Clear the transient indicator first.
- Write progress to **stderr**, so stdout stays clean.
- Refresh at **10–20 Hz at most**. indicatif's default is 20 Hz. Faster burns CPU and
  floods screen readers.
- Only show an ETA after a few seconds or a few percent of progress. Smooth it, and round
  it ("about 2 min"). When the total is unknown, show elapsed time.
- Redrawn lines must stay narrower than the terminal. A wrapped line breaks `\r` redraws
  and leaves debris. Single line: `\r` + text + `\e[K`. Multi-line: cursor up `\e[NA` +
  erase line `\e[2K`.
- Hide the cursor (`\e[?25l`) during animation and always restore it (`\e[?25h`), on
  Ctrl-C and crashes too.
- Parallel work: don't interleave raw output from several jobs. On success, logs may
  collapse. **On failure, print the full log of the failed job.**
- **Not a TTY, or in CI:** no animation, no `\r`, no cursor movement. Print plain lines
  at the start, at milestones or every 10–30 s, and at the end. Test with
  `tool > out.txt`; the file must contain no escape codes.

## Symbols, Unicode & Emoji Width

- A small, consistent glyph set, always next to text: `✓` success, `✗` failure, `!` or
  `⚠` warning, `•` / `→` / `-` for lists and steps. Symbols support the words and never
  replace them.
- **ASCII fallback** (`[ok]`, `[x]`, `[!]`, `*`, `->`, `|/-\` spinner) when the locale
  isn't UTF-8, `TERM=dumb` or `linux`, a legacy Windows code page is active, or the user
  asks for it (`--ascii`, `--plain`).
- **Emoji and some symbols have unreliable widths.** CJK and most emoji take 2 cells.
  Variation selectors (VS16 turns `⚠` into a 2-cell emoji), ZWJ sequences, and combining
  marks are measured differently by different terminals and libraries. Because of that:
  - keep emoji out of aligned columns, tables, gutters, and progress bars
  - measure **grapheme clusters** (wcwidth, unicode-width, uniseg), never `len()`
  - truncate on grapheme boundaries
- Screen readers speak glyphs literally: braille spinner frames get read out as their
  Unicode names, and ASCII art is read as noise. Keep decoration minimal.

## Layout, Width & Tables

**Width.** Wrap prose at the terminal width but cap it around 80–100 columns, even on
wide screens. gh caps Markdown at 120. Never wrap or truncate when piped.

**Truncation.** Use `…`, or `...` in ASCII mode. Truncate the middle for paths and IDs
(`src/…/button.tsx`). Offer `--no-truncate` or `--wide`.

**Tables** (gh style):
- No borders: columns separated by 2+ spaces, text left-aligned, numbers right-aligned.
  Borders add noise, break `grep`/`cut`, and are read aloud by screen readers.
- Header in bold or uppercase on a TTY. When piped, output tab-separated values with no
  header, or offer `--no-headers`.
- One record per row. Offer `--columns`, `--sort`, `--json`, and `--csv`.
- For screen-reader users, offer a flattened `Header: value` per line view, or CSV
  export.

**Structure.** Lead with the result, then details, then the next step. Group related
lines under a short heading with one blank line between groups. Don't put timestamps or
`[INFO]` prefixes in default output. Those belong in verbose or log mode.

**Verbosity levels:**

| Level | Shows |
|---|---|
| `-q` | Errors and the essential result |
| default | A human summary |
| `-v` | Details of each step |
| `--debug` / `TOOL_DEBUG` | Internals, requests, stack traces. Consider writing them to a file |

## Hyperlinks, Paging, Time & Units

**OSC 8 hyperlinks:** `\e]8;;https://example.com\e\\label\e]8;;\e\\`.
- Supported by most modern terminals: Windows Terminal, iTerm2, kitty, WezTerm, Ghostty,
  foot, Alacritty, GNOME Terminal (VTE), and VS Code. tmux supports it when configured,
  and `less -R` passes links through.
- There's no reliable way to detect support, and unsupporting terminals show only the
  label. So use OSC 8 only for links where the label is enough. Print the full URL when
  the user needs it (auth URLs, docs links). Never emit OSC 8 when piped or with
  `TERM=dumb`.
- Keep URLs under about 2,000 bytes and percent-encode them. Use `id=` to join a link
  that wraps across lines.

**Paging.** Page long output only when stdin and stdout are both TTYs. Honour
`TOOL_PAGER`, then `PAGER`. Default to `less -FIRX`: it quits if the output fits on one
screen, searches case-insensitively, keeps colour, and leaves the output on screen.
Don't override a `LESS` variable the user has set.

**Pickers** (fzf-style): only on a TTY, always with a flag or argument equivalent, and
with a numbered-list fallback for accessibility.

**Time.** Relative times for humans (`3 min ago`). Absolute RFC 3339 with timezone in
JSON and logs. Show both where precision matters.

**Units.** Humans get `12.3 MB`, `4.2s`, and `1,204`. Machines get raw integers. Pick
decimal (MB) or binary (MiB) and use it consistently.

## Terminal Accessibility

**How it works.** The terminal emulator is the user agent. Screen readers (NVDA and
JAWS on Windows Terminal via UI Automation, VoiceOver on macOS, Orca on Linux) read the
character grid and infer structure from it. There's no ARIA and no semantic tree, and no
comprehensive accessibility standard for terminals. Redraws get announced, so a prompt
that re-renders on every arrow press is re-read on every arrow press. Ad-hoc screen
scraping also often misses changes.

**Findings from the CHI 2021 study** (Sampath et al., 12 blind and low-vision developers):
the main problems were unstructured long output, painful scrollback navigation (users
copied the buffer into Notepad), silent success, spinners and ASCII art read aloud, and
errors that couldn't be followed when read aloud. Its recommendations:
1. HTML or text documentation, not only man pages
2. A way to export long output to an accessible format
3. Documented output structure for each command
4. Exportable tables (CSV, HTML, or flattened)
5. Status and progress for every command
6. Screen-reader-friendly progress: text, not glyph animation
7. Error messages that make sense when spoken

**Build an opt-in accessible mode.** There's no reliable auto-detection and no universal
environment variable for it (`ACCESSIBLE` is a Charm convention). Offer a flag, env var,
or user setting. The reference implementations are GitHub CLI
(`GH_ACCESSIBLE_PROMPTER`, `GH_SPINNER_DISABLED`, `GH_ACCESSIBLE_COLORS`), Charm Huh's
accessible mode, and Claude Code's screen-reader mode. In that mode:
- Linear output in normal scrollback. No alternate screen, and no redraws of unchanged
  content.
- Arrow-key menus become numbered lists ("Select 1–4"), and y/n is typed.
- Static text instead of spinners (`Working…`, plus elapsed time if useful). Keep
  *information* updating, just not the animation.
- Labelled lines (`error:`, `warning:`, `you:`) instead of colour or position cues. No
  box drawing.
- Tables as `Header: value` lines, and diffs as plain `+`/`-` lines.
- The cursor stays on the input caret or the selected row, which screen magnifiers
  follow.
- Optional: a terminal bell when a long task finishes or input is needed, and OSC 133
  prompt marks so users can jump between commands or turns.
- Project-level config shouldn't be able to turn accessibility settings off. They belong
  to the user.

**Reduced motion.** Terminals have no OS reduced-motion signal. Offer a setting that
swaps spinners and shimmer for static indicators, and never blink.

**Contrast.** Defer to the user's theme (16 ANSI colours plus default
foreground/background). Any colours you ship must meet 4.5:1 for text.

## Windows Specifics

- Enable VT processing (`ENABLE_VIRTUAL_TERMINAL_PROCESSING` via `SetConsoleMode`). If
  that fails, you're on a legacy console, so degrade to plain output.
- Windows Terminal has been the default on Windows 11 since 22H2. It supports truecolor,
  OSC 8, synchronized output, and UIA screen-reader notifications. Legacy conhost maps
  colours to 16 and lacks OSC 8.
- Encoding: set the console to UTF-8 (code page 65001) or write UTF-16 through
  `WriteConsoleW`. Mojibake still happens, so keep the ASCII glyph fallback.
- Some ConPTY hosts mishandle positioned incremental writes. A TUI should offer a
  full-repaint fallback.

---

## TUIs: When and Which Kind

**A TUI fits** repeated, keyboard-driven exploration of changing state: process monitors,
git and Kubernetes clients, file managers, log viewers, and agent sessions. It also fits
work over SSH or on headless machines, for users who live in the terminal. A **plain CLI**
fits one-shot actions, pipelines, and automation. A **GUI** fits rich media, drag-heavy
editing, non-technical users, and products where accessibility is a primary requirement.

**A TUI is a layer over a scriptable core, never the only interface.** Every action has a
command or flag equivalent. Never launch the TUI when stdout isn't a TTY or in CI. Offer
a headless mode (for example `claude -p`), and point to it from the docs.

**Inline vs alternate screen** is the main architecture decision:

| | Alternate screen (vim, htop, k9s, lazygit) | Inline / primary buffer (fzf `--height`, atuin inline, agent CLIs) |
|---|---|---|
| Gains | Full control, easy flicker-free rendering, virtualized views | Native scrollback, terminal search, native select and copy; output stays after exit |
| Costs | Breaks native scrollback, search, and copy; nothing survives exit; some multiplexers give it no scrollback | Harder to diff-render; resizing can garble earlier output |
| Fits | Dashboards and navigators you enter and leave | Pickers, prompts, conversational and log-like tools |

- Agent TUIs have gone both ways and now usually offer both (Codex has
  `alternate_screen = auto|always|never`, and Claude Code has an inline renderer plus an
  opt-in fullscreen mode).
- If you go fullscreen, rebuild what you took away:
  - in-app search (`/`, `n`/`N`)
  - a way to dump content to native scrollback or open it in `$EDITOR`
  - in-app selection that copies to the clipboard, using OSC 52 over SSH
  - a "jump to bottom (N new)" indicator when auto-follow is paused

## TUI Layout & Resizing

**Canonical regions:** a header (context: cluster, repo, branch, path), the main panes, a
status line (mode, position, transient messages), and a footer key-hint bar.

**Archetypes:**
- **Dashboard** (htop, btop): meters on top and a sortable table below.
- **Master-detail panels** (lazygit, gitui): numbered side panels with detail for the
  selection.
- **Drill-down stack** (k9s): `:pod` opens a view, Enter drills in, Esc pops back, like
  browser history.
- **Miller columns** (yazi, ranger): parent, current, and preview columns.
- **Modal editor** (helix): a buffer with the mode in the status line and popups for
  prefix keys.
- **Inline picker** (fzf, atuin): N rows under the prompt, with scrollback intact.
- **Chat / agent** (Claude Code, Codex, Gemini CLI): a streaming transcript, a fixed input
  at the bottom, and a status row.

**Resizing:**
- Handle `SIGWINCH`, propagate the new size to every component, and re-layout from
  measured content. Never hard-code heights.
- Design for an **80×24 baseline** (the default test size in Textual) and degrade below
  it in this order: hide secondary panes, drop borders, collapse the hint bar to
  `? help`, then middle-truncate labels.
- Below an absolute minimum, show `Terminal too small: need 80×24, have 60×18`. That
  screen must still respond to `q` and Ctrl-C. btop and bpytop shipped too-small screens
  you couldn't quit.

**Borders:** box drawing (`─│┌┐`, rounded `╭╮╰╯`) separates panes. The focused pane is
marked by colour **and** something else: a heavier or double border, or a title marker.
Each bordered pane costs 2 columns and 2 rows, so swap borders for single rules at small
sizes. Drop them in accessible mode.

## TUI Keyboard Design

**Conventions.** Borrow them before inventing keys:

| Key | Meaning |
|---|---|
| `q` | Quit or close the view. Inactive while typing in an input |
| `Esc` | Cancel, back one level, or leave a mode. Never quits the whole app from deep inside |
| `Ctrl-C` | Interrupt or quit. Always works (may copy if text is selected) |
| `?` | Help overlay for the current context |
| `/` then `n`/`N` | Search or filter, then next/previous match |
| `:` | Command mode (k9s, vim, helix) |
| `↑↓` / `j k`, `←→` / `h l` | Move. Vim keys are accelerators, always paired with arrows |
| `g`/`G`, Home/End | Top/bottom |
| `Ctrl-u`/`Ctrl-d`, PgUp/PgDn | Half page or page |
| `Tab` / `Shift-Tab` | Cycle focus between panes or widgets |
| `Enter` / `Space` | Open or select / toggle or mark |
| `Ctrl-P` | Command palette |
| `Ctrl-L` | Redraw |
| `Ctrl-Z` | Suspend to the shell |
| `1`–`9`, `[` `]` | Jump to a panel, cycle tabs |

**Rules:**
- **Text inputs keep readline editing**: Ctrl-A/E (line start and end), Ctrl-W (delete
  word), Ctrl-U/K (delete to start or end), Alt-B/F (word back and forward).
- **Modal vs modeless.** Modal designs (vim, helix, k9s command mode) are fast for
  experts, but the current mode must always be visible and Esc must reliably return to
  normal. Navigation-heavy tools should default to modeless single-key commands. When a
  text input is focused, keys go to the input, never to both the input and a command.
- **Dangerous keys** are distinct and harder to hit. Avoid single unconfirmed keys next to
  common ones. k9s puts delete behind a confirm dialog and kill on a separate chord.
- **Keys legacy terminals can't distinguish:**
  - Ctrl-I = Tab, Ctrl-M = Enter, Ctrl-[ = Esc, Ctrl-H ≈ Backspace
  - Ctrl-Shift-letter = Ctrl-letter
  - Ctrl-digit and many Alt combinations are unreliable, and Cmd/Super never arrive
  - Some keyboards can't send some combinations at all (MacBooks lack Ctrl-End)

  Never make any of these the only path to an action.
- **Esc delay.** In the legacy encoding a lone Esc looks like the start of an escape
  sequence, so apps wait. ncurses classically waited about 1 s, and tmux waited 500 ms
  before version 3.5, which lowered it to 10 ms. Keep your timeout around 25–50 ms
  locally, and allow longer over slow SSH.
- **Kitty keyboard protocol** (kitty, Ghostty, WezTerm, foot, Alacritty, iTerm2, Windows
  Terminal, and others) fixes ambiguous keys, gives a reliable lone Esc, and reports all
  modifiers and key releases. Enable it as progressive enhancement: push with
  `CSI > flags u`, and **pop with `CSI < u` on exit**, or the user's shell is left
  broken. Keep the legacy fallback.
- **Rebindable keys.** Make keys rebindable through config, using named actions
  (`scroll:bottom`). Show the user's actual bindings in hints and help, not the defaults.
- **International layouts.** `/ ? : [ ] { } @ |` need Shift or AltGr on many layouts,
  and Alt-letter can collide with AltGr characters. Match on the character received, put
  core actions on letters and named keys, and give alternatives for bracket bindings.

## Discoverability

Use three tiers, all context-sensitive (they change with the focused pane or mode):
1. **Footer hint bar.** 4–8 keys relevant here, always including `? help` and the
   quit/back key (nano's `^X Exit`, Textual's `Footer`).
2. **`?` overlay.** Every binding for the current context, grouped, and ideally filterable
   and executable from the list (lazygit).
3. **Command palette.** Ctrl-P or `:` with fuzzy matching. The empty state lists common
   commands, and each entry shows its shortcut so users learn it.

**Progressive disclosure.** Expose the core loop first, put advanced actions behind
per-pane menus (lazygit's `x`), and gate expert modes behind config. **After a prefix
key**, pop up the possible continuations (helix, or which-key in Neovim).

**Familiar conventions** lower the learning cost. Claude Code's transcript viewer copies
`less` keys outright (`/ n N j k g G Space b q`).

## Focus, Selection & Mouse

**Focus and selection:**
- Exactly one focused region. Tab follows visual order and skips hidden widgets.
- Mark the selection with **more than colour**: reverse video or a background bar, plus
  a marker glyph (`>`, `▶`). Multi-select needs a separate mark (`[x]`, `*`) distinct
  from the cursor row.
- Keep the selection stable across live refreshes by tracking it **by ID, not by row
  index**. Otherwise a refreshing process list moves the selection under the user.
- Show the scroll position in long lists: a scrollbar, `↑ 12 more`, or `34/340`.
- Hide the hardware cursor in lists and show it at the caret in inputs. In accessible
  mode, park it on the selected row so magnifiers and screen readers follow it.

**Mouse** is optional and never required. Every mouse action has a key path.
- Use SGR mouse encoding (mode 1006) with click and drag tracking (1000/1002). Use
  any-motion tracking (1003) only if hover matters.
- **Capturing the mouse breaks native text selection.** Document the bypass modifier
  (usually Shift, Option in iTerm2), provide a setting to turn capture off, or implement
  in-app selection with clipboard copy (OSC 52 over SSH).
- Wheel speed varies a lot between terminals. Start around 3 lines per notch and make it
  configurable. tmux needs `mouse on` to forward wheel events.
- Ctrl/Cmd-click opens links, matching native behaviour. A plain click doesn't.

## Rendering & Performance

- **Never clear and redraw.** Render into an off-screen buffer, diff it against the
  previous frame, and write only the changed cells in a single write (Ratatui's double
  buffer, Textual's compositor, Bubble Tea's renderer).
- **Synchronized output (DEC mode 2026):** wrap each frame in `CSI ? 2026 h` …
  `CSI ? 2026 l` so the terminal paints it atomically. Supported by kitty, Ghostty,
  WezTerm, iTerm2, Alacritty, foot, Windows Terminal, and others, but not by GNOME
  Terminal (VTE), and not passed through by tmux as of 3.6. Probe for it first.
- **Cap the frame rate** (Textual targets 60 fps, Ink defaults to 30) and coalesce bursts.
  Streaming text, such as LLM tokens or logs, batches to the frame tick instead of
  redrawing per chunk.
- **Virtualize** long lists and transcripts: render only the visible rows, and write
  finished content once (Ink `<Static>`) so it's never re-rendered.
- **Never block the UI loop.** I/O runs in commands, workers, or tasks, and results come
  back as messages. Mutate state only in the update loop. Tag requests with IDs, because
  results arrive out of order.

## Terminal State Hygiene

**On entry**, record what you change: raw mode, alternate screen, hidden cursor, mouse
modes, bracketed paste (2004), focus events (1004), and kitty keyboard flags.

**On exit, restore everything in reverse order.** This includes errors, panics, and
signals, and cleanup runs under a timeout. A crash that leaves the shell in raw mode,
with no visible cursor or with mouse reporting on, is the worst first impression a TUI
can make.
- Install a panic hook that restores the terminal before printing the error. Ratatui's
  `ratatui::init()` does this. Recover panics inside background tasks too.
- **Ctrl-Z / SIGTSTP:** restore the terminal, then stop. On SIGCONT, re-enter raw mode
  and the alternate screen and repaint fully.
- **SIGWINCH:** re-layout and repaint fully.
- Use **bracketed paste**, so a pasted multi-line block arrives as text and doesn't fire
  keybindings.

## Feedback, Errors & Notifications in TUIs

- Show activity **where the work is**: a spinner in the pane that's loading, not a
  global freeze. Show progress or ETA for long work.
- **Non-blocking errors** go in the status line or a toast that auto-dismisses, backed by
  a log or history view so dismissed messages can be found again (lazygit's command log).
  **Blocking errors** go in a modal with a clear action.
- Never let raw stderr or a library's `console.log` tear through the frame. Capture it
  and route it to the log view.
- **Confirmations** name the target and default to the safe answer
  (`Delete pod api-7f9? [y/N]`). Prefer undo where the domain has it (lazygit's `z`
  undoes via the reflog).
- **When unfocused or finished**, ring the terminal bell, send a desktop notification
  (OSC 9 / OSC 777), or set the window title when a long task completes or the app needs
  input. Make it configurable.
- **Destructive domains** get a read-only mode (`k9s --readonly`).

## Frameworks & Testing

| Framework | Language | Model & notable features |
|---|---|---|
| Bubble Tea v2 + Lip Gloss + Bubbles + Huh | Go | Elm architecture (Init/Update/View); synchronized output, keyboard enhancements; Huh forms with an accessible mode |
| Ratatui | Rust | Immediate mode, diffed double buffer; `init()`/`restore()` with a panic hook. Used by Codex, yazi, gitui, atuin |
| Textual | Python | Widget tree, CSS-like styling, theme tokens, Ctrl-P palette, `Footer` bindings |
| Ink | JS/TS (React) | Flexbox `<Box>`, `<Static>`, `useInput`/`useFocus`/`usePaste`, screen-reader props. Used by Gemini CLI and Copilot CLI |
| tview (on tcell) | Go | Widget-based. Used by k9s |
| notcurses | C | Advanced graphics, modern terminal protocols |

**Testing:**
- **Snapshot** the rendered screen at fixed sizes: 80×24 plus one narrow and one wide
  size. Tools: Ratatui `TestBackend` + insta, `pytest-textual-snapshot`, Ink's
  `ink-testing-library`, Bubble Tea's `teatest`.
- Drive tests with simulated keys and resize events (Textual's `Pilot`).
- Test the too-small screen, the `NO_COLOR` and non-TTY paths, and crash recovery
  (the terminal is restored).
- Record **VHS** tapes for demos and golden-output checks in CI.

## Exemplars

- **lazygit:** numbered panels, a context footer, a filterable and executable `?` menu,
  per-panel `x` menus, undo through the reflog, and a command log.
- **k9s:** `:` resource commands, `/` regex filter, Esc as a back stack, a context
  header, and `--readonly`.
- **htop / btop:** dense live dashboards, F-key footer labels, in-place sort and filter,
  and an optional mouse.
- **helix:** selection then action, auto-info popups after prefix keys, and the mode in
  the status line.
- **fzf:** does one thing, works inline, and is fully scriptable through stdin and
  stdout.
- **yazi:** async I/O so the UI never blocks, Miller columns with previews, and modern
  keyboard and image protocols.
- **Claude Code:** inline and fullscreen renderers with escape hatches back to native
  scrollback, a thorough screen-reader mode, rebindable named actions, platform-aware
  hints, and auto-follow with a jump-to-bottom indicator.

---

## Quick Checklist

**Output**
- [ ] Colour is semantic, never the only signal, from the 16-colour palette, default foreground for text
- [ ] `NO_COLOR`, `TERM=dumb`, non-TTY, and `--color` are honoured; colour is reset after every span
- [ ] Progress: spinner, X of Y, or bar chosen by the work; on stderr; ≤ 20 Hz; past-tense summary at the end
- [ ] No animation or `\r` in pipes or CI; `tool > file` contains no escape codes
- [ ] ASCII fallback for glyphs; no emoji in aligned columns; widths measured in grapheme clusters
- [ ] Borderless tables, untruncated and tab-separated when piped; prose capped near 100 columns
- [ ] Opt-in accessible mode: linear output, numbered menus, static progress, labelled lines

**TUI**
- [ ] Never the only interface; doesn't launch without a TTY; headless equivalents exist
- [ ] Inline vs alternate screen chosen deliberately; fullscreen restores search, copy, and export
- [ ] Works at 80×24; degrades gracefully; the too-small screen still quits
- [ ] `q`, Esc, Ctrl-C, `?`, `/`, arrows plus vim keys; readline keys work in inputs; keys are rebindable
- [ ] Footer hints + `?` overlay + command palette, all reflecting the user's bindings
- [ ] Focus and selection marked by more than colour; selection tracked by ID across refreshes
- [ ] Mouse optional; a way back to native selection
- [ ] Diffed rendering, synchronized output, capped frame rate, virtualized lists, non-blocking I/O
- [ ] Terminal fully restored on exit, panic, signal, and Ctrl-Z; kitty flags popped

## Common Mistakes

- Hard-coded RGB or forced white text that disappears on a light theme
- Red/green status with no symbol or word
- Spinners writing hundreds of `\r` frames into CI logs; a frozen timer spinner hiding a hang
- Emoji in table columns that knock the alignment out in half of all terminals
- A box-bordered table that can't be grepped and gets read aloud as "box drawings light horizontal"
- A TUI as the only way to perform an action, or one that launches when piped
- Clear-and-redraw flicker; redrawing on every streamed token
- A crash that leaves the terminal in raw mode with the cursor hidden
- Mystery-meat keys: no footer, no `?`, no palette; hints that show defaults the user has rebound
- `q` quitting while the user types in a search box; Esc exiting the whole app
- Ctrl-I, Ctrl-Shift-X, or Cmd as the only binding for an action
- Mouse capture with no way to select and copy text
- An alternate-screen app that loses everything on exit with no export or copy path
- A selection that jumps rows when a live list refreshes

---

## Sources

- [Command Line Interface Guidelines (clig.dev)](https://clig.dev/)
- [NO_COLOR](https://no-color.org/) · [FORCE_COLOR](https://force-color.org/) · [CLICOLOR](https://bixense.com/clicolors/) · [chalk/supports-color](https://github.com/chalk/supports-color) · [termstandard/colors](https://github.com/termstandard/colors) · [termenv (OSC 11)](https://pkg.go.dev/github.com/muesli/termenv)
- [Evil Martians — CLI UX: 3 patterns for progress displays](https://evilmartians.com/chronicles/cli-ux-best-practices-3-patterns-for-improving-progress-displays) · [indicatif](https://docs.rs/indicatif/latest/indicatif/)
- [OSC 8 hyperlinks spec](https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda) · [OSC 8 adoption](https://github.com/Alhadis/OSC8-Adoption)
- [Hashimoto — Grapheme clusters in terminals](https://mitchellh.com/writing/grapheme-clusters-in-terminals) · [Quast — State of terminal emulation 2025](https://jeffquast.com/post/state-of-terminal-emulation-2025)
- [GitHub — Building a more accessible GitHub CLI](https://github.blog/engineering/user-experience/building-a-more-accessible-github-cli/) · [gh environment](https://cli.github.com/manual/gh_help_environment)
- [Sampath, Merrick, Macvean — Accessibility of Command Line Interfaces (CHI '21)](https://research.google/pubs/accessibility-of-command-line-interfaces/)
- [Claude Code — accessibility](https://code.claude.com/docs/en/accessibility) · [fullscreen mode](https://code.claude.com/docs/en/fullscreen)
- [Microsoft — Console virtual terminal sequences](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences) · [Classic vs VT](https://learn.microsoft.com/windows/console/classic-vs-vt)
- [Synchronized output spec](https://github.com/contour-terminal/vt-extensions/blob/master/synchronized-output.md) · [Kitty keyboard protocol](https://sw.kovidgoyal.net/kitty/keyboard-protocol/) · [tmux FAQ](https://github.com/tmux/tmux/wiki/FAQ)
- [Textual — design guide](https://textual.textualize.io/guide/design/) · [testing](https://textual.textualize.io/guide/testing/) · [algorithms for high-performance terminal apps](https://textual.textualize.io/blog/2024/12/12/algorithms-for-high-performance-terminal-apps/)
- [Ratatui — rendering under the hood](https://ratatui.rs/concepts/rendering/under-the-hood/) · [panic hooks](https://ratatui.rs/recipes/apps/panic-hooks/) · [snapshot testing](https://ratatui.rs/recipes/testing/snapshots/)
- [Charm v2 announcement](https://charm.land/blog/v2/) · [Huh](https://github.com/charmbracelet/huh) · [VHS](https://github.com/charmbracelet/vhs) · [Ink](https://github.com/vadimdemedes/ink)
- [Helix keymap](https://docs.helix-editor.com/keymap.html) · [lazygit keybindings](https://github.com/jesseduffield/lazygit/blob/master/docs/keybindings/Keybindings_en.md) · [k9s commands](https://k9scli.io/topics/commands/)
