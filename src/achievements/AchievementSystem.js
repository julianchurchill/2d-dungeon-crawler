/**
 * @module AchievementSystem
 * @description Evaluates achievement conditions in response to game events and
 * emits ACHIEVEMENT_UNLOCKED when an achievement is completed.
 *
 * Integrates with the EventBus by subscribing to ENEMY_KILLED, PLAYER_LEVEL_UP,
 * and FLOOR_CHANGED.  All dependencies (definitions, store, eventBus) are
 * injectable so the system can be exercised in unit tests without side effects
 * on the singleton store or bus.
 */

import { ACHIEVEMENTS } from './AchievementDefinitions.js';
import {
  getProgress,
  incrementProgress,
  setProgressIfHigher,
  completeAchievement,
  achievementStore,
} from './AchievementStore.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';

export class AchievementSystem {
  /**
   * @param {import('./AchievementDefinitions.js').AchievementDefinition[]} [definitions]
   * @param {object} [store]    - Injectable progress store (defaults to singleton).
   * @param {object} [eventBus] - Injectable event bus (defaults to shared EventBus).
   */
  constructor(definitions = ACHIEVEMENTS, store = achievementStore, eventBus = EventBus) {
    this.definitions = definitions;
    this.store = store;
    this.eventBus = eventBus;

    // Store handler references so they can be removed by destroy().
    this._onEnemyKilled    = (enemyType) => this._handleEnemyKilled(enemyType);
    this._onPlayerLevelUp  = (level)     => this._handlePlayerLevelUp(level);
    this._onFloorChanged   = (floor)     => this._handleFloorReached(floor);

    // Subscribe to game events so the system updates itself automatically.
    this.eventBus.on(GameEvents.ENEMY_KILLED,    this._onEnemyKilled);
    this.eventBus.on(GameEvents.PLAYER_LEVEL_UP, this._onPlayerLevelUp);
    this.eventBus.on(GameEvents.FLOOR_CHANGED,   this._onFloorChanged);
  }

  /**
   * Returns the full display list for the achievements screen.
   * Each entry contains the achievement id, whether it is completed, and
   * a formatted text string suitable for rendering in the UI.
   *
   * @returns {Array<{id: string, name: string, completed: boolean, text: string}>}
   */
  getDisplayList() {
    return this.definitions.map(def => {
      const { completed } = getProgress(def.id, this.store);
      const entry = {
        id:        def.id,
        name:      def.name,
        completed,
        text:      this.formatProgress(def),
      };
      // Only include unlocks when the definition declares one.
      if (def.unlocks !== undefined) entry.unlocks = def.unlocks;
      return entry;
    });
  }

  /**
   * Returns a human-readable progress string for an achievement.
   * While incomplete, includes "(N unit so far)" to show progress toward the
   * target.  All achievements are count-based so progressUnit is always present.
   *
   * @param {import('./AchievementDefinitions.js').AchievementDefinition} def
   * @returns {string} e.g. "Goblin Killer - Kill 10 goblins (4 killed so far)"
   */
  formatProgress(def) {
    const { count, completed } = getProgress(def.id, this.store);
    const base = `${def.name} - ${def.description}`;
    if (!completed) {
      return `${base} (${count} ${def.progressUnit} so far)`;
    }
    return base;
  }

  /**
   * Removes all EventBus subscriptions.  Call when the owning scene is stopped
   * to prevent stale listeners accumulating across game restarts.
   */
  destroy() {
    this.eventBus.off(GameEvents.ENEMY_KILLED,    this._onEnemyKilled);
    this.eventBus.off(GameEvents.PLAYER_LEVEL_UP, this._onPlayerLevelUp);
    this.eventBus.off(GameEvents.FLOOR_CHANGED,   this._onFloorChanged);
  }

  // ── Private event handlers ───────────────────────────────────────────────

  /**
   * Handles ENEMY_KILLED events.  Increments the kill count for any kill-type
   * achievement matching the enemy type and completes it if the target is met.
   *
   * @param {string} enemyType - Type identifier of the killed enemy.
   */
  _handleEnemyKilled(enemyType) {
    for (const def of this.definitions) {
      if (def.condition.type !== 'kill_type') continue;
      if (def.condition.enemyType !== enemyType) continue;

      const progress = getProgress(def.id, this.store);
      if (progress.completed) continue;

      // Accumulate kills; unlock when the total reaches the target.
      incrementProgress(def.id, 1, this.store);
      if (progress.count >= def.condition.target) {
        this._unlock(def);
      }
    }
  }

  /**
   * Handles FLOOR_CHANGED events.  Updates the highest-floor-reached counter
   * and completes any floor_reached achievement whose target is now met.
   *
   * @param {number} floor - The floor number just entered.
   */
  _handleFloorReached(floor) {
    for (const def of this.definitions) {
      if (def.condition.type !== 'floor_reached') continue;

      const progress = getProgress(def.id, this.store);
      if (progress.completed) continue;

      // Track the highest floor reached rather than a simple increment.
      setProgressIfHigher(def.id, floor, this.store);
      if (progress.count >= def.condition.target) {
        this._unlock(def);
      }
    }
  }

  /**
   * Handles PLAYER_LEVEL_UP events.  Updates the highest-level counter and
   * completes any player_level achievement whose target is now met.
   *
   * @param {number} level - The new character level.
   */
  _handlePlayerLevelUp(level) {
    for (const def of this.definitions) {
      if (def.condition.type !== 'player_level') continue;

      const progress = getProgress(def.id, this.store);
      if (progress.completed) continue;

      setProgressIfHigher(def.id, level, this.store);
      if (progress.count >= def.condition.target) {
        this._unlock(def);
      }
    }
  }

  /**
   * Marks an achievement as complete and notifies listeners.
   *
   * @param {import('./AchievementDefinitions.js').AchievementDefinition} def
   */
  _unlock(def) {
    completeAchievement(def.id, this.store);
    this.eventBus.emit(GameEvents.ACHIEVEMENT_UNLOCKED, def);
  }
}
