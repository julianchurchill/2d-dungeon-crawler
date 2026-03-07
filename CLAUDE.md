# Development Guidelines

## Branching

Always work on a feature branch — never commit directly to `main`.

1. Create a branch before making any changes: `git checkout -b <descriptive-branch-name>`
2. Commit work to the feature branch.
3. Push the branch and open a pull request to merge into `main`.
4. Before adding more code to an existing branch, check whether its PR has already been merged (`gh pr view <branch>`). If it has, create a new branch from `main` for the next change.

## Test Driven Development

Follow the red-green-refactor cycle for all new features and bug fixes:

1. **Red** — write a failing Gherkin scenario and step definitions. Create any necessary stub source files with the correct shape (exported functions/classes that return placeholder values) so the test can actually run and reach its assertion. Run `npm test` and confirm the test fails **on the assertion** (e.g. `expected true but got false`), not on a missing file or undefined symbol. A crash due to missing scaffolding is not a meaningful red.
2. **Green** — replace the stub with the minimum real implementation needed to make the scenario pass. Run `npm test` and confirm it passes.
3. **Refactor** — clean up the implementation if needed. Run `npm test` again to confirm everything still passes.

Never write application code in `src/` before there is a failing test that requires it.

## Code Style

### Comments

Add a JSDoc comment to every function, class, and module explaining its purpose, parameters, and return value. Use inline comments to explain non-obvious logic — the *why*, not the *what*.

### SOLID Design Principles

Write application code that follows SOLID principles:

- **Single Responsibility** — each class or module has one reason to change.
- **Open/Closed** — extend behaviour through new code rather than modifying existing code.
- **Liskov Substitution** — subtypes must be substitutable for their base types without altering correctness.
- **Interface Segregation** — prefer small, focused interfaces over large, general-purpose ones.
- **Dependency Inversion** — depend on abstractions, not concretions; inject dependencies rather than hard-coding them.

## TODO

When completing a task from `TODO.md`, mark it `- [x]` and move it to the **bottom** of its section, but **above** any already-completed `[x]` items there, so the newest completion sits at the top of the completed group.

## Versioning

Bump the `version` field in `package.json` with every PR, following [Semantic Versioning](https://semver.org/):

- **PATCH** (`x.x.X`) — backwards-compatible bug fixes.
- **MINOR** (`x.X.0`) — new backwards-compatible features.
- **MAJOR** (`X.0.0`) — breaking changes.

The version is read by the Vite build and displayed on the main menu automatically — no other changes are needed beyond the `package.json` bump.

## Changelog

Add an entry to `CHANGELOG.md` for every new feature or bug fix before committing. Place it under the appropriate heading (`Added`, `Changed`, `Fixed`, or `Removed`) inside `[Unreleased]`, newest entry first, with the date in `YYYY-MM-DD` format:

```markdown
- 2026-03-02 — Short description of what changed
```

## Releasing

Before merging `main` into `release` to trigger a deployment:

1. Bump `version` in `package.json` (see Versioning below).
2. Run `npm run prepare-release` — this renames the `[Unreleased]` section in
   `CHANGELOG.md` to the current version number and inserts a fresh empty
   `[Unreleased]` section above it.
3. Commit both files, push, and open a PR to `main` as normal.
4. Once merged, deploy by pushing `main` to `release`.

## Event Map

Whenever an EventBus event is added, removed, or modified (in `src/events/GameEvents.js`
or any publisher/subscriber), update `EVENTS.md` to reflect the change.

## Markdown Style

Whenever you change a Markdown file, run markdownlint on it and fix all violations before committing:

```bash
npx markdownlint-cli <file.md>
```

## Running Tests

Whenever you make a change to any application code in `src/`, run the automated acceptance
tests to ensure existing features are not broken:

```bash
npm test
```

All scenarios must pass before committing.
