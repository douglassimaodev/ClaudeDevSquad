---
name: init-projectinfo
description: One-step setup of the dev-squad team in the current project - scaffolds ProjectInfo/ (project, architecture, design, LESSONS, tasks template), merges the dev-squad permissions into .claude/settings.json, checks the QA test-database login, and pre-fills what can be read from the codebase. Use when ProjectInfo/ is missing, or the user asks to set up, install or initialise the dev squad.
---

# init-projectinfo

The plugin root is two folders above this skill's base directory (`<base>/../..`); the templates are in `<plugin root>/templates/`. Run every step and report each result to the user at the end.

1. **ProjectInfo/**
   - If it already exists, list what is there and only add missing files. Never overwrite existing files.
   - Copy every file from `<plugin root>/templates/ProjectInfo/` (including `tasks/_TEMPLATE.md`) into `ProjectInfo/` at the repository root.
   - `design.md` is copied as a draft; `ui-designer` completes it and the user approves it before any UI work.
   - Stack conventions are NOT copied: they live in the plugin skills. Only copy a file from `<plugin root>/templates/optional/` if the user says the project deviates from the default stack.
2. **Settings:** run `node "<base>/merge-settings.mjs" "<repository root>"`. It adds the marketplace, enables `dev-squad`, and adds missing permission rules without removing or changing anything. Show the user what it added. If it warns that `team-workflow` is also enabled, tell the user to disable one of them.
3. **QA test database:** run `node "<base>/check-qa-db.mjs"`. If it fails, show the user the SQL it prints (to run once as root). Setup can finish without it; QA will report `BLOCKED` on database checks until it is fixed.
4. **Pre-fill:** inspect the repo (solution/csproj files, `package.json`, `angular.json`, folder layout, README, CLAUDE.md, existing docs) and fill `architecture.md` (layout, layers, data) with what can be stated as fact. Leave `<placeholders>` for anything you cannot verify; do not invent business rules.
5. **Existing plan and history (migration):** if the project already has a plan or workflow documents (e.g. `docs/MILESTONES.md`, `PROGRESS.md`, `LESSONS.md`, `project-description.md`, another workflow plugin such as `team-workflow`), propose a migration and do it only after the user agrees:
   - Plan -> `ProjectInfo/MILESTONES.md`: finished milestones as one line each (goal + "done"), the active and future milestones with every item kept, open decisions and follow-ups -> `Backlog`. Keep the original as an archive (`docs/archive/`), never delete history.
   - Work in flight -> one task file per unfinished item that already has code, with the real status (`in-progress`, `in-review`...) and a `Progress` section written from `git status` and the old progress notes, so the resume step picks it up.
   - Lessons -> `ProjectInfo/LESSONS.md` (keep the wording; add `Scope`).
   - Project description -> `ProjectInfo/project.md`; drop the old plugin's workflow sections (roles, profiles).
   - Decisions log -> `ProjectInfo/decisions.md`. Long reference docs (API, database, ADRs) stay where they are and are listed in `ProjectInfo/README.md` under *Other project documents*.
   - Settings: disable the old workflow plugin in `.claude/settings.json` and update `CLAUDE.md` to point at `ProjectInfo/`.
6. **Report:** list what was created, the settings added, the QA database result, and the placeholders still open. Ask the user to complete `project.md` (business rules, open decisions) before running any agent, and to restart Claude Code if the settings changed so the plugin and permissions load.
