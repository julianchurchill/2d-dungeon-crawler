# Changelog

All notable changes to this project will be documented here.
Entries are listed newest-first within each section.

---

## [Unreleased]

### Added

- 2026-03-07 — Dev options button is hidden in production builds; visible only during local development
- 2026-03-07 — Golden screen flash and "LEVEL UP!" banner when the player levels up
- 2026-03-07 — Developer options screen: configure start floor, level, and inventory from the main menu
- 2026-03-05 — SHIFT+direction runs the player until an obstacle or visible enemy/item stops them
- 2026-03-05 — On-screen D-pad is shown only on touch-capable devices

---

## [0.4.0] - 2026-03-04

### Added

- 2026-03-04 — `prepare-release` script renames `[Unreleased]` to the current version in CHANGELOG.md before a deployment

---

## [0.3.0] - 2026-03-04

### Added

- 2026-03-04 — CI workflow runs the test suite automatically on every pull request targeting `main`
- 2026-03-04 — GitHub Actions workflow deploys built application to GitHub Pages on push to `release` branch
- 2026-03-04 — Version number (semver + git commit hash + build date/time) displayed on the main menu
- 2026-03-03 — Inventory panel now supports arrow key and WASD navigation; Enter key equips or uses the highlighted item
- 2026-03-03 — Vite HMR now works in WSL2 devcontainers via usePolling config
- 2026-03-03 — Hold-key auto-repeat interval decoupled from animation cycle (~150 ms total: 80 ms animation + 70 ms delay)
- 2026-03-03 — Holding a movement key now continues moving each turn until the key is released
- 2026-03-02 — Port 3000 forwarded automatically in devcontainer; Vite dev server binds to all interfaces via --host flag
- 2026-03-02 — Guideline added: CHANGELOG.md must be updated with every new feature or bug fix
- 2026-03-02 — CHANGELOG.md introduced to track feature changes and bug fixes

### Changed

- 2026-03-04 — Build info (git hash, date, version) now written to src/build-info.js by a pre-build script; vite.config.js no longer calls git directly

### Fixed

- 2026-03-03 — Fixed "Illegal invocation" error in HoldRepeatScheduler caused by storing setTimeout without its window context
- 2026-03-03 — Fixed hold-key movement: the move animation (80 ms) provides the natural tap-prevention window, so auto-repeat now works correctly when a key is held
- 2026-03-02 — Inventory panel now updates the equipped weapon/armor name immediately when an item is equipped while the panel is open
