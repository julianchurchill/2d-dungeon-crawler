# Development Guidelines

## Branching

Always work on a feature branch — never commit directly to `main`.

1. Create a branch before making any changes: `git checkout -b <descriptive-branch-name>`
2. Commit work to the feature branch.
3. Push the branch and open a pull request to merge into `main`.
4. Before adding more code to an existing branch, check whether its PR has already been merged (`gh pr view <branch>`). If it has, create a new branch from `main` for the next change.

## Test Driven Development

Follow the red-green-refactor cycle for all new features and bug fixes:

1. **Red** — write a failing Gherkin scenario (and step definitions) that describes the desired behaviour. Run `npm test` and confirm it fails.
2. **Green** — write the minimum application code in `src/` needed to make the scenario pass. Run `npm test` and confirm it passes.
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
