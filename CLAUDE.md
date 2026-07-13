# CLAUDE.md

The canonical project guidance lives in `AGENTS.md` (tool-neutral, shared with
other agent tools). Claude Code reads only this file, so it imports that one:

@AGENTS.md

## Claude Code specifics

Detailed references, imported into context:

@.claude/context/architecture.md
@.claude/context/development.md

**Specialist subagents** (`.claude/agents/`) — delegate to these proactively:

- **mosaic-tree-expert** — analyze, visualize, or diagnose the MosaicNode tree,
  or explain a core concept (read-only).
- **component-reviewer** — review a component or diff against library conventions.
- **feature-planner** — produce a phased implementation plan for a new feature.
