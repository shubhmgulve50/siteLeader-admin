# Skill: ticket

Use when asked to create a GitHub issue or link a PR to a ticket.

## Creating a ticket

Draft using this template and output for confirmation before creating:

```markdown
**Title:** <action-oriented, concise>

**Labels:** bug | enhancement | chore | docs | question

**Body:**

## Context
<!-- Why this ticket exists; background the reviewer needs -->

## Acceptance criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes
<!-- Optional: links, references, implementation hints -->
```

## Linking a PR to a ticket

Add to the PR description under **Related**:
- Use `Closes #N` if this PR fully resolves the ticket (auto-closes on merge).
- Use `Relates to #N` if it partially addresses or is connected to the ticket.

Only link if the user explicitly asks to link.
