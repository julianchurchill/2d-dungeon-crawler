# Event Map

All EventBus events used in the game, defined as constants in
[`src/events/GameEvents.js`](src/events/GameEvents.js).

Keep this file up to date whenever events are added, removed, or modified.

---

## Publisher → Subscriber diagram

```text
PUBLISHERS                      EVENT                    SUBSCRIBERS
───────────────────────────────────────────────────────────────────────
GameScene                ──► MESSAGE              ──► UIScene → MessageLog
GameScene                ──► PLAYER_LEVEL_UP      ──► UIScene → _showLevelUpBanner
GameScene                ──► PLAYER_LEVEL_UP      ──► AchievementSystem → _handlePlayerLevelUp
GameScene                ──► OPEN_INVENTORY       ──► UIScene → InventoryPanel.toggle
GameScene                ──► GAME_OVER            ──► (none — reserved for future use)
GameScene (once)         ──► RESTART_GAME         ──► GameScene._restart
GameScene                ──► ENEMY_KILLED         ──► AchievementSystem → _handleEnemyKilled

InventorySystem          ──► INVENTORY_CHANGED    ──► InventoryPanel._refresh
InventorySystem          ──► PLAYER_STATS_CHANGED ──► (none — reserved for future use)

FloorManager             ──► FLOOR_CHANGED        ──► GameScene → registry.set('floor')
FloorManager             ──► FLOOR_CHANGED        ──► AchievementSystem → _handleFloorReached

InventoryPanel (click)   ──► INVENTORY_USE        ──► GameScene._useInventoryItem
InventoryPanel (keyboard)──► INVENTORY_USE        ──► GameScene._useInventoryItem

DPad (arrow buttons)     ──► DPAD_PRESS           ──► GameScene._handleDir
DPad (arrow pointerdown) ──► DPAD_HOLD_START      ──► HeldMovementTracker (auto-repeat)
DPad (arrow pointerup)   ──► DPAD_HOLD_END        ──► HeldMovementTracker (cancel repeat)
DPad (double-tap)        ──► DPAD_RUN             ──► GameScene._startRun
DPad (INV button)        ──► TOGGLE_INVENTORY     ──► GameScene._toggleInventory
DPad (▼▼ button)         ──► USE_STAIRS           ──► GameScene._tryUseStairs
DPad (≡ menu button)     ──► OPEN_ACHIEVEMENTS    ──► GameScene (close log or open Achievements)

AchievementSystem        ──► ACHIEVEMENT_UNLOCKED ──► GameScene → MESSAGE log
AchievementSystem        ──► ACHIEVEMENT_UNLOCKED ──► UIScene → _showAchievementBanner

MessageLog (click)       ──► MESSAGE_LOG_TOGGLED  ──► GameScene (gates ESC handler)
GameScene (ESC key)      ──► CLOSE_MESSAGE_LOG    ──► UIScene → MessageLog.close()
───────────────────────────────────────────────────────────────────────
```

---

## Event reference

| Constant | String value | Payload | Publisher(s) | Subscriber(s) |
| --- | --- | --- | --- | --- |
| `MESSAGE` | `'message'` | `string` | GameScene | UIScene → MessageLog |
| `PLAYER_LEVEL_UP` | `'player-level-up'` | `number` (new level) | GameScene | UIScene → level-up banner, AchievementSystem |
| `OPEN_INVENTORY` | `'open-inventory'` | `{ inventory, player }` | GameScene | UIScene → InventoryPanel |
| `INVENTORY_USE` | `'inventory-use'` | `number` (index) | InventoryPanel | GameScene |
| `INVENTORY_CHANGED` | `'inventory-changed'` | `Item[]` | InventorySystem | InventoryPanel |
| `PLAYER_STATS_CHANGED` | `'player-stats-changed'` | `object` (stats) | InventorySystem | *(none)* |
| `FLOOR_CHANGED` | `'floor-changed'` | `number` (floor) | FloorManager | GameScene, AchievementSystem |
| `DPAD_PRESS` | `'dpad-press'` | `string` (DIR constant) | DPad | GameScene |
| `DPAD_HOLD_START` | `'dpad-hold-start'` | `string` (DIR constant) | DPad (pointerdown) | HeldMovementTracker |
| `DPAD_HOLD_END` | `'dpad-hold-end'` | `string` (DIR constant) | DPad (pointerup/pointerout) | HeldMovementTracker |
| `DPAD_RUN` | `'dpad-run'` | `string` (DIR constant) | DPad (double-tap) | GameScene._startRun |
| `OPEN_ACHIEVEMENTS` | `'open-achievements'` | *(none)* | DPad (≡ button) | GameScene (close log or open Achievements) |
| `TOGGLE_INVENTORY` | `'toggle-inventory'` | *(none)* | DPad | GameScene |
| `USE_STAIRS` | `'use-stairs'` | *(none)* | DPad | GameScene |
| `GAME_OVER` | `'game-over'` | *(none)* | GameScene | *(none)* |
| `RESTART_GAME` | `'restart-game'` | *(none)* | GameScene (key handler) | GameScene |
| `ENEMY_KILLED` | `'enemy-killed'` | `string` (enemy type) | GameScene | AchievementSystem |
| `ACHIEVEMENT_UNLOCKED` | `'achievement-unlocked'` | `AchievementDefinition` | AchievementSystem | GameScene (message log), UIScene (banner) |
| `MESSAGE_LOG_TOGGLED` | `'message-log-toggled'` | `boolean` (open) | MessageLog | GameScene (ESC gate) |
| `CLOSE_MESSAGE_LOG` | `'close-message-log'` | *(none)* | GameScene (ESC key) | UIScene → MessageLog.close() |
