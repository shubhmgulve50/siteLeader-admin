# Skill: pr-workflow

Use when asked to create a PR.

## Steps

1. **Confirm current branch** is a feature branch (not `dev` or `main`).
2. **Collect changes**
   ```
   git log dev..HEAD --oneline
   git diff dev --stat
   ```
3. **Draft PR title**
   Format: `[TYPE] Short description`
   Types: feat | fix | refactor | docs | chore | test
4. **Draft PR body** using this template:
   ```markdown
   ## Summary
   <!-- What changed and why -->

   ## Changes
   - `path/to/file` — what changed
   - `path/to/file` — what changed

   ## Testing
   <!-- How to verify -->

   ## Related
   <!-- Closes #N or Relates to #N if applicable -->
   ```
5. **Check README sync** — confirm all affected flow-specific READMEs in the `readme/` directory were updated.
6. **Output the full PR body** for human confirmation.
7. **Create the PR** targeting `dev` only after confirmation.
8. **Do not merge.** Leave open for reviewer.
9. **Do not delete the branch** after PR creation.
