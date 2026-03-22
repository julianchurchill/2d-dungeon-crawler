# Changelog

All notable changes to this project will be documented here.
Entries are listed newest-first within each section.

---

## [Unreleased]

### Fixed

- 2026-03-22 — Movement no longer continues after dismissing the SkillLevelUpScene; held direction and run state are cleared before the scene sleeps

### Changed

- 2026-03-22 — SkillSystem constructor now accepts injected skill instances; GameScene owns the specific skill classes (Dependency Inversion)
- 2026-03-22 — applyOnDefendSkills returns an `affected` flag; CombatSystem uses it to bypass takeDamage without knowing Dodge-specific semantics
- 2026-03-22 — Mobile D-pad centre button is now a ··· toggle that reveals INV and K sub-buttons; tapping either fires the action and collapses the sub-menu
- 2026-03-22 — Run movement no longer stops for items already visible when the run started; only new items (not visible at run-start) interrupt the run
- 2026-03-22 — SkillsPanel reads dev mode directly via isDevEnvironment() instead of receiving it in the OPEN_SKILLS event payload
- 2026-03-22 — Extract Lucky Strike skill logic into LuckyStrikeSkill class; SkillSystem is now fully generic with no skill-specific branches
- 2026-03-22 — Reorder CombatSystem messages so skill trigger messages appear before the combat outcome message
- 2026-03-22 — Refactor CombatSystem to return a single messages array instead of separate message and skillMessages; add colour descriptions to DPad colour constants
- 2026-03-22 — Refactor TurnManager to use a single setState(state) method; refactor InventoryToggle and SkillsToggle to accept turnManager directly; read skillSystem from attacker in CombatSystem; replace magic colour numbers in DPad with named constants

### Added

- 2026-03-22 — Keyboard navigation in menus: UP/DOWN (or W/S) to move focus, ENTER/SPACE to select — added to MainMenuScene, InGameMenuScene, DevMenuScene, and SkillLevelUpScene
- 2026-03-22 — Add Ferocity and Dodge inactive skills; add SkillLevelUpScene shown on level-up for skill activation/upgrade choices; add ACTIVATE_SKILL event and dev-mode activate button in SkillsPanel; Dodge defence integration in CombatSystem skips takeDamage on successful dodge
- 2026-03-22 — Add DEV OPTIONS screen (dev mode only) accessible from the in-game ESC menu with toggles for enemy invincibility and player invincibility; invincible defenders take zero damage and cannot be killed
- 2026-03-22 — Fix SkillsPanel layout: wider panel, word-wrapped description text, separated upgrade/downgrade buttons; add red ⬇ downgrade button and SkillSystem.downgradeSkill/canDowngrade
- 2026-03-22 — Add dev-mode skill upgrades: SkillSystem.upgradeSkill/canUpgrade/getInactiveSkills, UPGRADE_SKILL event, and per-skill upgrade buttons in the skills panel when running in dev mode
- 2026-03-22 — Add Lucky Strike character skill: SkillSystem with 1% crit chance for 50% bonus damage, viewable via K key or mobile button, with combat integration and SkillsToggle turn-state gate
- 2026-03-22 — Improve EnemySpawner.js mutation score from 38% to 100%: add scenarios for floor-default max, explicit min, exact spawn coordinates, and occupied-tile skipping
- 2026-03-21 — Improve TurnManager.js mutation score from 68% to 100%: fix turn-state step to compare against the raw string value rather than via TURN_STATE lookup
- 2026-03-21 — Add sox and pulseaudio-utils to devcontainer so Claude Code can play an audio bell via the Stop hook
- 2026-03-21 — Improve HeldMovementTracker.js mutation score from 61% to 100%: extend held-movement feature to cover all arrow keys, WASD aliases, open-inventory event, and D-pad hold events
- 2026-03-21 — Improve RNG.js mutation score from 31% to 100%: add rng feature covering next(), nextInt(), nextBool(), and pick() with known-seed assertions
- 2026-03-21 — Improve Enemy.js mutation score from 10% to 94%: add enemy behaviour feature covering construction, isDead, takeDamage, takeTurn (attack, aggro, wander), and _moveToward
- 2026-03-21 — Enable Stryker incremental mode to speed up repeated mutation test runs
- 2026-03-20 — Simplify Stryker dashboard version to branch name only (was branch+git-hash)
- 2026-03-20 — Configure Stryker dashboard reporter with html, json, clear-text, progress, and dashboard reporters; version set to branch+git-hash
- 2026-03-20 — Allow dashboard.stryker-mutator.io through the dev container firewall
- 2026-03-20 — Allow stryker-mutator.io through the dev container firewall
- 2026-03-20 — Improve Direction mutation score: add feature covering DIR string values and all four DIR_DELTA dx/dy entries
- 2026-03-20 — Improve CombatSystem mutation score: add scenarios covering exact damage for known RNG seed, message verb/name correctness for hits and kills (player and enemy), and message punctuation
- 2026-03-19 — Stryker mutation testing: `npm run mutate` runs StrykerJS against all pure-JS source files (42 files, ~2017 mutants), excluding Phaser scene files

---

## [0.10.0] - 2026-03-15

### Changed

- 2026-03-15 — Consistent BACK button style across Achievements, Help, and Dev Options screens: plain text, pinned footer strip, hover highlight

### Added

- 2026-03-15 — Back navigation from Achievements and Help now returns to the in-game menu rather than directly to the game
- 2026-03-15 — In-game menu (ESC / ≡ button): now shows a MENU screen with Achievements and Help options instead of going directly to Achievements
- 2026-03-15 — New Help screen shows device-appropriate control instructions (touch: tap/double-tap/hold; keyboard: arrow keys/WASD/SHIFT/I/ESC)
- 2026-03-15 — Inventory panel: added ✕ close button on touch devices; header hides keyboard hints (`[I] close`) on touch where they are irrelevant

### Fixed

- 2026-03-15 — Direction buttons no longer become unresponsive after opening the inventory during a run; `applyInventoryToggle` now guards the state transition so the panel and TurnManager state can never diverge
- 2026-03-15 — `wrapWithRunCancel` moved to `src/utils/ActionWrapper.js` and applied to all keyboard handlers (arrows, WASD, I, `.`, ESC) as well as d-pad buttons
- 2026-03-15 — Mobile d-pad buttons (direction, INV, stairs) now cancel an active run before executing, mirroring keyboard behaviour

- 2026-03-15 — Mobile D-pad rework: controls moved up to clear the message log strip; INV button placed at the d-pad centre; new ≡ menu button opens Achievements (or closes the message log if it is open), mirroring ESC on keyboard
- 2026-03-15 — Message log panel: added ✕ close button visible on all platforms; header hides the "ESC to close" hint on touch devices where ESC is unavailable
- 2026-03-15 — Mobile D-pad hold-to-repeat: holding a direction button auto-repeats movement each turn (same as holding a keyboard key)
- 2026-03-15 — Mobile D-pad double-tap to run: double-tapping a direction button starts a run until blocked or an entity is visible (same as SHIFT+direction on keyboard)
- 2026-03-08 — Dev mode achievement toggle: `[ ]`/`[x]` checkboxes on the achievements screen let developers force-complete or reset any achievement; hidden in production builds

---

## [0.9.2] - 2026-03-08

### Added

- 2026-03-08 — Message log history: click the message area to expand a scrollable 15-line history panel; mouse wheel scrolls through older messages; ESC closes the panel
- 2026-03-08 — Achievements screen: viewable from the main menu and via ESCAPE during play; shows all achievements with completion state and progress
- 2026-03-08 — Dev options: spawn table weights per enemy type and min/max enemies per room, configurable before game start
- 2026-03-08 — Rename kill achievements to consistent "Killer" pattern: Orc Killer, Troll Killer
- 2026-03-08 — Rename kill achievements to consistent {enemy} Killer pattern: Orc Killer, Troll Killer
- 2026-03-08 — Add 21 additional achievements: Orc Killer, Troll Killer (kill 10 of each), floor milestones every 10 floors up to 100, and level milestones every 10 levels up to 100
- 2026-03-08 — Achievement system: Goblin Killer (kill 10 goblins) and Burrower (reach floor 10) with progress tracking, banners, and message log notifications

### Fixed

- 2026-03-08 — Dev options start floor and start level not reflected in HUD on game start; UIScene now eagerly reads initial registry values via `syncHudFromRegistry` so dev-option overrides display correctly from the first frame

### Changed

- 2026-03-07 — Centralise EventBus event names into `src/events/GameEvents.js` constants

---

## [0.7.3] - 2026-03-07

### Added

- 2026-03-07 — Main menu controls list now includes SHIFT+Direction run movement
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
