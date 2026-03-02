# Development Guidelines

## Branching

Always work on a feature branch — never commit directly to `main`.

1. Create a branch before making any changes: `git checkout -b <descriptive-branch-name>`
2. Commit work to the feature branch.
3. Push the branch and open a pull request to merge into `main`.

## Test Driven Development

Follow the red-green-refactor cycle for all new features and bug fixes:

1. **Red** — write a failing Gherkin scenario (and step definitions) that describes the desired behaviour. Run `npm test` and confirm it fails.
2. **Green** — write the minimum application code in `src/` needed to make the scenario pass. Run `npm test` and confirm it passes.
3. **Refactor** — clean up the implementation if needed. Run `npm test` again to confirm everything still passes.

Never write application code in `src/` before there is a failing test that requires it.

## Running Tests

Whenever you make a change to any application code in `src/`, run the automated acceptance
tests to ensure existing features are not broken:

```bash
npm test
```

All scenarios must pass before committing.
