# UX Designer Skill

A Claude Code skill that provides comprehensive UX/UI design guidance based on modern best practices (2026).

## What It Does

Gives Claude deep knowledge of user experience design principles so it can:

- Design new interfaces and components with proper patterns
- Review existing UI/UX and frontend code for issues
- Apply WCAG 2.2 AA accessibility standards
- Guide interaction design, form design, and navigation
- Advise on mobile-first and responsive approaches
- Write effective UI copy and microcopy
- Design collaborative/multiplayer and canvas-based apps
- Build AI-powered interfaces (chat, copilots, agents)
- Evaluate designs for dark patterns and ethical compliance
- Design onboarding, notifications, search, data tables, and dashboards
- Internationalize UI and support right-to-left (RTL) languages
- Design voice and multimodal interactions
- Design barcode/QR scanning (camera and hardware scanners) and code display
- Design CLIs and TUIs (flags, help, output contracts, terminal colour/progress, keybindings, terminal accessibility)
- Check compliance with the European Accessibility Act (EAA)

## Installation

Clone the repository into your Claude Code skills directory:

```bash
# Personal (all projects)
git clone https://github.com/szilu/ux-designer-skill.git ~/.claude/skills/ux-designer

# Or project-only
git clone https://github.com/szilu/ux-designer-skill.git .claude/skills/ux-designer
```

Or download a release archive and extract it to one of those paths. The directory name (`ux-designer`) is the skill name.

The skill is invocable by both user (`/ux-designer`) and Claude (auto-triggered when UX topics arise).

## Structure

```
ux-designer/
├── SKILL.md                              # Workflows, core rules, routing table
└── references/                           # Detailed reference files (each opens with a TOC)
    ├── 01-core-principles.md             # Nielsen heuristics, Gestalt, visual hierarchy
    ├── 02-laws-of-ux.md                  # Fitts's, Hick's, Miller's, Jakob's, etc.
    ├── 03-accessibility.md               # WCAG 2.2 AA compliance
    ├── 04-visual-design.md               # Typography, color, spacing, hierarchy
    ├── 05-information-architecture.md    # Navigation, sitemaps, card sorting
    ├── 06-interaction-design.md          # Modals, tooltips, drag-and-drop
    ├── 07-forms-and-inputs.md            # Validation, field types, error handling
    ├── 08-mobile-ux.md                   # Touch targets, gestures, responsive
    ├── 09-ux-writing.md                  # Microcopy, tone, error messages
    ├── 10-user-research.md               # Interviews, usability testing, surveys
    ├── 11-design-systems.md              # Tokens, components, documentation
    ├── 12a-presence-awareness.md         # Live cursors, avatars, typing indicators
    ├── 12b-conflict-resolution-sync.md   # OT/CRDTs, locking, offline sync
    ├── 13a-canvas-navigation.md          # Zoom, pan, selection, manipulation
    ├── 13b-canvas-objects-performance.md # Layers, snapping, LOD, culling
    ├── 14-ai-ux-patterns.md              # Chat UI, copilots, agents, generative UI
    ├── 15-ethical-design.md              # Dark patterns, consent, GDPR/DSA
    ├── 16-onboarding.md                  # First-run, activation, empty states
    ├── 17-notifications.md               # Toasts, badges, push, attention management
    ├── 18-data-visualization.md          # Charts, dashboards, KPIs
    ├── 19-search-ux.md                   # Autocomplete, filters, results ranking
    ├── 20-emotional-design.md            # Trust, delight, brand personality
    ├── 21-data-tables.md                 # Sorting, pagination, bulk actions, inline edit
    ├── 22-performance-ux.md              # Skeletons, optimistic updates, CLS, lazy loading
    ├── 23-internationalization.md        # i18n, RTL, Intl formatting, plurals
    ├── 24-voice-and-multimodal.md        # Voice, multimodal, cross-device input
    ├── 25a-barcode-camera-scanning.md    # Camera scanning on phone/web, QR safety
    ├── 25b-barcode-scanner-workflows.md  # Scan-driven apps, wedge scanners, GS1 primer
    ├── 25c-barcode-display.md            # Showing codes on screens, wallet passes, print
    ├── 26a-cli-design.md                 # Commands, flags, help, streams, exit codes, agent CLIs
    └── 26b-terminal-output-and-tui.md    # Colour, progress, terminal a11y, TUI layout/keys/rendering
```

## SKILL.md Highlights

The main file (loaded when the skill triggers) includes:

- **Workflows** for reviewing/auditing a UI (render, extremes, severity-ranked findings) and for building UI (reuse, all states, semantics, verify)
- **Generated-UI defaults to avoid** (common model-generated aesthetic tells)
- **Core rules** per domain, and **decision trees** for modal/panel/page and notification types
- **Reference values** with sources, a **routing table** saying when to load each reference file, and anti-patterns linked to their fixes

Reference files are loaded on demand when the topic is relevant, keeping context usage efficient.

## Coverage Areas

| Domain | References |
|--------|-----------|
| Foundations | Core principles, Laws of UX, accessibility, visual design |
| Structure | Information architecture, interaction design, forms |
| Platform | Mobile UX, design systems |
| Content | UX writing, user research |
| Collaboration | Presence/awareness, conflict resolution/sync |
| Canvas/Spatial | Navigation/interaction, objects/performance |
| Modern | AI interfaces, ethical design, emotional design |
| Flows | Onboarding, notifications, search |
| Data | Data visualization, data tables, performance/loading |
| Global & Input | Internationalization/RTL, voice and multimodal, barcode scanning & display |
| Terminal | CLI design, terminal output & TUIs |

## Sources

The skill synthesizes guidance from sources including Nielsen Norman Group, WCAG 2.2, Material Design, Apple HIG, Laws of UX, Google PAIR, Microsoft HAX Toolkit, Baymard Institute, The A11y Project, and web.dev.

## License

[MIT](LICENSE)
