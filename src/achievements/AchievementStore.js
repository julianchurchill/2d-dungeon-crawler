/**
 * @module AchievementStore
 * @description Singleton store that holds progress and completion state for
 * every achievement.  State is keyed by achievement id.
 *
 * The store is a plain object so it can be imported anywhere without
 * circular dependencies, and its functions accept the store as an optional
 * parameter for test injection.
 */

/**
 * @typedef {object} AchievementProgress
 * @property {number}  count     - How many times the tracked event has fired.
 * @property {boolean} completed - Whether the achievement has been unlocked.
 */

/**
 * The default singleton store.  Import this in production code.
 * Inject a plain object `{}` in tests to keep scenarios isolated.
 *
 * @type {Object.<string, AchievementProgress>}
 */
export const achievementStore = {};

/**
 * Resets all progress.  Call between game runs or in test teardown.
 *
 * @param {Object.<string, AchievementProgress>} [store=achievementStore]
 */
export function resetAchievementStore(store = achievementStore) {
  for (const key of Object.keys(store)) {
    delete store[key];
  }
}

/**
 * Returns the current progress entry for an achievement, initialising it
 * to zero if it has not been seen before.
 *
 * @param {string} id
 * @param {Object.<string, AchievementProgress>} [store=achievementStore]
 * @returns {AchievementProgress}
 */
export function getProgress(id, store = achievementStore) {
  if (!store[id]) store[id] = { count: 0, completed: false };
  return store[id];
}

/**
 * Increments the count for an achievement by the given amount.
 *
 * @param {string} id
 * @param {number} [amount=1]
 * @param {Object.<string, AchievementProgress>} [store=achievementStore]
 */
export function incrementProgress(id, amount = 1, store = achievementStore) {
  getProgress(id, store).count += amount;
}

/**
 * Marks an achievement as completed.
 *
 * @param {string} id
 * @param {Object.<string, AchievementProgress>} [store=achievementStore]
 */
export function completeAchievement(id, store = achievementStore) {
  getProgress(id, store).completed = true;
}
