/**
 * @module GlobalStatsStore
 * @description Singleton store that accumulates player statistics across all
 * save slots and all past runs.  Persisted to localStorage under a dedicated
 * key so it survives save-slot deletion and new-game starts.
 *
 * Tracked: deepest floor reached, kills per enemy type, consumables used per
 * item id, walls broken, total gold gained, total gold spent, and a kill count
 * per unique boss type.
 */

/** localStorage key for global stats. */
const STORAGE_KEY = 'global_stats';

/** Storage backend — defaults to localStorage when available. */
let _storage = typeof localStorage !== 'undefined' ? localStorage : null;

/** In-memory store, hydrated by {@link loadGlobalStats}. */
let _stats = _defaultStats();

/**
 * Returns a fresh zeroed-out stats object.
 * @returns {object}
 */
function _defaultStats() {
  return {
    deepestFloor: 1,
    kills: {},
    consumablesUsed: {},
    wallsBroken: 0,
    goldGained: 0,
    goldSpent: 0,
    bossKillCounts: {},
  };
}

/**
 * Writes the current in-memory store to the storage backend.
 */
function _persist() {
  if (_storage) {
    _storage.setItem(STORAGE_KEY, JSON.stringify(_stats));
  }
}

/**
 * Replaces the storage backend.  Inject a fake object in tests.
 * @param {{ getItem: Function, setItem: Function, removeItem: Function }|null} storage
 */
export function setGlobalStorage(storage) {
  _storage = storage;
}

/**
 * Loads previously persisted global stats from storage into the in-memory
 * store.  Safe to call on startup even when no data has been saved yet.
 */
export function loadGlobalStats() {
  if (!_storage) return;
  const raw = _storage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    _stats.deepestFloor        = saved.deepestFloor        ?? 1;
    _stats.kills               = saved.kills               ?? {};
    _stats.consumablesUsed     = saved.consumablesUsed     ?? {};
    _stats.wallsBroken         = saved.wallsBroken         ?? 0;
    _stats.goldGained      = saved.goldGained      ?? 0;
    _stats.goldSpent       = saved.goldSpent       ?? 0;
    _stats.bossKillCounts  = saved.bossKillCounts  ?? {};
  } catch {
    // Corrupt entry — leave defaults in place.
  }
}

/**
 * Returns a read-only snapshot of the current global stats.
 * @returns {object}
 */
export function getGlobalStats() {
  return {
    ..._stats,
    kills:              { ..._stats.kills },
    consumablesUsed:    { ..._stats.consumablesUsed },
    bossKillCounts: { ..._stats.bossKillCounts },
  };
}

/**
 * Discards the in-memory store and replaces it with defaults, without
 * touching the persisted copy.  Used to simulate a page reload in tests.
 */
export function clearGlobalStatsMemory() {
  _stats = _defaultStats();
}

/**
 * Resets the in-memory store to defaults AND clears the persisted copy.
 * Used in tests after each scenario to prevent state bleed.
 */
export function resetGlobalStats() {
  _stats = _defaultStats();
  if (_storage) _storage.removeItem(STORAGE_KEY);
}

/**
 * Updates the deepest floor if `floor` exceeds the current record.
 * @param {number} floor
 */
export function recordGlobalFloorReached(floor) {
  if (floor > _stats.deepestFloor) {
    _stats.deepestFloor = floor;
    _persist();
  }
}

/**
 * Increments the kill count for the given enemy type.
 * @param {string} type
 */
export function recordGlobalKill(type) {
  _stats.kills[type] = (_stats.kills[type] ?? 0) + 1;
  _persist();
}

/**
 * Increments the kill count for the given boss type.  The normal kill counter
 * for the type must be incremented separately via {@link recordGlobalKill}.
 * @param {string} type
 */
export function recordGlobalBossKill(type) {
  _stats.bossKillCounts[type] = (_stats.bossKillCounts[type] ?? 0) + 1;
  _persist();
}

/**
 * Increments the usage count for the given consumable item id.
 * @param {string} id
 */
export function recordGlobalConsumableUsed(id) {
  _stats.consumablesUsed[id] = (_stats.consumablesUsed[id] ?? 0) + 1;
  _persist();
}

/**
 * Increments the walls-broken counter by one.
 */
export function recordGlobalWallBroken() {
  _stats.wallsBroken += 1;
  _persist();
}

/**
 * Adds to the total gold gained.
 * @param {number} amount
 */
export function recordGlobalGoldGained(amount) {
  _stats.goldGained += amount;
  _persist();
}

/**
 * Adds to the total gold spent.
 * @param {number} amount
 */
export function recordGlobalGoldSpent(amount) {
  _stats.goldSpent += amount;
  _persist();
}
