/**
 * @module devCompleteAchievement
 * @description Pure helper used by the dev-mode achievement checkbox.
 *
 * Completing an achievement via the dev toggle must emit ACHIEVEMENT_UNLOCKED
 * just as normal gameplay would, so that any associated skill unlock fires.
 * This function is extracted from AchievementsScene so it can be unit-tested.
 */

import { completeAchievement } from './AchievementStore.js';
import { GameEvents } from '../events/GameEvents.js';

/**
 * Force-completes an achievement and emits ACHIEVEMENT_UNLOCKED.
 *
 * @param {string}   id          - Achievement id to complete.
 * @param {object}   store       - Progress store (injectable).
 * @param {object[]} definitions - Full achievement definitions array.
 * @param {object}   eventBus    - Event bus (injectable).
 */
export function devCompleteAchievement(id, store, definitions, eventBus) {
  completeAchievement(id, store);
  const def = definitions.find(a => a.id === id);
  if (def) eventBus.emit(GameEvents.ACHIEVEMENT_UNLOCKED, def);
}
