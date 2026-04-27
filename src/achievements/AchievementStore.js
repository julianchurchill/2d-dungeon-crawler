/**
 * @module AchievementStore
 * @description Singleton store that holds progress and completion state for
 * every achievement.  State is keyed by achievement id.
 *
 * The store is a plain object so it can be imported anywhere without
 * circular dependencies, and its functions accept the store as an optional
 * parameter for test injection.
 *
 * Progress is automatically persisted to localStorage (or an injected storage
 * backend) so it survives page refreshes during a run.  Call
 * `resetAchievementStore()` at the start of each new game to wipe both the
 * in-memory store and the persisted copy.
 */

/** localStorage key used to persist achievement data. */
const STORAGE_KEY = 'achievements';

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

/** Storage backend — defaults to localStorage when available. */
let _storage = typeof localStorage !== 'undefined' ? localStorage : null;

/**
 * Replaces the storage backend used for persistence.  Inject a fake storage
 * object in tests so they never touch the real localStorage.
 *
 * @param {{ getItem: Function, setItem: Function, removeItem: Function }|null} storage
 */
export function setStorage(storage) {
  _storage = storage;
}

/**
 * Serialises `store` and writes it to the current storage backend.
 *
 * @param {Object.<string, AchievementProgress>} store
 */
function _persist(store) {
  if (_storage) {
    _storage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}

/**
 * Loads previously persisted achievement data from storage into `store`.
 * Merges the stored state on top of any existing entries.
 *
 * @param {Object.<string, AchievementProgress>} [store=achievementStore]
 */
export function loadAchievementStore(store = achievementStore) {
  if (!_storage) return;
  const raw = _storage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    for (const [id, progress] of Object.entries(saved)) {
      store[id] = progress;
    }
  } catch {
    // Corrupt storage entry — ignore and start fresh.
  }
}

/**
 * Resets all progress and clears the persisted copy in storage.
 * Call at the start of each new game run.
 *
 * @param {Object.<string, AchievementProgress>} [store=achievementStore]
 */
export function resetAchievementStore(store = achievementStore) {
  for (const key of Object.keys(store)) {
    delete store[key];
  }
  if (_storage) {
    _storage.removeItem(STORAGE_KEY);
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
 * Increments the count for an achievement by the given amount and persists.
 *
 * @param {string} id
 * @param {number} [amount=1]
 * @param {Object.<string, AchievementProgress>} [store=achievementStore]
 */
export function incrementProgress(id, amount = 1, store = achievementStore) {
  getProgress(id, store).count += amount;
  _persist(store);
}

/**
 * Sets the count for an achievement to `value` only if `value` is greater
 * than the current count.  Used for achievements where the metric is a
 * monotonically-increasing number (e.g. floor reached, player level) rather
 * than an accumulating total.
 *
 * @param {string} id
 * @param {number} value
 * @param {Object.<string, AchievementProgress>} [store=achievementStore]
 */
export function setProgressIfHigher(id, value, store = achievementStore) {
  const progress = getProgress(id, store);
  if (value > progress.count) {
    progress.count = value;
    _persist(store);
  }
}

/**
 * Marks an achievement as completed and persists.
 *
 * @param {string} id
 * @param {Object.<string, AchievementProgress>} [store=achievementStore]
 */
export function completeAchievement(id, store = achievementStore) {
  getProgress(id, store).completed = true;
  _persist(store);
}

/**
 * Resets an achievement to its initial uncompleted state, clearing both the
 * completed flag and the progress count.  Used by the dev-mode toggle so
 * developers can re-test achievement unlock flows without restarting the game.
 *
 * @param {string} id
 * @param {Object.<string, AchievementProgress>} [store=achievementStore]
 */
export function uncompleteAchievement(id, store = achievementStore) {
  if (store[id]) {
    store[id].count = 0;
    store[id].completed = false;
    _persist(store);
  }
}
