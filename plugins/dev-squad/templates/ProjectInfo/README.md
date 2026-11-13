# ProjectInfo

Everything the `dev-squad` agents need to know about THIS project. Every agent reads all `*.md` files in this folder before acting. Keep them short, concrete and current; these files override the agents' defaults.

| File | Purpose |
|---|---|
| `project.md` | Product, audiences/roles, business rules, open decisions |
| `architecture.md` | Solution layout, layers, key decisions, data model overview |
| `design.md` | Design direction (tokens, density, shell, screens); `Status: approved` before any UI is built |
| `MILESTONES.md` | The plan: milestones -> items -> task ids, plus the backlog |
| `LESSONS.md` | Mistakes already made, one rule each (maintained by the seniors) |
| `tasks/` | One file per task; the agents' communication channel |

Add any other `.md` you want the team to know (glossary, API standards, decisions log...).

## Other project documents
Longer documents that live elsewhere in the repo (API reference, database, ADRs, release notes...). Agents read them when a task touches their subject, and tasks list the ones they must keep current under `Docs to update`.

| Document | Read when |
|---|---|
| <docs/API.md> | <a task adds or changes an endpoint> |

## Stack conventions are in the plugin
Backend (.NET + MariaDB) and frontend (Angular) conventions, commands and checklists ship with the plugin as skills (`dev-squad:dotnet-mariadb-stack`, `dev-squad:angular-stack`). Agents detect versions and build/test commands from the code (`.csproj`, `package.json`). Only add `conventions-backend.md` / `conventions-frontend.md` here to **override** a default (see `templates/optional/` in the plugin).
