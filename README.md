# crewdeck

AI-native project management. Agents are first-class team members.

## What is this?

A Kanban-style project board where AI agents (Claude Code, Codex, OpenClaw, etc.) sit alongside humans as assignees, reviewers, and collaborators. Not "project management with AI features" — project management designed from day one for human-agent teams.

## The Problem

Every AI coding tool today is chat-first. You talk to an agent, it writes code, you review in a conversation thread. But real engineering work is task-first: you have issues, priorities, dependencies, and you need a global view — not a message stream.

Meanwhile, project management tools (Linear, Jira, Notion) treat assignees as humans only. There's no way to assign a task to an agent, have it execute autonomously, and route the output through a review pipeline.

## How It Works

```
Board (per repo or project)
  └── Card (task / feature / bug / idea)
        ├── Discussion thread (humans + agents)
        ├── Assignee: human or agent
        ├── Reviewer: human or agent
        ├── Automation rules (on enter column → trigger agent)
        └── State: Backlog → In Progress → Review → Done
```

### Flow

1. Create a card (manually or synced from GitHub Issues)
2. Assign to an agent (Codex, Claude Code, OpenClaw, or any adapter)
3. Agent executes, posts progress updates on the card
4. Agent marks complete → card moves to Review
5. Reviewer (human or agent) reviews, approves or sends back
6. Done

### Key Design Decisions

- **Agent as first-class assignee** — agents and humans share the same assignment model
- **Adapter pattern for agents** — each agent backend (Codex, Claude Code, OpenClaw) is a pluggable adapter
- **Git-connected but not Git-dependent** — boards can sync with GitHub/GitLab, but also work standalone for non-code tasks (research, writing, data analysis)
- **Automation engine** — configurable rules: "when card enters Review, assign to X as reviewer"
- **Async-first** — designed for mobile/remote review workflows, not real-time pairing

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Backend**: Hono (TypeScript)
- **Frontend**: Vite + React (TypeScript)
- **Shared types**: `packages/core`

## Project Structure

```
crewdeck/
├── packages/
│   ├── core/        # Shared types, domain models
│   ├── api/         # Hono backend
│   └── web/         # Vite + React frontend
├── AGENTS.md        # Agent contribution guidelines
├── CLAUDE.md        # → symlink to AGENTS.md
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Development

```bash
pnpm install
pnpm dev          # starts api + web in parallel
pnpm dev:api      # api only
pnpm dev:web      # web only
pnpm test         # run all tests
pnpm typecheck    # type check all packages
```

## License

MIT
