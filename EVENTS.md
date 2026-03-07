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
GameScene                ──► OPEN_INVENTORY       ──► UIScene → InventoryPanel.toggle
GameScene                ──► GAME_OVER            ──► (none — reserved for future use)
GameScene (once)         ──► RESTART_GAME         ──► GameScene._restart

InventorySystem          ──► INVENTORY_CHANGED    ──► InventoryPanel._refresh
InventorySystem          ──► PLAYER_STATS_CHANGED ──► (none — reserved for future use)

FloorManager             ──► FLOOR_CHANGED        ──► GameScene → registry.set('floor')

InventoryPanel (click)   ──► INVENTORY_USE        ──► GameScene._useInventoryItem
InventoryPanel (keyboard)──► INVENTORY_USE        ──► GameScene._useInventoryItem

DPad (arrow buttons)     ──► DPAD_PRESS           ──► GameScene._handleDir
DPad (INV button)        ──► TOGGLE_INVENTORY     ──► GameScene._toggleInventory
DPad (▼▼ button)         ──► USE_STAIRS           ──► GameScene._tryUseStairs
───────────────────────────────────────────────────────────────────────
```

---

## Event reference

| Constant | String value | Payload | Publisher(s) | Subscriber(s) |
| --- | --- | --- | --- | --- |
| `MESSAGE` | `'message'` | `string` | GameScene | UIScene → MessageLog |
| `PLAYER_LEVEL_UP` | `'player-level-up'` | `number` (new level) | GameScene | UIScene → level-up banner |
| `OPEN_INVENTORY` | `'open-inventory'` | `{ inventory, player }` | GameScene | UIScene → InventoryPanel |
| `INVENTORY_USE` | `'inventory-use'` | `number` (index) | InventoryPanel | GameScene |
| `INVENTORY_CHANGED` | `'inventory-changed'` | `Item[]` | InventorySystem | InventoryPanel |
| `PLAYER_STATS_CHANGED` | `'player-stats-changed'` | `object` (stats) | InventorySystem | *(none)* |
| `FLOOR_CHANGED` | `'floor-changed'` | `number` (floor) | FloorManager | GameScene |
| `DPAD_PRESS` | `'dpad-press'` | `string` (DIR constant) | DPad | GameScene |
| `TOGGLE_INVENTORY` | `'toggle-inventory'` | *(none)* | DPad | GameScene |
| `USE_STAIRS` | `'use-stairs'` | *(none)* | DPad | GameScene |
| `GAME_OVER` | `'game-over'` | *(none)* | GameScene | *(none)* |
| `RESTART_GAME` | `'restart-game'` | *(none)* | GameScene (key handler) | GameScene |
