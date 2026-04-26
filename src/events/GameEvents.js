/**
 * @module GameEvents
 * @description Central registry of all EventBus event name constants.
 *
 * Using named constants instead of inline strings prevents typos causing
 * silent failures and makes it trivial to find every publisher and
 * subscriber of a given event via "Find All References" on the constant.
 *
 * Each constant is documented with its payload and the source/destination
 * of the event to make data-flow clear without having to grep the codebase.
 */

export const GameEvents = {
  /**
   * A text message to display in the message log.
   * Emitted by: GameScene
   * Subscribed by: UIScene → MessageLog
   * @type {string} The message text.
   */
  MESSAGE: 'message',

  /**
   * The player has levelled up.
   * Emitted by: GameScene
   * Subscribed by: UIScene (level-up banner), AchievementSystem
   * @type {number} The new character level.
   */
  PLAYER_LEVEL_UP: 'player-level-up',

  /**
   * Open (or toggle) the inventory panel.
   * Emitted by: GameScene
   * Subscribed by: UIScene → InventoryPanel
   * @type {{ inventory: Item[], player: Player }}
   */
  OPEN_INVENTORY: 'open-inventory',

  /**
   * Use the inventory item at the given index.
   * Emitted by: InventoryPanel
   * Subscribed by: GameScene
   * @type {number} Zero-based inventory index.
   */
  INVENTORY_USE: 'inventory-use',

  /**
   * The player's inventory contents have changed.
   * Emitted by: InventorySystem
   * Subscribed by: InventoryPanel (refreshes display)
   * @type {Item[]} The updated inventory array.
   */
  INVENTORY_CHANGED: 'inventory-changed',

  /**
   * The player's stats have changed (e.g. after equipping an item).
   * Emitted by: InventorySystem
   * Subscribed by: (none currently — reserved for future HUD integration)
   * @type {object} The player stats object.
   */
  PLAYER_STATS_CHANGED: 'player-stats-changed',

  /**
   * A direction press from the on-screen D-pad.
   * Emitted by: DPad
   * Subscribed by: GameScene
   * @type {string} Direction constant (UP / DOWN / LEFT / RIGHT).
   */
  DPAD_PRESS: 'dpad-press',

  /**
   * A d-pad direction button has been pressed and is now being held.
   * Emitted by: DPad (pointerdown)
   * Subscribed by: HeldMovementTracker (to enable auto-repeat movement)
   * @type {string} Direction constant (UP / DOWN / LEFT / RIGHT).
   */
  DPAD_HOLD_START: 'dpad-hold-start',

  /**
   * A d-pad direction button has been released (or the pointer left it).
   * Emitted by: DPad (pointerup / pointerout)
   * Subscribed by: HeldMovementTracker (to cancel auto-repeat)
   * @type {string} Direction constant (UP / DOWN / LEFT / RIGHT).
   */
  DPAD_HOLD_END: 'dpad-hold-end',

  /**
   * A d-pad direction button was double-tapped — start a run.
   * Emitted by: DPad (second tap within threshold)
   * Subscribed by: GameScene (_startRun)
   * @type {string} Direction constant (UP / DOWN / LEFT / RIGHT).
   */
  DPAD_RUN: 'dpad-run',

  /**
   * The on-screen mobile menu button (≡) was pressed, or ESC was pressed
   * while the message log is closed.  Closes the message log if it is open;
   * otherwise opens the in-game menu (Achievements / Help).
   * Emitted by: DPad (≡ button)
   * Subscribed by: GameScene
   */
  OPEN_IN_GAME_MENU: 'open-in-game-menu',

  /**
   * Toggle the inventory panel open or closed.
   * Emitted by: DPad (INV button)
   * Subscribed by: GameScene
   */
  TOGGLE_INVENTORY: 'toggle-inventory',

  /**
   * The player wishes to use the stairs at their current position.
   * Emitted by: DPad (▼▼ button)
   * Subscribed by: GameScene
   */
  USE_STAIRS: 'use-stairs',

  /**
   * The active dungeon floor number has changed.
   * Emitted by: FloorManager
   * Subscribed by: GameScene (updates Phaser registry → HUD), AchievementSystem
   * @type {number} The new floor number.
   */
  FLOOR_CHANGED: 'floor-changed',

  /**
   * The player has stepped into a unique room for the first time on this floor.
   * Payload: roomId (string) — the unique room's id from UniqueRoomDefinitions.
   * Emitted by: GameScene (_afterPlayerMove)
   * Subscribed by: AchievementSystem
   */
  UNIQUE_ROOM_ENTERED: 'unique-room-entered',

  /**
   * The player has died and the game is over.
   * Emitted by: GameScene
   * Subscribed by: (external listeners / future game-over screen)
   */
  GAME_OVER: 'game-over',

  /**
   * Request to restart the game after a game-over.
   * Emitted by: (key handler in GameScene after game-over)
   * Subscribed by: GameScene (once, triggers _restart)
   */
  RESTART_GAME: 'restart-game',

  /**
   * An enemy has been killed.
   * Emitted by: GameScene
   * Subscribed by: AchievementSystem
   * @type {string} The enemy type identifier (e.g. 'goblin').
   */
  ENEMY_KILLED: 'enemy-killed',

  /**
   * An achievement has just been unlocked.
   * Emitted by: AchievementSystem
   * Subscribed by: GameScene (message log), UIScene (banner)
   * @type {import('../achievements/AchievementDefinitions.js').AchievementDefinition}
   */
  ACHIEVEMENT_UNLOCKED: 'achievement-unlocked',

  /**
   * An achievement has been reset by the dev toggle.
   * Emitted by: AchievementSystem.lock()
   * Subscribed by: GameScene (removes the associated skill)
   * @type {import('../achievements/AchievementDefinitions.js').AchievementDefinition}
   */
  ACHIEVEMENT_LOCKED: 'achievement-locked',

  /**
   * The message log history panel has been opened or closed.
   * Emitted by: MessageLog (on every toggle)
   * Subscribed by: GameScene (to gate the ESC → Achievements handler)
   * @type {boolean} true = panel just opened, false = panel just closed.
   */
  MESSAGE_LOG_TOGGLED: 'message-log-toggled',

  /**
   * Request to close the message log history panel.
   * Emitted by: GameScene (ESC key, when panel is open)
   * Subscribed by: UIScene → MessageLog.close()
   */
  CLOSE_MESSAGE_LOG: 'close-message-log',

  /**
   * Open (or toggle) the skills panel.
   * Emitted by: GameScene (K key or DPad skills button)
   * Subscribed by: UIScene → SkillsPanel
   * @type {{ skills: object[], forceRefresh?: boolean }} The player's active skills.
   */
  OPEN_SKILLS: 'open-skills',

  /**
   * Toggle the skills panel open or closed.
   * Emitted by: DPad (skills button)
   * Subscribed by: GameScene
   */
  TOGGLE_SKILLS: 'toggle-skills',

  /**
   * Request to upgrade a named skill (dev mode only).
   * Emitted by: SkillsPanel (upgrade button, dev mode)
   * Subscribed by: GameScene (_handleUpgradeSkill)
   * @type {{ skillId: string }}
   */
  UPGRADE_SKILL: 'upgrade-skill',

  /**
   * Request to downgrade a named skill (dev mode only).
   * Emitted by: SkillsPanel (downgrade button, dev mode)
   * Subscribed by: GameScene (_handleDowngradeSkill)
   * @type {{ skillId: string }}
   */
  DOWNGRADE_SKILL: 'downgrade-skill',

  /**
   * Request to activate an inactive skill (dev mode only).
   * Emitted by: SkillsPanel (activate button, dev mode)
   * Subscribed by: GameScene (_handleActivateSkill)
   * @type {{ skillId: string }}
   */
  ACTIVATE_SKILL: 'activate-skill',

  /**
   * The player's gold amount has changed.
   * Emitted by: GameScene (after a sell transaction)
   * Subscribed by: UIScene → HUD
   * @type {number} The new gold total.
   */
  PLAYER_GOLD_CHANGED: 'player-gold-changed',

  /**
   * Open the combined shop panel for a town shop.
   * Emitted by: GameScene (when player bumps a shop door)
   * Subscribed by: UIScene → ShopPanel
   * @type {{ shopType: string, shopStock: Array<{item: Item, buyPrice: number}>, inventory: Item[], player: Player }}
   */
  OPEN_SHOP_PANEL: 'open-shop-panel',

  /**
   * Sell the highlighted item via the active shop.
   * Emitted by: ShopPanel (sell section, on ENTER or tap)
   * Subscribed by: GameScene → _handleSellItem
   * @type {{ shopType: string, item: Item }}
   */
  SELL_ITEM: 'sell-item',

  /**
   * Buy an item from the active shop.
   * Emitted by: ShopPanel (buy section, on ENTER or tap)
   * Subscribed by: GameScene → _handleBuyItem
   * @type {{ shopType: string, shopItem: {item: Item, buyPrice: number} }}
   */
  BUY_ITEM: 'buy-item',

  /**
   * The shop panel has been opened or closed.
   * Emitted by: ShopPanel (show → true, hide → false)
   * Subscribed by: GameScene (to gate the ESC → game-menu handler)
   * @type {boolean} true = panel opened, false = panel closed.
   */
  SELL_PANEL_TOGGLED: 'sell-panel-toggled',

  /**
   * Request to close the shop panel.
   * Emitted by: GameScene (ESC key), ShopPanel (✕ button)
   * Subscribed by: UIScene → ShopPanel.hide()
   */
  CLOSE_SELL_PANEL: 'close-sell-panel',

  /**
   * Open the dialogue panel for an NPC conversation.
   * Emitted by: GameScene (when player bumps an NPC)
   * Subscribed by: UIScene → DialoguePanel.show()
   * @type {{ npcName: string, line: string }}
   */
  OPEN_DIALOGUE: 'open-dialogue',

  /**
   * Close the dialogue panel.
   * Emitted by: GameScene (ESC key while dialogue open), DialoguePanel (✕ or ENTER)
   * Subscribed by: UIScene → DialoguePanel.hide()
   */
  CLOSE_DIALOGUE: 'close-dialogue',

  /**
   * The dialogue panel has been opened or closed.
   * Emitted by: DialoguePanel (show → true, hide → false)
   * Subscribed by: GameScene (to gate ESC handler)
   * @type {boolean}
   */
  DIALOGUE_TOGGLED: 'dialogue-toggled',

  /**
   * Open the display case panel in the player's home.
   * Emitted by: GameScene (when player bumps the home door)
   * Subscribed by: UIScene → DisplayCasePanel.show()
   * @type {{ displayCase: DisplayCase, inventory: Item[], player: Player }}
   */
  OPEN_DISPLAY_CASE: 'open-display-case',

  /**
   * Close the display case panel.
   * Emitted by: GameScene (ESC key while display case open), DisplayCasePanel (✕ button)
   * Subscribed by: UIScene → DisplayCasePanel.hide()
   */
  CLOSE_DISPLAY_CASE: 'close-display-case',

  /**
   * The display case panel has been opened or closed.
   * Emitted by: DisplayCasePanel (show → true, hide → false)
   * Subscribed by: GameScene (to gate ESC handler)
   * @type {boolean}
   */
  DISPLAY_CASE_TOGGLED: 'display-case-toggled',

  /**
   * Store the inventory item at the given index in the display case.
   * Emitted by: DisplayCasePanel (on ENTER / tap in inventory section)
   * Subscribed by: GameScene → _handleStoreItem
   * @type {{ index: number }}
   */
  STORE_ITEM: 'store-item',

  /**
   * Retrieve the display case item at the given index into the player's inventory.
   * Emitted by: DisplayCasePanel (on ENTER / tap in display case section)
   * Subscribed by: GameScene → _handleRetrieveItem
   * @type {{ index: number }}
   */
  RETRIEVE_ITEM: 'retrieve-item',

  /**
   * The display case or inventory contents changed (item stored or retrieved).
   * Emitted by: GameScene (after store/retrieve)
   * Subscribed by: UIScene → DisplayCasePanel.refresh()
   * @type {{ displayCase: DisplayCase, inventory: Item[] }}
   */
  DISPLAY_CASE_CHANGED: 'display-case-changed',

  /**
   * Request to toggle ranged-aim mode on or off.
   * Emitted by: GameScene (R key), DPad (BOW button)
   * Subscribed by: GameScene (_handleToggleRangedAim)
   */
  TOGGLE_RANGED_AIM: 'toggle-ranged-aim',

  /**
   * Ranged-aim mode has changed state.
   * Emitted by: GameScene (when _aimingRanged flips)
   * Subscribed by: DPad (highlights / dims the BOW button)
   * @type {boolean} true = aim mode active, false = aim mode cancelled.
   */
  RANGED_AIM_MODE_CHANGED: 'ranged-aim-mode-changed',

  /**
   * Emitted by: GameScene (_showLookInfoAt)
   * Subscribed by: UIScene → LookPanel.showEnemy()
   * @type {{ name: string, stats: { hp: number, maxHp: number } }}
   */
  LOOK_SHOW_ENEMY: 'look-show-enemy',

  /**
   * Emitted by: GameScene (_showLookInfoAt)
   * Subscribed by: UIScene → LookPanel.showItem()
   * @type {{ name: string, description: string }}
   */
  LOOK_SHOW_ITEM: 'look-show-item',

  /**
   * Emitted by: GameScene (_showLookInfoAt)
   * Subscribed by: UIScene → LookPanel.showTile()
   * @type {number|string} TILE constant or display string
   */
  LOOK_SHOW_TILE: 'look-show-tile',

  /**
   * Emitted by: GameScene (cursor deactivated, player moves, floor changes, etc.)
   * Subscribed by: UIScene → LookPanel.hide()
   */
  LOOK_HIDE: 'look-hide',
};
