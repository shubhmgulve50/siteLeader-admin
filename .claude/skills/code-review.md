# Skill: code-review

Use when asked to review a PR or code diff.

## Output structure

### 1. Summary
Plain English: what feature or fix was introduced, which modules were affected.

### 2. Changes breakdown
List each changed file, one line per file describing what changed.

### 3. Risk analysis
For each risky snippet, output:
```
⚠ Risk XX% — <file>:<line>
Reason: <why this is risky>
Suggestion: <how to reduce risk>
```

**Risk scoring guide:**
| Risk % | Meaning |
|---|---|
| 0–20% | Low — minor style or naming deviation |
| 21–40% | Moderate — missing edge-case handling, pattern slightly off |
| 41–60% | Notable — missing error handling, untested path, perf concern |
| 61–80% | High — deviates significantly from existing patterns, likely to break |
| 81–100% | Critical — security surface, data loss risk, or guaranteed regression |

**What to look for:**
- Missing `try/catch` or error propagation in async code
- Hardcoded values that should be config
- N+1 query patterns
- Missing input validation
- Mutating shared state without guards
- New package introduced without justification
- Pattern inconsistency with existing implementation (e.g. different HTTP client, different date lib)
- Missing or stale README update

### 4. Style consistency
Note any deviations from the existing codebase style (naming, file structure, abstraction level).

### 5. Documentation status
List which flow-specific documentation files in the `readme/` directory were updated and which (if any) were missed. Check that no `README.md` files were added to inner folders.

### 6. Reviewer note
End with: "This is a summary for reviewer reference. No changes have been approved or rejected."
