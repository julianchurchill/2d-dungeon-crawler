/**
 * Tracks which movement direction key is currently held down.
 *
 * A direction is "held" from the moment a key is pressed until the matching
 * key is released. Only one direction is tracked at a time — the most recently
 * pressed key takes precedence, so the player can change direction mid-hold.
 *
 * GameScene uses this to automatically repeat movement each turn while a key
 * remains held, giving the feel of continuous movement in turn-based play.
 */
export class HeldMovementTracker {
  constructor() {
    /** @type {string|null} The currently held direction, or null if none. */
    this._dir = null;
  }

  /**
   * Record that a direction key has been pressed.
   * Replaces any previously held direction.
   *
   * @param {string} dir - One of the DIR constants (e.g. DIR.UP).
   */
  press(dir) {
    this._dir = dir;
  }

  /**
   * Record that a direction key has been released.
   * Only clears the held direction if it matches the released key,
   * so releasing a non-active key has no effect.
   *
   * @param {string} dir - The direction key that was released.
   */
  release(dir) {
    if (this._dir === dir) {
      this._dir = null;
    }
  }

  /**
   * Returns the currently held direction, or null if no key is held.
   *
   * @returns {string|null}
   */
  getDir() {
    return this._dir;
  }

  /**
   * Clears the held direction unconditionally.
   * Call this when movement should stop regardless of key state
   * (e.g. when the inventory opens or the game ends).
   */
  clear() {
    this._dir = null;
  }
}
