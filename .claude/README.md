# Claude Code setup for React Mosaic

Project guidance lives in the root **`../AGENTS.md`** (tool-neutral — also read by
Cursor, Codex, Aider, Zed, …). `../CLAUDE.md` imports it so Claude Code picks it
up, and adds the Claude-specific pieces below.

## Layout

```
AGENTS.md          # Canonical, tool-neutral guide. Single source of truth.
CLAUDE.md          # @imports AGENTS.md + the context files, and names the subagents.
.claude/
├── context/       # Detailed refs — @imported by CLAUDE.md, linked from AGENTS.md
│   ├── architecture.md   # MosaicNode tree, key files, API, theming, migration
│   └── development.md     # commands, testing, build, git/PR, CI, troubleshooting
├── agents/        # Claude Code subagents (auto-delegated by their description)
│   ├── mosaic-tree-expert.md
│   ├── component-reviewer.md
│   └── feature-planner.md
├── commands/      # Slash-command shortcuts (/test, /build, /lint, …)
├── settings.json  # Project settings
└── README.md      # This file
```

## Conventions for the docs themselves

- **`AGENTS.md` is the single source of truth** for guidance — keep it lean and
  high-signal. No duplicate QUICKREF / CONTRIBUTING docs.
- **`CLAUDE.md` holds no original content** — only imports plus Claude-specific
  notes (the subagents).
- Deep or rarely-needed material goes in `context/*` (imported by `CLAUDE.md`,
  linked from `AGENTS.md`), so it's written once.
- Reusable workflows belong in `agents/` (a subagent with its own prompt and
  model), not as prose in the guides.
