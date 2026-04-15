# Changelog

All notable changes to this project will be documented here.
Entries are listed newest-first within each section.

---

## [Unreleased]

### Added

- 2026-04-15 — **Look**: clicking or touching any visible map cell shows a popup in the bottom-right corner describing what is there — enemy name and current/max HP, item name and description, or the tile name (Stone Floor, Stone Wall, Door, etc.). Only cells within the player's line of sight can be inspected. Looking does not advance the game turn.

---

## [0.39.0] - 2026-04-14

### Changed

- 2026-04-14 — The player's home in the town is now a multi-tile structure: a 5-tile-wide alcove against the south border wall with a roof interior and walls on three sides, matching the shop alcove aesthetic. The home door is centred on the north face at (16, 16), placing the Guard NPC naturally in front of the entrance.
- 2026-04-14 — Item icons in the inventory, shop, and display case panels now use tileset-prefixed sprite textures instead of fixed emoji characters. Classic, Modern, and HD tilesets each show their own distinct icon art for potions, weapons, and armour.
- 2026-04-09 — Combined BuyPanel and SellPanel into a single ShopPanel: player-owned sellable items appear at the top, shop stock for purchase below, and the player's gold balance is always visible in the panel header; UP/DOWN navigate all rows, ENTER buys or sells depending on which section is highlighted

### Fixed

- 2026-04-14 — Display case panel now opens centred on screen (both horizontally and vertically) matching the shop panel behaviour; previously it was pinned to y=40 near the top.
- 2026-04-14 — Help screen now lists `k` (keyboard) and SKILLS button (touch) for opening the skills panel; previously the skills control was missing from both device variants.
- 2026-04-14 — Main menu Controls section removed; a HELP button now opens the same Help screen available in-game, keeping controls documented in one place.
- 2026-04-14 — Dev options Bosses section: "Total per level" subtitle no longer overlaps the boss quantity buttons; spacing increased and word-wrap added so long text stays within the panel.
- 2026-04-14 — Options screen layout: removed overlapping subtitle text and `✓ ACTIVE` badge; preview rows, label, and description are now evenly spaced within each tileset card with no overlap.
- 2026-04-14 — HD is now the default tileset for new players (no stored preference); Classic and Modern remain selectable in Options.

- 2026-04-13 — Restarting after death no longer crashes with `Cannot read properties of null (reading 'setSize')`: UIScene now removes its registry `changedata-*` listeners on shutdown, preventing stale callbacks from firing against destroyed HUD game objects on the next run.
- 2026-04-13 — Equipping a weapon or armor now correctly updates the ATK/DEF values shown in the HUD; previously the display always showed base stats, ignoring equipment bonuses.
- 2026-04-11 — NPC roaming crash: `this.rng` is an object, not a function — fixed to call `this.rng.next()` instead of `this.rng()`

### Added

- 2026-04-14 — **Difficulty tuning + Brutal tier**: Easy is now baseline (count ×1.0, HP/ATK ×1.0). Normal: count ×2.0, HP/ATK ×1.75. Hard: count ×2.5, HP/ATK ×2.0. New **Brutal** tier: count ×3.0, HP/ATK ×3.0. Bosses remain unaffected by all difficulty scaling.
- 2026-04-14 — **Difficulty setting**: a new DIFFICULTY section in the Options screen lets players choose Easy, Normal, Hard, or Brutal before starting a game. The choice persists across sessions via localStorage. Bosses are unaffected by difficulty scaling.
- 2026-04-14 — Every dungeon floor now has up-stairs placed in the start room (one tile offset from the player spawn). Floors 2+ lead back to the previous floor; floor 1 continues to lead back to town.
- 2026-04-14 — **HD tileset (32×32)**: a new HD option in the Options screen renders all dungeon tiles, entity sprites, and item icons at 32×32 pixels with rich pixel-art detail (stone slab floors, bevelled brick walls, panelled doors, multi-step staircases, fully-detailed character and creature sprites, illustrated item icons). Camera zoom is automatically set to 1× so HD tiles fill the same screen space as 16×16 tiles at 2×. The choice persists across sessions.
- 2026-04-13 — **Options menu & tilesets**: a new Options screen is accessible from the main menu. Players can switch between the **Classic** tileset (dark minimal palette, original look) and the **Modern** tileset (high-contrast slate-brick dungeon with vivid step colours and defined cobblestone town tiles). The choice persists across sessions via localStorage.
- 2026-04-13 — **Player's Home & Display Case**: the Town now contains a home (golden door tile, south-east area). Unique items (Bone Blade, Skeleton Shield) cannot be sold at shops; instead they can be stored in the display case inside the home and retrieved later. Keyboard (UP/DOWN/ENTER) and mouse/touch navigation supported.
- 2026-04-12 — Dev options: new **BOSSES** section with per-boss total-quantity controls (separate from the spawn-table weights). Setting a boss count to N places exactly N of that boss on the level, bypassing normal floor-range and achievement gates. Boss types are also now excluded from the SPAWN TABLE section.
- 2026-04-12 — Boss: **Old Bones** — a unique undead boss appearing randomly on floors 10–15 (once per game). On first hit it summons 0–2 skeleton minions. Defeating it grants 25 gold, drops either the **Bone Blade** (+7 Attack) or the **Skeleton Shield** (+5 Defense), and unlocks the **Bone Breaker** achievement.
- 2026-04-12 — New enemy: **Skeleton** — frail undead minion summoned by Old Bones; does not appear in the regular spawn table.
- 2026-04-12 — Unique items: **Bone Blade** (weapon, +7 Attack) and **Skeleton Shield** (armor, +5 Defense) — exclusive drops from the Old Bones boss.
- 2026-04-12 — Achievement: **Bone Breaker** (`old_bones_slayer`) — awarded for defeating Old Bones.
- 2026-04-12 — Achievement: **Mass Slayer** — kill 10 Creeping Masses to permanently unlock the **Creeping Mass Hunting** skill (+10% damage against Creeping Masses)
- 2026-04-12 — Creeping Mass is now solitary — at most one may spawn per room (the `solitary` flag is enforced by the EnemySpawner)
- 2026-04-12 — New enemy: **Creeping Mass** — a multi-tile amorphous creature appearing from floor 10. It has 3–5 connected segments (each occupying one tile) and moves by removing a tail segment and re-placing it adjacent to the body. HP is proportional to segment count; segments are lost as the mass takes damage, keeping the body connected at all times.
- 2026-04-11 — Floor 1 now contains up-stairs (pale blue `<`) leading back to the town; using them returns the player to the dungeon staircase in the town square
- 2026-04-11 — NPC dialogue is now partially contextual: with a 40% chance per interaction the NPC picks a line that reacts to the player's current state (equipped weapon/armour, level, gold, inventory); falls back to the normal cycling lines otherwise

- 2026-04-10 — Town NPCs roam slowly around town: each NPC takes a random step every 3 player turns, staying clear of walls and other entities; each NPC (Elder, Guard, Merchant) has a distinctive procedurally-generated sprite
- 2026-04-10 — Town NPCs: three characters (Elder, Guard, Merchant) stand in the town square; bumping into one opens a dialogue panel showing their name and a cycling line of conversation; dismissed with ENTER, ESC, or the ✕ button
- 2026-04-10 — Sold items are added back to the shop's buy stock at 10% above their sell price (rounded up), so the player can buy back anything they sold during the same visit
- 2026-04-09 — Town shops now sell items: each shop generates a stock of items with randomly generated stats; weapons and armour have random bonus values within a tier-appropriate range with a small chance of a rare high-stat item; potions are always available at fixed quantities
- 2026-04-09 — ShopSystem.buy() validates purchase (sufficient gold, inventory space), deducts gold, and adds the item to the player's inventory
- 2026-04-09 — Purchased items are removed from the shop's persistent stock for the remainder of the run

---

## [0.21.0] - 2026-03-28

### Changed

- 2026-03-27 — Inventory and Skills panel titles changed from all-caps to title case
- 2026-03-27 — ESC now closes the inventory and skills panels directly rather than opening the game menu
- 2026-03-27 — Panel key handling consolidated via TURN_STATE.SHOP so 'I'/'K' are silently ignored while the shop is open
- 2026-03-27 — Shop panel rows now require two clicks/taps: first selects the row, second sells the item
- 2026-03-27 — Dev mode now defaults starting inventory to 2× Health Potion, 1× Mega Potion, 1× Short Sword, 1× Leather Armor for convenient testing

- 2026-03-25 — Potion of Minor Teleportation spawns less frequently than health and mega potions; potions are now weighted 3× relative to the teleport potion in the loot pool

### Fixed

- 2026-03-28 — SellPanel ✕ button now emits CLOSE_SELL_PANEL event instead of calling hide() directly, consistent with the UI style guide convention
- 2026-03-25 — Fix MCP servers (Context7, Serena) not loading in Claude Code by writing config to `.claude.json` instead of `settings.json` in `init-claude-settings.sh`

- 2026-03-25 — "Potion of Minor Teleportation" label overflowed its inventory slot; item types now support an optional `shortName` used in the slot label (falling back to `name`), and the potion uses `shortName: 'Teleport Potion'`
- 2026-03-25 — Developer options labels overflowed off the left edge on narrow mobile viewports; labels now word-wrap at the available horizontal space and row heights grow to fit wrapped text
- 2026-03-24 — Main menu button font changed on first hover; Phaser was creating Text objects before Roboto Mono was in the canvas font cache — fixed by deferring `new Phaser.Game()` until `document.fonts.load('16px "Roboto Mono"')` resolves
- 2026-03-24 — Dev-mode achievement toggle (uncomplete) did not remove the associated skill or reset upgrades; `AchievementSystem.lock()` now emits `ACHIEVEMENT_LOCKED`, `GameScene._handleAchievementSkillLock()` calls `SkillSystem.removeSkill()` in response; `AchievementsScene` uses `sys.lock(def)` for the reset path
- 2026-03-24 — Dev-mode achievement toggle did not fire skill unlocks; `_addDevCheckbox` now calls `devCompleteAchievement()` which emits `ACHIEVEMENT_UNLOCKED`, so permanent skills (e.g. Goblin Hunting) are granted just as they would be during normal gameplay
- 2026-03-24 — Collapsed `goblin-hunting-skill.feature` into the generic `hunting-skills.feature`; deleted redundant feature file and step definitions
- 2026-03-24 — Kill achievements counted multiple times per kill even on fresh browser load; `AchievementsScene` was creating a full `AchievementSystem` subscribed to the live EventBus each time the screen opened, stacking permanent listeners; fixed by passing a no-op bus to the read-only display instance
- 2026-03-24 — Kill achievements counted multiple times per kill after restarting a game; fixed by adding `AchievementSystem.destroy()` to remove EventBus listeners when GameScene shuts down

### Added

- 2026-03-28 — Sell panel shows item description (stats) below the item list when a row is highlighted
- 2026-03-28 — Inventory panel shows item description (stats) below the grid when a slot is highlighted; first pointer tap selects a slot, second tap uses/equips the item
- 2026-03-27 — UI_STYLE_GUIDE.md: style guide for panel background, title, close button, ESC behaviour, and TurnManager integration
- 2026-03-26 — Town shops: 3 shops (potion, weapon, armour) with door tiles; bumping a door opens a sell panel showing accepted items with gold prices; player starts with 0 gold displayed in the HUD; `ShopSystem`, `SellPanel` added; `PLAYER_GOLD_CHANGED`, `OPEN_SELL_PANEL`, `SELL_ITEM` events added
- 2026-03-26 — Town uses distinct tile textures: warm cobblestone floor (`tile_town_floor`) and cream stone wall (`tile_town_wall`), visually separate from the dark dungeon tiles
- 2026-03-26 — Town floor is now fully lit (daylight FOV): all non-opaque tiles are always visible; `computeDaylightFOV` added to `ShadowcastFOV.js`; town map is centred on screen with no player-follow camera
- 2026-03-26 — Wire `TownGenerator` into `FloorManager.generateFloor()` so floor 0 returns the fixed town layout; change `devOptions.startFloor` default from 1 to 0 so new games start in the town
- 2026-03-25 — Add Town level (floor 0): `FloorManager` starts at floor 0, `isTown()` returns true at floor 0, `TownGenerator` produces a fixed non-random 20×20 layout with floor tiles and stairs leading down
- 2026-03-25 — Add `description` frontmatter to `/pr` command so Claude invokes it automatically when the user asks to make a PR
- 2026-03-25 — Add `/devserver` custom slash command to start the Vite dev server with automatic port-conflict detection and resolution
- 2026-03-25 — Add `/sync` and `/pr` custom Claude Code slash commands to automate the pull-from-main and PR-creation workflows
- 2026-03-25 — Add Serena MCP project config (`.serena/project.yml`, `.serena/.gitignore`) so all collaborators get consistent codebase navigation settings
- 2026-03-24 — Added Sprite Stalker achievement (25 sprite kills) unlocking the Potion of Minor Teleportation; potion teleports the player to a random walkable tile 3–8 tiles away (Chebyshev distance), bypassing walls; appears in floor loot once achievement is completed
- 2026-03-24 — Added Cockroach Killer (30 kills) and Sprite Killer (10 kills) achievements, each unlocking a permanent +10% damage hunting skill; Orc Killer and Troll Killer now also unlock Orc Hunting and Troll Hunting permanent skills; generic HuntingSkill class added to support all four
- 2026-03-24 — Cockroaches spawn in connected clusters of 2–5 adjacent to each other
- 2026-03-24 — Sprites have a 25% chance to teleport up to 3 tiles instead of moving normally
- 2026-03-24 — Orcs can now appear from floor 1; trolls appear from floor 4 onwards
- 2026-03-24 — Added Cockroach (1 hp, ATK 1, DEF 1, aggro range 2) and Sprite (3 hp, ATK 2, DEF 1, aggro range 3) enemies; both appear frequently on floors 1–5 and much less often beyond that
- 2026-03-22 — Night Vision skill (upgradeable, +1 FOV per level) unlocks in the skill pool when the Burrower achievement is completed; `SkillSystem.unlockSkill()` and `getFovBonus()` added
- 2026-03-22 — Achievements screen now shows an "→ Unlocks: ..." line beneath any achievement that grants a named reward
- 2026-03-22 — Completing the Goblin Killer achievement unlocks the Goblin Hunting permanent skill (+10% damage against goblins), visible in the skills panel; `SkillSystem.unlockPermanentSkill()` added; `applyOnHitSkills` now receives defender type so enemy-specific skills can apply

---

## [0.15.6] - 2026-03-22

### Fixed

- 2026-03-22 — Restore FONT_FAMILY to 'Roboto Mono'; was accidentally reverted to 'monospace'

---

## [0.15.5] - 2026-03-22

### Fixed

- 2026-03-22 — Movement no longer continues after dismissing the SkillLevelUpScene; held direction and run state are cleared before the scene sleeps

### Changed

- 2026-03-22 — InGameMenuScene keyboard focus indicator changed from text colour to a white outline rectangle around the focused button
- 2026-03-22 — HUD clarity improvements: larger fonts (10px→12px HP, 10px→11px stats), stats row repositioned below HP bar with gap before XP bar, HP/XP background bars given 1px black outline and filled bars given 1px white outline, bar widths increased to 130px
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

- 2026-03-22 — Increase inventory slot size (44→54px) so item names fit on two wrapped lines; reposition icon/label within slot; increase panel height to eliminate WPN/ARM overlap with item grid
- 2026-03-22 — Fix inventory panel layout on non-touch: title uses word wrap to prevent overflow, slots offset increased for wrapped title, equipped text bottom-anchored with PANEL_PAD margin
- 2026-03-22 — Bump minimum font sizes for Roboto Mono: 7px→10px (inventory slot labels), 9px→11px (inventory equipped text, message log scroll hint, version string), 10px→11px (message log header)
- 2026-03-22 — Extract font into `src/utils/FontConfig.js` FONT_FAMILY constant; load six candidate Google Fonts (VT323, Press Start 2P, Share Tech Mono, Roboto Mono, Inconsolata, IBM Plex Mono) for review
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
