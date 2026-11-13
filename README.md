# dev-squad

A Claude Code plugin with a six-agent dev team for .NET + Angular projects.

| Agent | Model | Job |
|---|---|---|
| `backend-senior` | claude-opus-5-5 | Plans backend tasks, reviews backend code, answers the junior, implements pattern-setting tasks |
| `backend-junior` | claude-sonnet-5-5 | Implements one backend task |
| `frontend-senior` | claude-opus-5-5 | Plans frontend tasks, reviews frontend code, answers the junior, implements pattern-setting tasks |
| `frontend-junior` | claude-sonnet-5-5 | Implements one frontend task |
| `qa-backend` | sonnet | Validates backend tasks with executed evidence (read-only on code) |
| `qa-frontend` | sonnet | Validates frontend tasks with executed evidence (read-only on code) |

## How they communicate

Claude Code subagents cannot call each other, so the main conversation is the orchestrator. A `SessionStart` hook injects `workflow/ORCHESTRATION.md` (routing + lifecycle). The agents' shared memory is the **host project's** `ProjectInfo/` folder:

```
senior (PLAN) -> T-001 todo -> junior -> in-review -> senior (REVIEW) -> changes-requested -> junior ... -> in-qa -> QA -> done | qa-failed
```

- All agents read `ProjectInfo/*.md` first; those files override the plugin's defaults.
- Tasks live in `ProjectInfo/tasks/T-NNN-slug.md` of the project using the plugin, never in the plugin.
- Full-stack features become two tasks linked by `Depends on`; the backend task carries the API `Contract`.
- Nothing is committed unless you ask. A third review round, a blocked QA, or a business decision stops the loop and asks you.

## Install in a project

1. Publish this plugin to your marketplace (copy `plugins/dev-squad` into `devsys-claude-plugins/plugins/` and add the entry from `.claude-plugin/marketplace.json`), or add this folder as its own marketplace.
2. In the project, merge `plugins/dev-squad/templates/settings.snippet.json` into `.claude/settings.json` (enables the plugin and sets permissions).
3. Start Claude Code and run the `dev-squad:init-projectinfo` skill. It creates and pre-fills `ProjectInfo/`. Complete `project.md`.
4. Ask for a feature ("plan the partner approval screen"). The right agent starts automatically.

## Skills

- `dev-squad:dotnet-mariadb-stack` — backend agents (.NET latest LTS, EF Core + MariaDB, layered architecture)
- `dev-squad:angular-stack` — frontend agents (Angular latest stable, signals, no leaks, reusability)
- `dev-squad:init-projectinfo` — scaffolds `ProjectInfo/`

## Notes

- If a project also enables `team-workflow`, disable one of them: both inject a dispatcher at session start.
- Automatic triggering relies on the agents' `description` fields plus the injected routing rules; the orchestrator (main conversation) remains responsible for starting the next step.
