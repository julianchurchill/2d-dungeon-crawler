---
description: "Create a pull request for the current branch. TRIGGER when: user says 'make a PR', 'open a PR', 'create a PR', 'submit a PR', 'raise a PR', or 'make a pull request'. Runs the full workflow: changelog, version bump, markdownlint, TODO/EVENTS checks, tests, pre-PR review agent, commit, push, gh pr create."
---

# /pr

Create a pull request for the current branch following the project's full PR workflow.

Steps (in order — do not skip any):

1. **Check branch state** — run `gh pr view $(git branch --show-current)` to confirm the PR does not already exist.

2. **Changelog** — add an entry to `CHANGELOG.md` under the correct heading (`Added`, `Changed`, `Fixed`, or `Removed`) inside `[Unreleased]`, newest first, dated today in `YYYY-MM-DD` format.

3. **Version bump** — bump `version` in `package.json` following semver: PATCH for bug fixes, MINOR for new features, MAJOR for breaking changes.

4. **Markdownlint** — run `npx markdownlint-cli` on every Markdown file that was changed and fix any violations before continuing.

5. **TODO.md** — check whether any items in `TODO.md` relate to this change; if so, mark them `[x]` and move them to the bottom of their section above any already-completed items.

6. **EVENTS.md** — if any EventBus event was added, removed, or modified, update `EVENTS.md` to reflect the change.

7. **Tests** — if any files under `src/` were changed, run `npm test` and confirm all scenarios pass before continuing.

8. **Pre-PR review** — spawn a general-purpose agent with this prompt:

   > Review all changed files for bugs, broken references, and side effects on existing functionality. Do NOT make any changes — research only. Report your findings.

   Fix any issues found before continuing.

9. **Commit** — stage all changed files and commit with a clear message describing the change. End the commit message with:

   ```text
   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```

10. **Push & open PR** — push the branch and run `gh pr create` with a concise title and a body containing a `## Summary` section (bullet points) and a `## Test plan` section (checklist).

Report the PR URL when done.
