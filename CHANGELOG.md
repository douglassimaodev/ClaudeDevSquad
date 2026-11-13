# Changelog

All notable changes to the `dev-squad` plugin. Write notes under **Unreleased** as you go; on commit, `.githooks/pre-commit` bumps the version (patch by default) and moves them under the new version. For a minor or major bump run `node scripts/bump-version.mjs minor|major` before committing (or commit with `BUMP=minor`).

## [Unreleased]

## [0.2.0] - 2026-11-13

### Added
- `ui-designer` agent (Opus) and `ui-design` skill: approved `ProjectInfo/design.md` before any UI, design tokens, admin-template patterns, Syncfusion theming, screenshot look-and-critique loop.
- QA backend creates and drops a per-task scratch MariaDB database (`<project>_qa_<taskid>`, login `localhost`/`localhost`, grant limited to `%_qa_%`).
- OpenAPI contract: build-time `contracts/openapi.json` from the backend, `openapi-typescript` types for the frontend, checked by QA.
- Session resume from `ProjectInfo/tasks` status and per-task `Progress` checkpoints.
- Suggested commit message per approved task.
- One-step setup in `init-projectinfo`: merges permissions into `.claude/settings.json`, warns about `team-workflow`, checks the QA database login.
- Lessons scoped `project` / `stack`; stack lessons offered for promotion into the plugin skills.
- Eval suite (`plugins/dev-squad/evals`) for agent routing and resume, run in CI on pull requests.
- Auto version bump on commit (`.githooks/pre-commit`, `scripts/bump-version.mjs`) and this changelog.

### Changed
- Backend stack: .NET latest LTS, EF Core 10 with Oracle `MySql.EntityFrameworkCore` (MariaDB compatibility verified per migration); detection of versions and commands from the code.
- Frontend stack: Angular latest stable, memory-leak and reusability rules.
- Stack conventions moved from per-project files to plugin skills; `ProjectInfo/conventions-*.md` are optional overrides.
- Models pinned: seniors and designer `claude-opus-5-5`, juniors and QA `claude-sonnet-5-5`.
- Wider permissions in the settings snippet (migrations, `dotnet run`, Playwright, scoped QA database commands).

## [0.1.0] - 2026-11-13

### Added
- Six agents: backend/frontend junior, senior/tech lead, QA. Orchestration via `SessionStart` hook and `ProjectInfo/tasks` files.
- `dotnet-mariadb-stack` and `angular-stack` skills, `init-projectinfo` skill, ProjectInfo templates.
