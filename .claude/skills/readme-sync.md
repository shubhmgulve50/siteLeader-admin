# Skill: readme-sync

Use after any code change to ensure READMEs are in sync.

## Checklist

- [ ] Read the relevant flow-specific README in the `readme/` directory for every flow that was changed (e.g., `readme/FLOWS.md` for logic).
- [ ] For each documentation file in `readme/`, check:
  - Does the **Flow** section reflect the current data pathways?
  - Does the **Methods / Exports** section in `METHODS.md` reflect current shared helpers?
  - Are new **Dependencies** documented in the appropriate flow or method doc?
  - Are stale steps or logic removed from the documentation?
- [ ] If an end-to-end feature flow changed → update `readme/FLOWS.md`.
- [ ] If theme tokens or UI patterns changed → update `readme/THEMING.md` and `readme/UI.md`.
- [ ] If a new feature or flow was created → update `readme/FLOWS.md` or create its specific doc in `readme/` and register it in `CLAUDE.md`.
- [ ] Update the *Last updated* line in every document that was touched.

## Flow README template (for `readme/` directory)

```markdown
# <Flow name>

## Purpose
<!-- What this flow/process is responsible for -->

## Steps
<!-- Sequence of operations and logic -->

## Data Pathways
<!-- How data enters and exits this flow -->

## Dependencies
<!-- Major packages or modules this flow relies on -->

## Notes
<!-- Edge cases, known limitations, gotchas -->

---
*Last updated: YYYY-MM-DD*
```
### Rule: No per-directory or per-module READMEs
Never create `README.md` files in inner folders or for individual modules. All documentation must stay in the root `readme/` directory and focus on flows and patterns.
