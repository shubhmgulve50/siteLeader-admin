# AGENTS.md — Claude Agent Registry

This file defines the agents (sub-Claude instances) available in this project.
Claude Code will delegate to the appropriate agent based on the task.

---

## adaptation-agent

**Purpose:** Aligns configuration files with the existing project structure upon initial copy.

**Trigger:** When these files are first copied into a new repository or project.

**Instructions:**
1. Read the actual project directory to audit the real file structure.
2. Ensure `.claudeignore` exists at the root and contains the same ignore rules as `.gitignore`.
3. Read `PROJECT_STRUCTURE.md` at the project root and use it to verify the audited structure against the actual file tree.
4. Run version check commands (`node -v`, `npm -v`, etc.) and update the "Framework Versions" sections in the target project's structure file.
5. Align the `README registry` in `CLAUDE.md` to point to the correct file paths.
6. Verify that all triggers and branch names (e.g., `main` vs `master`) in `AGENTS.md` match the target project.
7. Report the changes made to align the documentation with the reality of the project.

---

## readme-sync-agent

**Purpose:** Keeps flow-specific and pattern documentation in sync with code changes.

**Trigger:** Any code change in a tracked directory, including dependency updates.

**Instructions:**
1. Read the changed file(s).
2. Read the relevant flow-specific README in the `readme/` directory (e.g., `readme/FLOWS.md` for logic) and the relevant `PROJECT_STRUCTURE.md`.
3. Identify what is now outdated or missing in the flows or patterns.
4. Update the relevant documentation in `readme/` — add new steps to flows, update UI patterns, or update utility references in `METHODS.md`.
5. **Sync Ignore Files:** If `.gitignore` is modified, ensure `.claudeignore` is updated to match.
6. **Version Sync:** If a dependency version changes in `package.json` (e.g., due to a fix or update), also update the version in the corresponding `PROJECT_STRUCTURE.md`.
7. If an end-to-end flow changed, also update `readme/FLOWS.md`.
8. Report which files were updated.

---

## package-manager-agent

**Purpose:** Manages dependency installation and vulnerability scanning.

**Trigger:** When told to "run npm install" or "npm i".

**Instructions:**
1. Run `npm install`.
2. **Vulnerability Handling:**
   - If vulnerabilities are reported:
     - Provide a summary of each vulnerability.
     - Suggest specific fixes (e.g., version upgrades).
     - Ask the user for permission to fix them automatically.
     - ONLY apply fixes if the user gives explicit permission.
3. **Version Sync:** If any versions in `package.json` are changed during a fix, trigger `readme-sync-agent` to update the versions in the relevant `PROJECT_STRUCTURE.md` file.

---

## feature-scaffold-agent

**Purpose:** Scaffolds new feature directories, files, and updates flow documentation.

**Trigger:** When told "create a new feature called X".

**Instructions:**
1. Create the feature branch from `dev` following `.claude/RULES.md §3`.
2. Create the directory structure per the project's framework conventions.
3. Update the relevant flow documentation in the `readme/` directory (primarily `readme/FLOWS.md`).
4. Register any new flow-specific documentation paths in `CLAUDE.md`.
5. Report the branch name, files created, and documentation updated.

---

## pr-agent

**Purpose:** Manages PR creation, description, and review summaries.

**Trigger:** When told "create a PR" or "review this PR".

**Instructions for creation:**
1. Collect all commits on the current branch since branching from `dev`.
2. **Pre-commit checks:**
   - Run `npm run lint` and `npm run build` to avoid errors after creating the PR.
   - If an error occurs:
     - Provide a summary of the error and a suggested fix.
     - Ask the user for permission to fix it automatically.
     - ONLY fix the error if the user gives explicit permission.
3. Draft PR title and description per `.claude/RULES.md §3`.
4. Link the related GitHub issue if one was specified.
5. Output the PR body for human confirmation before submitting.
6. Never merge.

**Instructions for review:**
1. Summarise all changes in plain English.
2. Flag risky snippets with `⚠ Risk X%` and reason.
3. Note style deviations and missing flow-specific README updates.

---

## Deployment Information

**Frontend:**
- Framework: Next.js 15
- Platform: AWS Amplify

**Backend:**
- Framework: Node.js (Express 5)
- Platform: AWS Lambda (using `serverless` package)

---

## ticket-agent

**Purpose:** Creates GitHub issues and links them to PRs.

**Trigger:** When told "create a ticket for X" or "link PR to ticket #N".

**Instructions:**
1. Draft issue title and body per `.claude/RULES.md §5`.
2. Output for human confirmation before submitting.
3. When linking: add `Closes #N` or `Relates to #N` to the PR description.

---

## code-review-agent

**Purpose:** Reviews code quality, pattern consistency, and risk.

**Trigger:** When told "review this code" or "review PR #N".

**Instructions:**
1. Summarise what the code does.
2. Check for pattern deviations from the existing codebase.
3. Flag risky snippets with `⚠ Risk X%` and reason.
4. Check for missing tests, missing error handling, hardcoded values.
5. Check for missing flow-specific README updates.
6. Output a structured review report — do not approve or request changes.
