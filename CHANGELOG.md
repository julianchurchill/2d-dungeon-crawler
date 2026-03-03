# Changelog

All notable changes to this project will be documented here.
Entries are listed newest-first within each section.

---

## [Unreleased]

### Added

- 2026-03-03 — Holding a movement key now continues moving each turn until the key is released
- 2026-03-02 — Port 3000 forwarded automatically in devcontainer; Vite dev server binds to all interfaces via --host flag
- 2026-03-02 — Guideline added: CHANGELOG.md must be updated with every new feature or bug fix
- 2026-03-02 — CHANGELOG.md introduced to track feature changes and bug fixes

### Fixed

- 2026-03-03 — Brief key taps no longer trigger unintended extra movement; a hold threshold (150 ms) must elapse before a direction is considered held for auto-repeat
- 2026-03-02 — Inventory panel now updates the equipped weapon/armor name immediately when an item is equipped while the panel is open
