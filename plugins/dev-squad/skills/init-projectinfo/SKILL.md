---
name: init-projectinfo
description: Scaffold the ProjectInfo/ folder (project, architecture, backend/frontend conventions, LESSONS, tasks/_TEMPLATE.md) in the current project for the dev-squad agents, then help fill it in from the existing codebase. Use when ProjectInfo/ is missing or the user asks to set up the dev squad.
---

# init-projectinfo

1. If `ProjectInfo/` already exists, list what is there and only add missing files. Never overwrite existing files.
2. Copy every file from `${CLAUDE_PLUGIN_ROOT}/templates/ProjectInfo/` (including `tasks/_TEMPLATE.md`) into `ProjectInfo/` at the repository root.
3. Inspect the repo (solution/csproj files, `package.json`, `angular.json`, folder layout, README, CLAUDE.md, existing docs) and pre-fill what can be stated as fact: versions, layout, build/test/lint commands. Leave `<placeholders>` for anything you cannot verify; do not invent business rules.
4. Show the user the list of placeholders still open and ask them to complete `project.md` (business rules, open decisions) before running any agent.
5. Mention `${CLAUDE_PLUGIN_ROOT}/templates/settings.snippet.json` as a starting point for `.claude/settings.json` permissions.
