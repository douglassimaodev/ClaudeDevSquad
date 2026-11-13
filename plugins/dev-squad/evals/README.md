# dev-squad evals

Checks that natural requests start the right agent, that juniors are not started for planning/design work, and that a new session resumes open tasks.

Run from `plugins/dev-squad` (scaffold scripts create a small ProjectInfo/ in each run's empty workspace):

```
claude plugin eval . --scaffold --runs 2 --max-cost-usd 10
claude plugin eval . --scaffold --tag routing --ablation none   # cheaper, while iterating
```

The `tool_used: Agent` graders count the dispatch only; agents may not finish their work within the case's turn limit, which is fine. Re-run after editing any agent `description` or `workflow/ORCHESTRATION.md`. Results go to `evals/results/` (git-ignored).
