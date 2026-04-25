# Skill: new-feature

Use this skill whenever a new feature is requested.

## Steps

1. **Read RULES.md** — `cat .claude/RULES.md`
2. **Check for branch conflicts**
   ```
   git branch -a | grep feature/<name>
   ```
   If exists, use `feature/<name>-2` (increment until unique).
3. **Create branch from dev**
   ```
   git checkout dev
   git pull origin dev
   git checkout -b feature/<name>
   ```
4. **Scaffold files** per the framework structure in the project's `CLAUDE.md`.
5. **Update flow documentation in `readme/` directory**:
   - Update `readme/FLOWS.md` with the new feature's end-to-end logic.
   - If the feature introduces new UI patterns or utility methods, update `readme/UI.md` or `readme/METHODS.md`.
   - If the feature is a major standalone flow, create a new flow-specific document in the `readme/` directory.
   - Documentation should focus on:
     - `## Purpose` — what this flow does
     - `## Steps` — sequence of operations
     - `## Data Pathways` — how data flows through the system
     - `## Dependencies` — major packages or internal modules used
6. **Register any new flow README** in `CLAUDE.md` under the README registry table.
7. **No per-directory or per-module READMEs**: do not create `README.md` files in the new feature's subdirectories or for individual modules.
8. **Report back**: branch name, files created, flow documentation updated.
