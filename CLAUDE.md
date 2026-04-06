# Concert 2

Generation 2 of the opinionated agentic development life-cycle.

## Project Overview

This is the Concert framework itself — an orchestration system for agentic software development workflows. It manages missions through a structured pipeline (vision → requirements → architecture → UX → tasks → execution).

## Git Conventions

- Base branch: `main`
- Commit format: conventional commits (`type: description`)
- Pre-v1: breaking changes don't require major version bumps

## Development

- Concert configuration lives in `concert.jsonc`
- Mission state is tracked in `.concert/state.json`
- Workflows are defined in `.concert/workflows/`
- Agent definitions are in `.claude/agents/`
- Skills are in `.claude/skills/`

<!-- CONCERT:START — DO NOT MODIFY THIS SECTION. It is managed by Concert and will be overwritten on `concert update`. -->

## Concert

This project uses [Concert](https://github.com/he3-org/concert) for agentic development orchestration.

### Commands

| Command                | Claude Code         | Copilot / GitHub Agents |
| ---------------------- | ------------------- | ----------------------- |
| Start a new mission    | `/concert:init`     | `@concert-init`         |
| Review a stage         | `/concert:review`   | `@concert-review`       |
| Accept a stage         | `/concert:accept`   | `@concert-accept`       |
| Check current status   | `/concert:status`   | `@concert-status`       |
| Continue to next stage | `/concert:continue` | `@concert-continue`     |
| Debug an issue         | `/concert:debug`    | `@concert-debug`        |
| Fix an error (TDD)     | `/concert:fix`      | `@concert-fix`          |
| Verify work            | `/concert:verify`   | `@concert-verify`       |
| Run a quick task       | `/concert:quick`    | `@concert-quick`        |
| Restart a stage        | `/concert:restart`  | `@concert-restart`      |
| Replan from a stage    | `/concert:replan`   | `@concert-replan`       |
| Delete mission         | `/concert:delete`   | `@concert-delete`       |

### State

- Configuration: `concert.jsonc`
- State: `.concert/state.json`
- Agents: `.claude/agents/`
- Workflows: `.concert/workflows/`
- Skills: `.claude/skills/`
- Missions: `.concert/missions/`

### Do Not Modify

The following paths are managed by Concert and must not be modified by other agents, refactoring tools, or automated processes. They will be overwritten on `concert update`:

- `.claude/agents/`
- `.concert/workflows/`
- `.claude/skills/`
- `.claude/commands/concert/`
- `.github/agents/concert-*.agent.md`
- `concert.jsonc` (modify manually only — Concert preserves your changes on update)

<!-- CONCERT:END — DO NOT MODIFY THIS SECTION -->
