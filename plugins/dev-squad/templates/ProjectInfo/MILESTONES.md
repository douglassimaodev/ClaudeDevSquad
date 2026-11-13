# Milestones

The plan of the project: **milestone -> item -> tasks**.

- **Milestone** (`M<n>`): a shippable step with one goal, e.g. "M3 — Bookings". Exactly one milestone is `active` at a time.
- **Item** (`M<n>.<k>`): one feature or story inside the milestone, e.g. "M3.2 — Checkout". The user or a senior writes it here first, as a one-line scope.
- **Tasks** (`T-NNN`): the senior plans an item into one or more task files in `tasks/` (one concern each, backend and frontend separate) and writes their ids next to the item. Tasks are the units the team implements, reviews and QAs.

Markers: `[ ]` not started · `[~]` planned / in progress · `[x]` all its tasks `done` · `[!]` blocked (reason in the task file).

Who edits this file: seniors (plan items into tasks, add items they discover), the orchestrator (ticks items and milestones when their tasks are `done`), the user (adds milestones and items, reorders, decides). Agents never delete an item; they mark it `dropped` with the reason.

Every milestone ends with a **quality gate** item `M<n>.QG`: full build and test suite green, docs and release notes updated, security and ownership reviewed. The senior plans it as a normal task once all other items are `[x]`.

---

## M1 — <name>
- **Status:** active   <!-- planned | active | done -->
- **Goal:** <one sentence: what is true when this milestone is done>

- [ ] **M1.1 — <item>.** <one-line scope; acceptance hints> -> <T-001, T-002 once planned>
- [ ] **M1.QG — Quality gate.**

## M2 — <name>
- **Status:** planned
- **Goal:** <...>

- [ ] **M2.1 — <item>.**
- [ ] **M2.QG — Quality gate.**

---

## Backlog

Follow-ups and ideas not yet placed in a milestone (one line each, with where it came from).

- <item> (from T-NNN review)
