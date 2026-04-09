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
GameScene                ──► OPEN_SKILLS          ──► UIScene → SkillsPanel.show/hide
SkillsPanel (dev mode)   ──► UPGRADE_SKILL        ──► GameScene._handleUpgradeSkill
SkillsPanel (dev mode)   ──► DOWNGRADE_SKILL      ──► GameScene._handleDowngradeSkill
SkillsPanel (dev mode)   ──► ACTIVATE_SKILL       ──► GameScene._handleActivateSkill
GameScene                ──► OPEN_SKILLS          ──► UIScene → SkillsPanel.show (refresh after upgrade)
GameScene                ──► GAME_OVER            ──► (none — reserved for future use)
GameScene (once)         ──► RESTART_GAME         ──► GameScene._restart
GameScene                ──► ENEMY_KILLED         ──► AchievementSystem → _handleEnemyKilled

InventorySystem          ──► INVENTORY_CHANGED    ──► InventoryPanel._refresh
InventorySystem          ──► INVENTORY_CHANGED    ──► UIScene → SellPanel.refresh
GameScene                ──► INVENTORY_CHANGED    ──► UIScene → SellPanel.refresh (after sell)
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
DPad (K button)          ──► TOGGLE_SKILLS        ──► GameScene._toggleSkills
DPad (▼▼ button)         ──► USE_STAIRS           ──► GameScene._tryUseStairs
DPad (≡ menu button)     ──► OPEN_IN_GAME_MENU   ──► GameScene (close log or open in-game menu)

AchievementSystem        ──► ACHIEVEMENT_UNLOCKED ──► GameScene → MESSAGE log
AchievementSystem        ──► ACHIEVEMENT_UNLOCKED ──► UIScene → _showAchievementBanner
AchievementSystem        ──► ACHIEVEMENT_LOCKED   ──► GameScene → _handleAchievementSkillLock

MessageLog (click)       ──► MESSAGE_LOG_TOGGLED  ──► GameScene (gates ESC handler)
GameScene (ESC key)      ──► CLOSE_MESSAGE_LOG    ──► UIScene → MessageLog.close()

GameScene                ──► PLAYER_GOLD_CHANGED  ──► UIScene → HUD.updateGold, BuyPanel.updateGold/refresh
GameScene                ──► OPEN_SELL_PANEL      ──► UIScene → SellPanel.show (toggle)
SellPanel (sell button)  ──► SELL_ITEM            ──► GameScene._handleSellItem
SellPanel (show/hide)    ──► SELL_PANEL_TOGGLED   ──► GameScene (gates ESC handler)
GameScene / SellPanel ✕  ──► CLOSE_SELL_PANEL     ──► UIScene → SellPanel.hide() + BuyPanel.hide()
GameScene (door bump)    ──► OPEN_BUY_PANEL       ──► UIScene → BuyPanel.show
BuyPanel (buy button)    ──► BUY_ITEM             ──► GameScene._handleBuyItem
BuyPanel (show/hide)     ──► BUY_PANEL_TOGGLED    ──► (internal state tracking)
GameScene / BuyPanel ✕   ──► CLOSE_BUY_PANEL      ──► UIScene → BuyPanel.hide() + SellPanel.hide()
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
| `INVENTORY_CHANGED` | `'inventory-changed'` | `Item[]` | InventorySystem, GameScene (after sell) | InventoryPanel, UIScene → SellPanel |
| `PLAYER_STATS_CHANGED` | `'player-stats-changed'` | `object` (stats) | InventorySystem | *(none)* |
| `FLOOR_CHANGED` | `'floor-changed'` | `number` (floor) | FloorManager | GameScene, AchievementSystem |
| `DPAD_PRESS` | `'dpad-press'` | `string` (DIR constant) | DPad | GameScene |
| `DPAD_HOLD_START` | `'dpad-hold-start'` | `string` (DIR constant) | DPad (pointerdown) | HeldMovementTracker |
| `DPAD_HOLD_END` | `'dpad-hold-end'` | `string` (DIR constant) | DPad (pointerup/pointerout) | HeldMovementTracker |
| `DPAD_RUN` | `'dpad-run'` | `string` (DIR constant) | DPad (double-tap) | GameScene._startRun |
| `OPEN_IN_GAME_MENU` | `'open-in-game-menu'` | *(none)* | DPad (≡ button) | GameScene (close log or open in-game menu) |
| `TOGGLE_INVENTORY` | `'toggle-inventory'` | *(none)* | DPad | GameScene |
| `USE_STAIRS` | `'use-stairs'` | *(none)* | DPad | GameScene |
| `GAME_OVER` | `'game-over'` | *(none)* | GameScene | *(none)* |
| `RESTART_GAME` | `'restart-game'` | *(none)* | GameScene (key handler) | GameScene |
| `ENEMY_KILLED` | `'enemy-killed'` | `string` (enemy type) | GameScene | AchievementSystem |
| `ACHIEVEMENT_UNLOCKED` | `'achievement-unlocked'` | `AchievementDefinition` | AchievementSystem | GameScene (message log), UIScene (banner) |
| `ACHIEVEMENT_LOCKED` | `'achievement-locked'` | `AchievementDefinition` | AchievementSystem | GameScene (skill removal) |
| `MESSAGE_LOG_TOGGLED` | `'message-log-toggled'` | `boolean` (open) | MessageLog | GameScene (ESC gate) |
| `CLOSE_MESSAGE_LOG` | `'close-message-log'` | *(none)* | GameScene (ESC key) | UIScene → MessageLog.close() |
| `OPEN_SKILLS` | `'open-skills'` | `{ skills: object[], inactiveSkills: object[], forceRefresh?: boolean }` | GameScene (K key, upgrade refresh) | UIScene → SkillsPanel |
| `TOGGLE_SKILLS` | `'toggle-skills'` | *(none)* | DPad (K button) | GameScene |
| `UPGRADE_SKILL` | `'upgrade-skill'` | `{ skillId: string }` | SkillsPanel (dev mode upgrade button) | GameScene._handleUpgradeSkill |
| `DOWNGRADE_SKILL` | `'downgrade-skill'` | `{ skillId: string }` | SkillsPanel (dev mode downgrade button) | GameScene._handleDowngradeSkill |
| `ACTIVATE_SKILL` | `'activate-skill'` | `{ skillId: string }` | SkillsPanel (dev mode activate button) | GameScene._handleActivateSkill |
| `PLAYER_GOLD_CHANGED` | `'player-gold-changed'` | `number` (new total) | GameScene (after buy/sell) | UIScene → HUD, BuyPanel |
| `OPEN_SELL_PANEL` | `'open-sell-panel'` | `{ shopType, inventory, player }` | GameScene (door bump) | UIScene → SellPanel |
| `SELL_ITEM` | `'sell-item'` | `{ shopType: string, item: Item }` | SellPanel (sell button) | GameScene._handleSellItem |
| `SELL_PANEL_TOGGLED` | `'sell-panel-toggled'` | `boolean` (open) | SellPanel (show/hide) | GameScene (ESC gate) |
| `CLOSE_SELL_PANEL` | `'close-sell-panel'` | *(none)* | GameScene (ESC key), SellPanel/BuyPanel (✕ button) | UIScene → SellPanel.hide() + BuyPanel.hide() |
| `OPEN_BUY_PANEL` | `'open-buy-panel'` | `{ shopType, shopStock, player }` | GameScene (door bump) | UIScene → BuyPanel |
| `BUY_ITEM` | `'buy-item'` | `{ shopType: string, shopItem: {item, buyPrice} }` | BuyPanel (buy button) | GameScene._handleBuyItem |
| `BUY_PANEL_TOGGLED` | `'buy-panel-toggled'` | `boolean` (open) | BuyPanel (show/hide) | *(internal state tracking)* |
| `CLOSE_BUY_PANEL` | `'close-buy-panel'` | *(none)* | GameScene (ESC key), BuyPanel (✕ button) | UIScene → BuyPanel.hide() + SellPanel.hide() |
