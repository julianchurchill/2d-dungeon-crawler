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
   * The on-screen mobile menu button (≡) was pressed.
   * Acts as a mobile ESC equivalent: closes the message log if open,
   * otherwise opens the Achievements screen.
   * Emitted by: DPad (≡ button)
   * Subscribed by: GameScene
   */
  OPEN_ACHIEVEMENTS: 'open-achievements',

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
};
