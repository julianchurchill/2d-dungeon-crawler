# Changelog

All notable changes to this project will be documented here.
Entries are listed newest-first within each section.

---

## [Unreleased]

### Fixed

- 2026-05-14 — **Save/load: unique room textures and NPC lost on reload**: loading a save made inside a unique room (e.g. Necropolis Library) now correctly repaints the themed floor/wall tiles and restores the dungeon NPC (e.g. the Archivist). `serializeFloor` now accepts an `entryTracker` and `npcs` array; `_restoreFloor` calls `paintUniqueRoomTiles` and `spawnNpcs` when the saved state includes them.
- 2026-05-11 — **Champion/boss loot drop crash**: `PlayerActionHandler.applyChampionLoot` and `applyBossLoot` called `sc._placeItem(...)` which no longer exists on `GameScene` after the FloorBuilder extraction. Both now correctly call `sc._floorBuilder._placeItem(...)`.

### Changed

- 2026-05-13 — **Refactor: extract SpriteAnimator**: all Phaser sprite animation and health-bar rendering logic extracted from `GameScene` into a new `SpriteAnimator` class in `src/systems/`. Covers `animateMove`, `animateProjectile`, `flashSprite`, `createHealthBar`, and `updateHealthBar`. `GameScene` methods are now one-line delegates. `getHealthBarColor` import and `MOVE_DURATION` constant removed from `GameScene`.
- 2026-05-13 — **Refactor: extract FovHandler**: field-of-view computation and shadow-rendering logic extracted from `GameScene` into a new `FovHandler` class in `src/systems/`. `updateFOV()` owns the full FOV recompute cycle (reset visible tiles, compute new set via `computeFOV`/`computeDaylightFOV`, update enemy/item/NPC sprite visibility); `redrawShadows()` repaints the shadow graphics overlay. `GameScene._updateFOV()` and `_redrawShadows()` are now one-line delegates. `computeFOV`, `computeDaylightFOV`, and `FOV_RADIUS` removed from `GameScene`.
- 2026-05-13 — **Refactor: extract InputHandler**: all keyboard, pointer, and EventBus input-routing logic extracted from `GameScene` into a new `InputHandler` class in `src/systems/`. `setup()` owns all key bindings and the pointer look-click handler; `setupEvents()` owns the D-pad, mobile menu, and UI-button EventBus handlers (DPAD_PRESS, DPAD_RUN, OPEN_IN_GAME_MENU, TOGGLE_INVENTORY, TOGGLE_SKILLS, TOGGLE_RANGED_AIM, USE_STAIRS). `GameScene._setupInput()` is now a one-line delegate; `_handleLookClick()` is removed from `GameScene`. `HeldMovementTracker`, `HoldRepeatScheduler`, `wrapWithRunCancel`, `handleMobileMenuPress`, `applyEscPanelClose`, and `MOVE_REPEAT_DELAY_MS` removed from `GameScene`.
- 2026-05-11 — **Refactor: extract GameLifecycleHandler**: game-over, restart, resurrect, save-and-exit, and save-restore logic extracted from `GameScene` into a new `GameLifecycleHandler` class in `src/systems/`. Covers `gameOver`, `resurrect`, `restart`, `handleSaveAndExit`, and `applyLoadedSave`. `GameScene` methods are now one-line delegates; `recordGlobalDeath`, `isDevEnvironment`, `createSkillFromData`, and `restoreInventoryAndEquipment` imports removed from `GameScene`.
- 2026-05-11 — **Refactor: extract SkillEventHandler**: skill and achievement-skill event handlers extracted from `GameScene` into a new `SkillEventHandler` class in `src/systems/`. Covers `handleUpgradeSkill`, `handleDowngradeSkill`, `handleActivateSkill`, `handleAchievementSkillUnlock`, and `handleAchievementSkillLock`. `_buildSkillsPayload` moved as a private helper. `HuntingSkill` and `NightVisionSkill` imports removed from `GameScene`.
- 2026-05-11 — **Refactor: extract ShopEventHandler**: shop and display-case event handlers extracted from `GameScene` into a new `ShopEventHandler` class in `src/systems/`. Covers `handleBuyItem`, `handleSellItem`, `handleStoreItem`, and `handleRetrieveItem`. `GameScene` methods are now one-line delegates; `ShopSystem`, `recordGlobalGoldGained`, and `recordGlobalGoldSpent` imports removed from `GameScene`.
- 2026-05-11 — **Refactor: extract CombatHandler**: all enemy-turn and combat-resolution logic extracted from `GameScene` and `PlayerActionHandler` into a new `CombatHandler` class in `src/systems/`. Includes `startEnemyTurns`, `destroyEnemy`, `applyPendingRemovedSegments`, `spawnBossMinions`, `applyBossLoot`, and `applyChampionLoot`. `GameScene` methods are now one-line delegates; unused imports removed.
- 2026-05-10 — **Refactor: extract FloorBuilder**: all floor-construction and entity-spawning logic (~18 methods) extracted from `GameScene` into a dedicated `FloorBuilder` class in `src/systems/`. `GameScene._buildFloor()` now delegates to `this._floorBuilder` for tilemap rendering, enemy/item/NPC placement, and unique room construction. Eleven now-unused imports removed from `GameScene.js`.
- 2026-05-10 — **Refactor: consolidate ItemTypes**: the 14 equipment-slot items (LEATHER_CAP through JADE_AMULET) that were appended to `ITEM_TYPES` after the object literal are now defined inside it, matching the format of all other item types. Section comments added to group by slot.
- 2026-05-10 — **Refactor: extract LootTables**: loot selection functions (`getFloorLoot`, `getFloorLootPool`, `getChallengeLoot`, `getChallengeLootPool`, `getPickAxeFloorDrop`, `getHiddenRoomLoot`) and `RARE_FLOOR_DROP_ITEMS` moved from `ItemTypes.js` into a new `src/items/LootTables.js`. `ItemTypes.js` now contains only item type definitions.
- 2026-05-10 — **Refactor: Item.use() strategy pattern**: replaced the 9-branch if-else in `Item.use()` with a strategy pattern. Each item type definition in `ItemTypes.js` now carries its own `use(item, player, context)` function field. `Item.use()` delegates to it via `this._typeDef?.use?.(...)`. Adding new usable item types no longer requires modifying `Item.js`.
- 2026-05-10 — **Refactor: extract PlayerActionHandler**: all player-turn logic (~27 methods, ~850 lines) extracted from `GameScene` into a dedicated `PlayerActionHandler` class in `src/systems/`. `GameScene` methods are now one-line delegates, reducing `GameScene.js` from ~3,300 to ~2,400 lines. Unused imports removed from `GameScene.js`.

### Added

- 2026-05-10 — **General Shop**: added a fourth town shop — the General Shop — selling rings and amulets. These items have been removed from the Armour Shop. The town map has been widened from 20 to 26 tiles to accommodate the new shop building.
- 2026-05-04 — **Dev: give items to player**: a new **GIVE ITEMS** option in the in-game dev menu (ESC → DEV OPTIONS → Give items to player) opens a scrollable `DevGiveItemScene` listing every item in the game grouped by type. Pressing GIVE next to any item immediately adds one instance to the player's inventory and appends a message-log entry. A full-inventory message is shown if the add fails. `devGiveItem()` added to `DevOptions`; `DEV_GIVE_ITEM` event added to `GameEvents`.

---

## [0.82.0] - 2026-05-04

### Added

- 2026-05-04 — **Dev: free shop toggle**: new "Free shop" toggle in the in-game dev menu (ESC → DEV OPTIONS) lets the player buy items with no gold cost. Gold is not deducted and `recordGoldSpent` is skipped when active. Toggle persists for the duration of the session and resets with `resetDevOptions()`.

- 2026-05-04 — **Global stats: highest level and total deaths**: two new lifetime stats added to `GlobalStatsStore` — `highestLevel` (highest character level reached across all runs) and `totalDeaths` (total number of times the player has died). Both are displayed in the Global Stats screen summary and persisted through reloads. `GameScene` hooks added at the two level-up sites and in `_gameOver()`.
- 2026-05-04 — **Global stats tracking and screen**: lifetime statistics now accumulate across all save slots and runs in a dedicated `global_stats` localStorage entry. Tracked: deepest floor, kills per enemy type, consumables used, walls broken, gold gained and spent, and unique boss types killed. A **STATS** button on the main menu opens a `GlobalStatsScene` showing all four sections. `GlobalStatsStore`, `GlobalStatsScene`, and `formatGlobalStats` added; `GameScene` hooks added alongside existing per-run hooks; `MainMenuScene` updated with the new button.
- 2026-05-04 — **Run stats screen**: a new STATS button in the in-game menu (ESC → STATS) opens a read-only run statistics screen showing summary figures, a kills breakdown by enemy type (sorted by count), and consumables used by item id. `StatsScene` and `RunStatsFormatter` added; `InGameMenuScene` updated with the new button.
- 2026-05-04 — **Run stats tracking**: the game now records per-save-slot statistics for the current run — deepest floor reached, kills per enemy type, consumables used per item id, walls broken, total gold gained (from boss loot and item sales), and total gold spent in shops. Stats are persisted through save/load cycles and default to zero for saves that pre-date this feature. `Player.runStats` object added along with `recordFloorReached`, `recordKill`, `recordConsumableUsed`, `recordWallBroken`, `recordGoldGained`, and `recordGoldSpent` methods.

---

## [0.77.0] - 2026-05-03

### Added

- 2026-05-03 — **Hidden passages behind breakable walls**: some Rocky Stone Walls now conceal a secret 3×3 room beyond them, reachable only by breaking the wall with a Pick Axe. The first time a player comes within 8 tiles of such a wall the message log shows "You feel a draft nearby." Breaking a hidden passage wall reveals the chamber with a special discovery message instead of carving an alcove. Hidden rooms always contain 2 valuable items (gear-biased loot pool). A new "HIDDEN PASSAGES — Force hidden rooms" toggle in Developer Options forces every eligible breakable wall to attempt a hidden room on the next floor. `HiddenPassagePlacer`, `checkDraftProximity`, `getHiddenRoomLoot`, and `TILE.HIDDEN_PASSAGE_WALL` added.
- 2026-05-03 — **Confirm before selling an equipped item**: attempting to sell an equipped weapon, armour piece, or other equipped item at a shop now shows a warning ("is equipped! Press again to confirm selling.") and requires a second press to confirm. Navigating away or closing the panel resets the confirmation. `ShopPanel._trySell()` added; `_pendingConfirmIndex` state tracks which sell row is awaiting confirmation.
- 2026-05-03 — **Dev Options — Item Spawn section**: a new ITEM SPAWN section in Developer Options lets testers force rare floor items to appear on the next dungeon floor, bypassing their normal RNG drop chance. Each item shows an ON/OFF toggle (green = FORCED). Currently exposes the Pick Axe (10% rare drop). New items with percentage-based floor drops are added by registering them in `RARE_FLOOR_DROP_ITEMS`. `devOptions.forcedFloorItems` (Set) added.
- 2026-05-03 — **Dev resurrect**: in dev mode, dying now shows "Press R to restart or U to resurrect". Resurrecting restores the player to full HP in place with all items and stats intact and continues the run; the save is preserved. `Player.resurrect()` added.
- 2026-05-03 — **Help screen**: keyboard help now lists `x — drop item` in the Inventory section.
- 2026-05-03 — **Pick axe availability rebalanced**: pick axe now has a 10% chance of appearing once as a rare floor drop per dungeon level (outside challenge floors) and costs 50 gold in the weapon shop.
- 2026-05-02 — **Breakable wall alcove carving**: breaking a Rocky Stone Wall now carves a small cave alcove beyond it — up to 3 new floor tiles open up ahead (75% chance for the tile directly forward, 40% for each forward diagonal). Each wall tile bordering the new space has a 25% chance of also becoming a Rocky Stone Wall, rewarding pick axe exploration with further opportunities to break through. `AlcoveCarver` added.
- 2026-05-02 — **Pick Axe**: a new weak weapon (`+2 Attack`) that can break Rocky Stone Walls by moving into them while equipped. Breakable walls appear indistinguishable from regular walls visually but are identified as "Rocky Stone Wall" by the Look feature. Dungeon rooms have a 25% chance of having 1–2 breakable walls on their perimeter; breaking a wall converts it to floor and spends a turn. `TILE.BREAKABLE_WALL` and `BreakableWallPlacer` added; `Item.canBreakWalls` flag added.
- 2026-05-02 — **Drop items from inventory**: pressing `X` while the inventory is open drops the highlighted item onto the player's current floor tile. On touch devices a `[DROP]` button is shown in the inventory panel header. The dropped item becomes a floor item that can be picked up again. `GameEvents.INVENTORY_DROP` added.
- 2026-05-01 — **Export / import save as copyable string**: each occupied slot on the save slot screen now shows an `[ EXPORT ]` button (or press `E`) that copies the full save as a Base64 string to the clipboard. Empty slots show an `[ IMPORT ]` button (or press `I`) that accepts a pasted export string and restores the save into that slot, enabling cross-device transfers and manual backups. `exportSave()` and `importSave()` added to `SaveGame`.
- 2026-05-01 — **Multiple save slots**: the game now supports five independent save slots. Both CONTINUE and NEW GAME route through a new slot selection screen showing each slot's floor reached, player level, and save date/time (or "Empty" for unused slots). In New Game mode, selecting an occupied slot asks for confirmation before overwriting. `SaveGame` functions now accept a `slot` parameter; `listSaves()` and `hasAnySave()` added for the slot screen.
- 2026-05-01 — **Autosave timer**: the game now silently saves every 2 minutes while in progress, including a full floor state snapshot. Progress is preserved even if the browser is closed without using "Save and Exit". The timer is stopped automatically when the game ends or the player returns to the main menu.
- 2026-04-27 — **Save / Load system (floor state)**: the exact dungeon floor is now saved alongside player state on every floor transition and when choosing "Save and Exit". Continuing a game restores the tile layout, enemy positions with current HP, floor items, and unique room discovery history exactly as they were left. `serializeFloor()` added to `SaveGame`; `GameScene._restoreFloor()` reconstructs all floor entities (enemies, champions, Creeping Mass, Old Bones, items) from saved data without re-running procedural generation.
- 2026-04-27 — **Save / Load system (player state)**: player stats, gold, inventory, equipment, and skill upgrade state are now saved to `localStorage` on each floor transition and when choosing "Save and Exit" from the in-game menu. The main menu now shows a **CONTINUE** button (active only when a save exists) alongside **NEW GAME**. Starting a new game clears any existing save; dying also clears it. A `SaveGame` module with injectable storage and a `SkillFactory` for skill reconstruction are introduced.
- 2026-04-27 — **Achievement persistence**: achievement progress is now saved to `localStorage` on every update and restored when the game loads. Each new game resets all achievement progress so achievements are correctly scoped to a single run. A `setStorage()` injection point allows tests to run without touching real browser storage.
- 2026-04-26 — **Trash piles**: some dungeon rooms now contain 1–3 randomly placed trash pile tiles (40% chance per room). Three visual variants exist — scattered bones and rags, broken pots and rubble, mouldy cloth and scraps. All variants are non-walkable but transparent (they do not block line of sight). Trash piles are never placed adjacent to corridor entries so room access is always clear. The Look feature identifies them as "Trash Pile".
- 2026-04-25 — **Stat distribution on level up**: levelling up now awards 2 stat points instead of automatically increasing Attack. A new `StatDistributionScene` overlay lets the player freely spend each point on either Attack or Defense before returning to the game. After spending all points the scene chains to `SkillLevelUpScene` if skill choices are also available. `Player.applyStatPoint(stat)` added; `Player.levelUp()` no longer auto-increments `attack`.
- 2026-04-25 — **Home Seeking Scroll (scene wiring)**: using the scroll now triggers a full floor transition — the current dungeon floor is saved as a `DungeonSnapshot` (enemies, items, map), the player is faded to town, and a glowing `RECALL_PORTAL` tile is placed near the town stairs. Stepping on the portal and pressing `>` restores the exact floor state and returns the player to where they left. The portal disappears after one use. `FloorManager.jumpToTown()` added. Portal textures for all three tilesets.
- 2026-04-25 — **Home Seeking Scroll**: a new rare consumable item that teleports the player instantly to town when read. It leaves a RECALL_PORTAL tile near the town stairs so the player can step on it once to return to the exact dungeon floor and position they left from, with full floor state preserved (enemies, items, map). The scroll appears rarely on dungeon floors (floor 1+) and is always stocked once in the Magic Shop. The "Potion Shop" is now renamed "Magic Shop" to reflect its expanded, non-potion inventory.
- 2026-04-25 — **The Deeper Dark achievement**: discovering The Darker Way now unlocks the "The Deeper Dark" achievement, consistent with the per-room achievements for The Dark Armoury ("Steel and Shadow") and The Necropolis Library ("Forbidden Knowledge").
- 2026-04-25 — **Martel the Varangian sprite**: Martel now has a distinctive viking warrior sprite for all three tilesets — horned iron nasal helm, grey beard, chain mail hauberk, and a broad battle axe — replacing the generic fallback player sprite.
- 2026-04-24 — **The Darker Way**: a new unique room that appears only on floor 10+ and only after the player has entered The Necropolis Library. Contains Martel the Varangian (a soldier lost in the dungeon for years) and a locked alcove sealed by a new LOCKED_DOOR tile. Walking into the door with The Key to Elsewhere in inventory consumes the key and opens the door, revealing the Eclipse Blade (+12 ATK, the most powerful weapon) and The Key to Beyond (a quest item for a future room). Without the key, bumping the door shows a hint message. Custom floor, wall, locked-door, Eclipse Blade, and Key to Beyond textures for all three tilesets. Room prerequisites added to the UniqueRoomRegistry so rooms can require other rooms to have been entered first.
- 2026-04-24 — **The Key to Elsewhere**: a unique quest item found exclusively in The Necropolis Library, humming with portal-magic. It is not equippable and grants no combat stats — its purpose lies deeper in the dungeon. It has no sell value. Custom textures for all three tilesets.
- 2026-04-24 — **Dark Armoury unique items**: The Dark Armoury now drops the Null Scimitar (+9 ATK, void-energy curved blade) and the Night Cloak (+4 DEF, shadow-woven armour) instead of the Bone Blade and Leather Armor. The room guard is now a champion troll. Both new items have custom textures for all three tilesets.
- 2026-04-24 — **Unique room achievements**: discovering The Dark Armoury unlocks the "Steel and Shadow" achievement; discovering The Necropolis Library unlocks "Forbidden Knowledge". Both are triggered when the player first steps inside the room.
- 2026-04-23 — **Unique room decorations**: The Dark Armoury now contains four weapon-mount tiles (crossed-blades rack) placed at the inner corners, and The Necropolis Library has bookcase tiles lining its inner edges at regular spacing. Both decoration types are non-walkable and opaque (blocking line of sight), with distinct textures for all three tilesets.
- 2026-04-23 — **Unique room textures**: each unique named room now has a distinctive tile appearance — "The Dark Armoury" uses blackened iron slabs with rust-red stains and oxidised walls; "The Necropolis Library" uses obsidian floors with arcane blue rune glows and dark navy brickwork. Textures are generated for all three tilesets (classic, modern, HD).
- 2026-04-23 — **Unique rooms**: once per game a normal dungeon floor may contain a unique named room — currently "The Dark Armoury" (floor 8+, champion orc guardian, guaranteed Bone Blade drop) or "The Necropolis Library" (floor 5+, Archivist NPC with lore dialogue, potion stash). Each room has a 12% chance to appear on any eligible floor and can only appear once per run. When the floor is entered the player receives two discovery messages. A new UNIQUE ROOMS section in Developer Options lets testers force-spawn a specific room on the next floor regardless of chance or seen state.
- 2026-04-23 — **Room shape variety**: dungeon rooms now come in four shapes — rectangle, cross/plus, L-shape (four orientations), and chamfered (clipped corners). Large rectangular rooms (9×9 or bigger) also gain four symmetric wall pillars as internal obstacles. Entity and item spawning now guards against non-walkable tiles so enemies and items never land on pillar walls.
- 2026-04-22 — **Challenge floors**: every 5th dungeon floor (5, 10, 15, …) is a challenge floor with a fixed two-room layout. The entry room contains the up-staircase and serves as a safe landing zone. The arena room is filled with enemies — including at least one champion — that must all be defeated before the down-staircase unlocks. Only potions (Health Potion, Mega Potion, and the achievement-unlocked Teleport Potion) can spawn as floor items on challenge floors; no weapons or armour drop. An announcement message is shown on entry, and attempting to descend with enemies remaining displays a warning.
- 2026-04-22 — **Dev option — spawn champions**: a new CHAMPIONS section in the Developer Options screen lets testers set exact per-level spawn counts for champion variants of any eligible enemy type. Counts are independent of the normal 10% champion-chance logic (both can apply simultaneously). Resetting returns to the default random-chance behaviour.
- 2026-04-22 — **Champion enemies**: normal enemies now have a 10 % chance to spawn as a champion variant. Champions have 1.5× HP, 1.3× attack, and at least +1 defense compared to the base type, award twice the XP on defeat, are rendered with a gold tint and at 1.35× scale to distinguish them visually, and always drop a random item from the floor loot pool (drawn from the current floor up to 5 floors deeper) when killed. Solitary and boss enemy types (Creeping Mass, Old Bones) are exempt from the champion mechanic.
- 2026-04-22 — **Stackable inventory items**: potions (Health Potion, Mega Potion, Potion of Minor Teleportation) now stack in a single inventory slot. The slot label shows the current count (e.g. `Health Potion x3`). Using a stacked consumable or selling one at a shop only affects one item at a time — the stack count decrements rather than the slot disappearing until the last item is consumed or sold. The inventory panel and sell panel both reflect stack counts accurately.

### Changed

- 2026-05-03 — **Item renames**: "Leather Armor" renamed to "Leather Shield"; "Chain Mail" renamed to "Iron Shield".
- 2026-04-27 — **Main menu reworked for save/load**: "START GAME" is replaced by **CONTINUE** (disabled when no save exists) and **NEW GAME**. The in-game ESC menu gains a **SAVE AND EXIT** option.
- 2026-04-27 — **Achievements removed from main menu**: the Achievements button has been removed from the main menu. Achievements are scoped to a single run so they have no meaning before a game starts; they remain accessible from the in-game ESC menu throughout a run.

### Fixed

- 2026-05-03 — **Selling an equipped item now unequips it**: `ShopSystem.sell` previously removed the item from inventory but left the equipment slot populated, causing the player to appear equipped with a sold item and retain its stat bonuses. The slot is now cleared before the item is removed.
- 2026-05-03 — **Equipped-item sell warning works after loading a save**: `GameScene._applyLoadedSave` was reconstructing equipped slots as separate `Item` instances from inventory items, so `Player.isEquipped()` always returned `null` after loading a save. Equipment slots are now assigned the same object references as the corresponding inventory items. Logic extracted to `src/save/restorePlayer.js`.
- 2026-05-03 — **Dropping an equipped item now unequips it**: dropping a weapon, armour piece, or any other equipped item from the inventory unequips it first. A first press of X when the highlighted item is equipped shows a confirmation warning; a second press confirms and drops it.
- 2026-05-03 — **Armour shop now accepts and sells all equipment slot types**: boots, helmets, chestpieces, leggings, gauntlets, rings, and amulets can now be sold at the armour shop. The shop's generated stock covers all slot types across two tiers, unlocking tier-2 pieces at higher player levels.
- 2026-05-02 — **Save now remembers revealed dungeon tiles**: `serializeFloor` now includes the full FOV explored-state array alongside tile data. Continuing a save restores which areas the player had previously revealed, so the fog of war is correctly preserved across sessions. Backward compatible — old saves without `fovState` simply start with everything unexplored.
- 2026-05-02 — **Home Seeking Scroll now stacks**: the item type was missing `stackable: true`, so multiple scrolls occupied separate inventory slots. They now stack like potions.
- 2026-04-26 — **Look panel invisible on Classic/Modern tilesets**: the look panel was created inside GameScene, which uses camera zoom=2 for Classic and Modern tilesets. Phaser applies zoom to all objects in the scene, so the panel appeared at 2× its intended screen coordinates. Moved LookPanel to UIScene (which always runs at zoom=1, matching every other UI panel) and wired it through four new EventBus events (`LOOK_SHOW_ENEMY`, `LOOK_SHOW_ITEM`, `LOOK_SHOW_TILE`, `LOOK_HIDE`). The panel now renders correctly in the bottom-right corner on all tilesets.
- 2026-04-25 — **Stair double-descent**: pressing '>' or '.' rapidly on stairs could trigger multiple floor transitions. `_descend()` and `_ascend()` now call `startFloorTransition(turnManager)` which immediately sets the turn state to `TRANSITIONING`, blocking any further stair input until the new floor finishes loading and resets to `PLAYER_INPUT`.
- 2026-04-25 — **The Darker Way locked room redesign**: replaced the wall-divider approach (which could not reliably avoid BSP corridor entries) with a self-contained inner room carved outside the parent room's footprint after BSP generation. The inner room is connected to Martel's area only via a LOCKED_DOOR tile placed in the shared wall; no BSP corridor can ever reach it. The placer tries all four sides of the parent room and uses the first clear side. `LockedRoomPlacer` now exports `isInnerRoomSpaceAvailable` (replaces `getLockedRoomOrientation`) and is covered by two dedicated unit scenarios.
- 2026-04-24 — **Dev options scroll reset on unique room toggle**: selecting a unique room force-spawn option in Developer Options no longer scrolls the panel back to the top. Toggle rows now refresh in-place instead of restarting the scene.
- 2026-04-24 — **Unique room entry message timing**: floor entry now shows a generic hint ("You sense a place of power on this floor.") immediately on arrival; the room's name and flavour text are shown together only when the player first steps inside the room itself.
- 2026-04-23 — **Unique room decoration corridor avoidance**: weapon mount and bookcase tiles are no longer placed at or adjacent to corridor doorways. Placement logic extracted into a pure `RoomDecorationPlacer` module; a two-step corridor check skips any candidate tile that is directly adjacent to a corridor entry, or one step inside a doorway tile (catching inner-corner positions).

---

## [0.51.0] - 2026-04-17

### Added

- 2026-04-17 — **Additional equipment slots**: players can now equip items to **Helmet**, **Chest**, **Legs**, **Arms**, **Boots**, **Ring** (×2), and **Amulet** slots in addition to the existing Weapon, Shield, and Ranged slots. All equipped items contribute their defence and attack bonuses to the player's totals. Eleven new items span the new slots (Leather Cap, Iron Helmet, Leather Chestpiece, Chain Hauberk, Leather Leggings, Chain Leggings, Leather Gauntlets, Iron Gauntlets, Leather Boots, Iron Boots, Iron Ring, Gold Ring, Stone Amulet, Jade Amulet), gated behind appropriate floor thresholds (boots from floor 1, helmets from floor 10, chest/legs/arms from floor 20, rings/amulets from floor 30). The equipment panel has been redesigned into a two-column grid to fit all eleven slots. All three tileset variants include sprite icons for every new item type.
- 2026-04-17 — **Enemy health bars**: a thin colour-coded bar appears above each enemy sprite when the enemy has taken damage. The bar is green above 50% HP, yellow between 25–50%, and red at 25% or below. It is hidden at full health and follows the enemy's FOV visibility.
- 2026-04-17 — **Enemy ranged projectile animations**: when a Spitter or Skeleton Mage fires a ranged attack, a coloured projectile dot travels from the enemy to the player before damage is applied. All enemy projectiles for a turn fly simultaneously. Spitter fires acid-green; Skeleton Mage fires purple-violet.
- 2026-04-16 — **Ranged enemies — Spitter and Skeleton Mage bolt**: the **Spitter** (hp 12, atk 3, def 0, xp 20) is a new enemy that spits acid up to 3 tiles along cardinal axes; it appears in the spawn table from floor 10. **Skeleton Mages** now also fire a magical bolt (power 6, range 4) when cardinally aligned with the player. Both enemy types fire before moving, check line-of-sight, and deal damage via `resolveRangedAttack`. The player sprite flashes orange on a hit from a ranged enemy attack.
- 2026-04-16 — **Ranged attack mechanic**: press `R` (keyboard) or the **BOW** sub-menu button (mobile) to enter aim mode, then press a direction to fire the equipped ranged weapon up to 6 tiles. Walls block the shot; the nearest enemy in line is targeted. ESC or pressing `R` again cancels aim mode. The BOW button highlights while aiming. Help screen updated for both keyboard and mobile.
- 2026-04-16 — **Ranged weapon slot + Short Bow & Hand Crossbow**: the equipment panel now has a third **Ranged** slot. Two basic ranged weapons can be found as dungeon floor loot — **Short Bow** (+2 ATK, from floor 1) and **Hand Crossbow** (+4 ATK, from floor 4). Both contribute their attack bonus to the player's total attack power. All three tileset variants (classic, modern, HD) include a bow/arrow sprite for the new item.
- 2026-04-15 — **Equipment panel item icons**: the Weapon and Shield slots in the equipment panel now display the equipped item's sprite icon, scaled to fill the slot. The icon is hidden when the slot is empty and updates live when items are equipped. The redundant "WPN / ARM" text bar at the bottom of the inventory panel has been removed.
- 2026-04-15 — **Equipment panel**: opening the inventory now also shows an equipment panel to its right with a Weapon slot and a Shield slot. Each slot displays the equipped item's name or "Empty" when nothing is equipped, and updates live as items are equipped.
- 2026-04-15 — **Skeleton kill achievements and hunting skills**: killing 10 skeletons, 10 Skeleton Warriors, or 10 Skeleton Mages now unlocks the corresponding **Skeleton Hunting**, **Skeleton Warrior Hunting**, or **Skeleton Mage Hunting** permanent skill (+10% damage against that type).
- 2026-04-15 — **Skeleton enemies (floors 10–15)**: three skeleton-themed enemy types now populate floors 10–15. Basic **Skeleton** (hp 12, atk 4) joins the roster from floor 10; **Skeleton Warrior** (hp 18, atk 6, def 3) appears as a heavily armoured variant from floor 10; **Skeleton Mage** (hp 10, atk 5, teleports) dominates floors 13–15. Floor 16+ returns to a troll/Creeping Mass heavy roster. All three enemy types have unique classic and modern pixel-art sprites.
- 2026-04-15 — **Look cursor**: on non-touch devices press `l` to activate a cursor that starts on the player's tile. Direction keys move it around the visible map; the LookPanel updates with info about each tile under the cursor. Press `l` again or ESC to deactivate. Does not advance the game turn.
- 2026-04-15 — **Look**: clicking or touching any visible map cell shows a popup in the bottom-right corner describing what is there — enemy name and current/max HP, item name and description, or the tile name (Stone Floor, Stone Wall, Door, etc.). Only cells within the player's line of sight can be inspected. Looking does not advance the game turn.

### Changed

- 2026-04-15 — **Dev options — Start Floor / Start Level now unlimited**: removed the upper cap of 10 on Start Floor and 20 on Start Level; both can now be incremented without limit.

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
