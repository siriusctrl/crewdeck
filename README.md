# crewdeck

AI-native project management for a single user. Agents are first-class teammates.

## What is this?

A single-user Kanban-style project board where AI agents (Claude Code, Codex, OpenClaw, etc.) sit alongside you as assignees, reviewers, and collaborators. Not "project management with AI features" but a local task system designed from day one for human-agent workflows.

## The Problem

Every AI coding tool today is chat-first. You talk to an agent, it writes code, you review in a conversation thread. But real engineering work is task-first: you have issues, priorities, dependencies, and you need a global view — not a message stream.

Meanwhile, project management tools (Linear, Jira, Notion) are built around teams, accounts, permissions, and human-only assignees. There's no clean way to assign a task to an agent, have it execute autonomously, and route the output through a review pipeline without dragging in multi-user complexity you may not need.

## How It Works

```
Workspace (single local user)
  └── Board (per repo or project)
        └── Card (task / feature / bug / idea)
              ├── Discussion thread (you + agents)
              ├── Assignee: human or agent
              ├── Reviewer: human or agent
              ├── Automation rules (on enter column -> trigger agent)
              └── State: Backlog -> In Progress -> Review -> Done
```

### Flow

1. Create a card (manually, or later synced from GitHub Issues)
2. Assign it to an agent (Codex, Claude Code, OpenClaw, or any adapter)
3. The agent executes and posts progress updates on the card
4. The agent marks work complete and the card moves to Review
5. You or another agent reviews, approves, or sends it back
6. Done

## Product Scope

crewdeck is intentionally single-user in its first design.

- No accounts, auth, orgs, roles, or invitations
- No multi-user permission model
- No real-time collaborative editing requirements
- Reviewer is a workflow role, not a separate user-management concept

This keeps the product focused on one operator orchestrating multiple agents. If collaboration becomes necessary later, it should be added on top of a stable single-user core rather than baked into every early decision.

### Key Design Decisions

- **Single-user by default** — one local operator, many agent collaborators
- **Agent as first-class assignee** — agents and humans share the same assignment model
- **Adapter pattern for agents** — each agent backend (Codex, Claude Code, OpenClaw) is a pluggable adapter
- **Git-connected but not Git-dependent** — boards can sync with GitHub/GitLab later, but also work standalone for non-code tasks (research, writing, data analysis)
- **Automation engine** — configurable rules: "when card enters Review, assign to X as reviewer"
- **Local-first persistence** — application state lives locally, optimized for reliability over shared access
- **Async-first** — designed for handoff and review workflows, not real-time pairing

## Architecture

The architecture should optimize for simplicity and a clean vertical slice, not for hypothetical scale.

### Core packages

- `packages/core`: shared types and pure domain logic
- `packages/api`: local API and application services
- `packages/web`: single-user UI

### Storage model

- SQLite for local persistence
- TypeScript repositories around a small set of tables
- No external database or hosted backend required for the MVP

Initial tables should cover:

- `boards`
- `cards`
- `comments`
- `actors`
- `automation_rules`
- `agent_runs`

### Runtime model

- Web UI talks to the local API
- API owns workflows, validation, and persistence
- Agent backends are adapters invoked by the API
- Domain rules stay in `core` so API and UI share the same vocabulary

### Out of scope for the first version

- Multi-user accounts and permissions
- Team workspaces
- Presence, live cursors, or collaborative editing
- Distributed job infrastructure
- Cloud-only architecture

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Backend**: Hono (TypeScript)
- **Frontend**: Vite + React (TypeScript)
- **Persistence**: SQLite
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
