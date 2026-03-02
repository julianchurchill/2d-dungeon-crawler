# Development Guidelines

## Branching

Always work on a feature branch — never commit directly to `main`.

1. Create a branch before making any changes: `git checkout -b <descriptive-branch-name>`
2. Commit work to the feature branch.
3. Push the branch and open a pull request to merge into `main`.

## Running Tests

Whenever you make a change to any application code in `src/`, run the automated acceptance
tests to ensure existing features are not broken:

```bash
npm test
```

All scenarios must pass before committing.
