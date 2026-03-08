/**
 * @module AchievementSystem
 * @description Evaluates achievement conditions and returns newly-completed
 * achievements so callers can react (e.g. emit events, show banners).
 *
 * All dependencies (definitions and store) are injectable so the system can
 * be exercised in unit tests without side effects on the singleton store.
 */

import { ACHIEVEMENTS } from './AchievementDefinitions.js';
import {
  getProgress,
  incrementProgress,
  completeAchievement,
  achievementStore,
} from './AchievementStore.js';

export class AchievementSystem {
  /**
   * @param {import('./AchievementDefinitions.js').AchievementDefinition[]} [definitions]
   * @param {object} [store] - Injectable progress store (defaults to singleton).
   */
  constructor(definitions = ACHIEVEMENTS, store = achievementStore) {
    this.definitions = definitions;
    this.store = store;
  }

  /**
   * Called when an enemy is killed.  Increments progress for any kill-type
   * achievement that matches the enemy type, then checks for completion.
   *
   * @param {string} enemyType - The type identifier of the killed enemy.
   * @returns {import('./AchievementDefinitions.js').AchievementDefinition[]}
   *   Achievements newly completed by this kill (empty if none).
   */
  onEnemyKilled(enemyType) {
    return this._checkConditions((def) => {
      const { type, enemyType: target } = def.condition;
      return type === 'kill_type' && target === enemyType;
    });
  }

  /**
   * Called when the player descends to a new dungeon floor.
   *
   * @param {number} floor - The floor number now being entered.
   * @returns {import('./AchievementDefinitions.js').AchievementDefinition[]}
   */
  onFloorReached(floor) {
    return this._checkConditions((def) => {
      return def.condition.type === 'floor_reached' && floor >= def.condition.target;
    });
  }

  /**
   * Called when the player levels up.
   *
   * @param {number} level - The new character level.
   * @returns {import('./AchievementDefinitions.js').AchievementDefinition[]}
   */
  onPlayerLevelUp(level) {
    return this._checkConditions((def) => {
      return def.condition.type === 'player_level' && level >= def.condition.target;
    });
  }

  /**
   * Returns a human-readable progress string for an achievement.
   * Count-based achievements include "(N unit so far)" while incomplete.
   *
   * @param {import('./AchievementDefinitions.js').AchievementDefinition} def
   * @returns {string} e.g. "Goblin Killer - Kill 10 goblins (4 killed so far)"
   */
  formatProgress(def) {
    const { count, completed } = getProgress(def.id, this.store);
    const base = `${def.name} - ${def.description}`;
    if (!completed && def.progressUnit !== undefined && def.condition.target !== undefined) {
      return `${base} (${count} ${def.progressUnit} so far)`;
    }
    return base;
  }

  // ── Private ─────────────────────────────────────────────────────────────

  /**
   * Evaluates all definitions where `predicate` returns true, increments
   * their count, and completes any that have now reached their target.
   *
   * @param {function} predicate
   * @returns {import('./AchievementDefinitions.js').AchievementDefinition[]}
   */
  _checkConditions(predicate) {
    const newlyCompleted = [];
    for (const def of this.definitions) {
      const progress = getProgress(def.id, this.store);
      if (progress.completed) continue;
      if (!predicate(def)) continue;

      if (def.condition.type === 'kill_type') {
        // Count-based: accumulate kills and unlock when the target is reached.
        incrementProgress(def.id, 1, this.store);
        if (progress.count >= def.condition.target) {
          completeAchievement(def.id, this.store);
          newlyCompleted.push(def);
        }
      } else {
        // Threshold-based (floor_reached, player_level): predicate matching
        // is sufficient — complete immediately without counting.
        completeAchievement(def.id, this.store);
        newlyCompleted.push(def);
      }
    }
    return newlyCompleted;
  }
}
