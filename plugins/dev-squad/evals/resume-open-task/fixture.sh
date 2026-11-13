#!/usr/bin/env bash
set -e
mkdir -p ProjectInfo/tasks
cat > ProjectInfo/project.md <<'MD'
# Project: Notes
A small notes app. Signed-in users keep private notes (title max 100, body max 2000). A user only sees their own notes; another user's note returns 404. List newest first, 10 per page.
MD
cat > ProjectInfo/architecture.md <<'MD'
# Architecture
backend/ (.NET 10, API -> Application -> Infrastructure -> Domain, EF Core + MariaDB) and frontend/ (Angular, features/notes).
MD
git init -q . 2>/dev/null || true
cat > ProjectInfo/tasks/T-004-delete-note-endpoint.md <<'MD'
# T-004 — Delete note endpoint

- **Status:** in-progress
- **Area:** backend
- **Pattern-setting:** no
- **UI:** no
- **Depends on:** none
- **Example to mirror:** none yet

## Scope
Delete note endpoint.

## Acceptance criteria
1. Works for the owner.
2. Negative: another user's note returns 404.

## Implementation
### Progress
- [x] Created files
- Next: run tests
MD
