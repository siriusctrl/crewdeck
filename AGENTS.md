Principles for agents contributing to this repository.

## Mission

Build an AI-native project management tool where agents are first-class team members — assignable, reviewable, and autonomous within defined boundaries.

## Core Principles

1. **KISS**
   - Prefer the simplest solution that works.
   - Avoid premature abstraction. Add complexity only when the current design breaks.
   - If a feature can be a function, don't make it a class. If it can be a file, don't make it a package.

2. **Conventional Commits**
   - Use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.
   - Split logically distinct changes into separate commits. One purpose per commit.
   - Examples: `feat: add card drag-and-drop`, `fix: agent status not updating on completion`, `docs: add adapter interface spec`.

## Engineering Rules

- TypeScript everywhere. Shared types live in a `core` package.
- Keep domain logic pure and testable; isolate side effects (network, storage, agent calls) behind interfaces.
- Validate at boundaries. Trust nothing from external agents or webhooks.
- When behavior changes, update tests and docs in the same commit.

## Collaboration Preferences

- Use direct engineering judgment. Don't ask "should I...?" when the answer is obvious.
- State what's necessary vs optional, with brief tradeoff reasoning.
- Ask questions only when blocked or when scope/risk materially changes.

## GitHub Workflow

- `gh` is configured in this environment. Use the GitHub CLI for GitHub operations when needed.
- Prefer `gh` over hand-rolled API calls or browser instructions for common tasks such as inspecting repos, issues, PRs, workflow runs, and auth-backed GitHub interactions.
- When creating commits locally, use the repository's configured git identity rather than ad hoc placeholder names.
