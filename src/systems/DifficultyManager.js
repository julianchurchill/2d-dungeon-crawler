/**
 * @module DifficultyManager
 * @description Manages the player's chosen difficulty level and exposes
 * per-difficulty multipliers for enemy count, HP, and ATK.
 *
 * The choice is persisted to localStorage so it survives page reloads.
 * The module exports a singleton `difficultyManager` for use in game systems
 * and a named class for injection in tests.
 */

const STORAGE_KEY = 'dungeon_difficulty';

/** @enum {string} */
export const DIFFICULTIES = Object.freeze({
  EASY:   'easy',
  NORMAL: 'normal',
  HARD:   'hard',
});

/**
 * Per-difficulty multiplier configuration.
 * @type {Record<string, {enemyCount: number, enemyHp: number, enemyAtk: number}>}
 */
const DIFFICULTY_CONFIG = {
  [DIFFICULTIES.EASY]:   { enemyCount: 0.67, enemyHp: 0.75, enemyAtk: 0.75 },
  [DIFFICULTIES.NORMAL]: { enemyCount: 1.0,  enemyHp: 1.0,  enemyAtk: 1.0  },
  [DIFFICULTIES.HARD]:   { enemyCount: 1.5,  enemyHp: 1.5,  enemyAtk: 1.5  },
};

export class DifficultyManager {
  /**
   * @param {Storage|null} storage - localStorage-compatible object, or null to
   *   use in-memory state only (useful in tests).
   */
  constructor(storage = (typeof localStorage !== 'undefined' ? localStorage : null)) {
    this._storage = storage;
    /** @type {string} In-memory fallback when storage is null. */
    this._value = DIFFICULTIES.NORMAL;
  }

  /**
   * Returns the currently selected difficulty level.
   * @returns {'easy'|'normal'|'hard'}
   */
  getDifficulty() {
    return this._storage?.getItem(STORAGE_KEY) ?? this._value;
  }

  /**
   * Persists the chosen difficulty.
   * @param {'easy'|'normal'|'hard'} level
   */
  setDifficulty(level) {
    this._value = level;
    this._storage?.setItem(STORAGE_KEY, level);
  }

  /**
   * Returns the multiplier config for the current difficulty.
   * @returns {{enemyCount: number, enemyHp: number, enemyAtk: number}}
   */
  getConfig() {
    return DIFFICULTY_CONFIG[this.getDifficulty()] ?? DIFFICULTY_CONFIG[DIFFICULTIES.NORMAL];
  }
}

/** Singleton instance used by the game at runtime. */
export const difficultyManager = new DifficultyManager();
