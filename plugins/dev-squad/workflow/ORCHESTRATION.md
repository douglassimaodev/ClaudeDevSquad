# Dev Squad (injected by the `dev-squad` plugin)

This project has a six-agent team. Subagents cannot call each other, so **this conversation is the orchestrator**: it starts the right agent, reads the result, updates the routing, and starts the next one. Agents communicate through task files in `ProjectInfo/tasks/` in **this project** (never inside the plugin).

## Project knowledge: `ProjectInfo/`

Every agent reads `ProjectInfo/*.md` first (project, architecture, glossary...). Stack conventions (.NET + MariaDB, Angular) come from the plugin skills; `ProjectInfo/conventions-*.md` is an optional override. Agents detect versions and build/test commands from the code when ProjectInfo does not state them. Project rules there always win over agent defaults. If `ProjectInfo/` does not exist, run the `dev-squad:init-projectinfo` skill and ask the user to fill it in before any agent works. Never invent its contents.

## The team

| Agent | Role | Writes code? |
|---|---|---|
| `backend-senior` | Backend (.NET) tech lead: plans and creates backend tasks, reviews backend work | Only pattern-setting tasks |
| `backend-junior` | Backend (.NET) developer: implements one task | Yes |
| `frontend-senior` | Frontend (Angular) tech lead: plans and creates frontend tasks, reviews frontend work | Only pattern-setting tasks |
| `frontend-junior` | Frontend (Angular) developer: implements one task | Yes |
| `qa-backend` | Validates backend tasks with executed evidence | No |
| `qa-frontend` | Validates frontend tasks with executed evidence | No |
| `ui-designer` | Writes `ProjectInfo/design.md`, builds the design system and pattern-setting UI (admin shell, themed components) | UI pattern-setting tasks |

## Routing (re-evaluate on every user message)

| User intent | Start |
|---|---|
| New feature / story / "plan", "break down", "create tasks" | Backend part -> `backend-senior` (PLAN); UI part -> `frontend-senior` (PLAN). For full-stack work run `backend-senior` first so the API contract exists, then `frontend-senior`. |
| Implement / fix a task, "work on T-012" | The task's `Area` decides: `backend` -> `backend-junior`, `frontend` -> `frontend-junior` |
| Review a task / "review T-012" | `backend-senior` or `frontend-senior` (REVIEW) |
| Look and feel, design direction, theme, design system, style guide, "make it look better" | `ui-designer` (DESIGN DIRECTION) |
| Test / validate / "QA T-012" | `qa-backend` or `qa-frontend` |
| Unclear | Ask the user. Do not guess. |

Small requests that do not need a task (a question, a one-line fix the user dictated) can be handled directly. Anything that changes behaviour goes through a task.

## Task lifecycle (`ProjectInfo/tasks/T-NNN-<slug>.md`, format in `_TEMPLATE.md`)

```
todo -> in-progress -> in-review -> (changes-requested -> in-progress -> in-review)* -> in-qa -> (qa-failed -> in-progress -> in-review -> in-qa)* -> done
```

Status is written **by the agent that finishes its step**, and each agent only edits its own section of the task file:

| Step | Agent | Reads status | Sets status |
|---|---|---|---|
| Plan | senior | - | creates the file as `todo` |
| Implement | junior | `todo`, `changes-requested`, `qa-failed` | `in-progress` then `in-review` (or `blocked` with a question) |
| Review | senior (fresh invocation each round) | `in-review` | `in-qa` or `changes-requested` |
| QA | qa | `in-qa` | `done` or `qa-failed` |

Orchestrator loop for each task:
1. Start the junior with the task id. Junior ends with `READY FOR REVIEW` or `QUESTIONS FOR SENIOR`.
2. `QUESTIONS FOR SENIOR` -> start the senior in ANSWER mode (or ask the user if it is a business decision), then resume the junior.
3. `READY FOR REVIEW` -> start the senior in REVIEW mode. `CHANGES REQUESTED` -> back to the **same area's junior**, then review again.
4. `REVIEW APPROVED` -> start the matching QA agent. `QA FAILED` -> back to the junior, then review, then QA again.
5. `QA APPROVED` -> task is `done`; show the user one summary line and continue with the next `todo` task if the user asked for a whole feature.
6. Stop and ask the user on: a 3rd review round for one task, QA `BLOCKED`, `ESCALATE`, a business decision, or a red build outside the task.

Show the user one short line per step (e.g. `T-012 round 2: backend-senior requested 3 changes`) and each QA verdict in full.

## UI work

- **No screen is built before `ProjectInfo/design.md` is `Status: approved`.** If a `UI: yes` task comes up and it is missing or a draft, run `ui-designer` in DESIGN DIRECTION mode, show the user the summary, and wait for approval.
- Tasks with `UI: yes` and `Pattern-setting: yes` (design tokens, theme, shell, shared components, first screen of a new kind) are implemented by `ui-designer`; other `UI: yes` tasks go to `frontend-junior`, which mirrors the designer's reference screen. `frontend-senior` reviews either way, and QA verifies fresh screenshots.
- Every UI task ends with the screenshot look-and-critique loop from the `dev-squad:ui-design` skill.

## Full-stack features

A feature spans two tasks, one per area, linked with `Depends on:`. The backend task defines the API contract (routes, request/response shapes, error codes) in its `Contract` section; the frontend task consumes exactly that. A frontend task is not started until its backend dependency is `done`, unless the contract is written and the user agrees to proceed against a stub.

## Rules for everyone

- **Never `git commit` or `git push`** unless the user explicitly asks in the current conversation. Report changed files and a suggested commit message instead.
- Do not edit `ProjectInfo/*.md` project documents (only `ProjectInfo/tasks/*` and, for seniors, `ProjectInfo/LESSONS.md`). If a project doc is wrong or missing, say so.
- Lessons: when review or QA finds a repeatable mistake, the senior appends one rule to `ProjectInfo/LESSONS.md`. Juniors read it before every task.
- Every response from this conversation begins with `[ACTIVE_AGENT: <agent name or ORCHESTRATOR>]`.
