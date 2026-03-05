/**
 * @module RunMovementController
 * @description Manages the "run" movement mode, where the player auto-moves
 * one tile per turn in a fixed direction until a stop condition is met.
 *
 * Stop conditions (evaluated each turn before the next step):
 *  - The next tile in the run direction is blocked or occupied by an entity.
 *  - Any enemy or item is currently visible in the field of view.
 *
 * This class has no dependency on Phaser or GameScene — all context is
 * provided by the caller as plain arguments, making it fully unit-testable.
 */
export class RunMovementController {
  constructor() {
    /** @type {string|null} Active run direction (DIR constant) or null if not running. */
    this._dir = null;
  }

  /**
   * Begin a run in the given direction.
   * Calling start() while a run is already active replaces the direction.
   *
   * @param {string} dir - A DIR constant (e.g. DIR.UP).
   */
  start(dir) {
    this._dir = dir;
  }

  /**
   * Cancel the active run unconditionally.
   * Safe to call when no run is in progress.
   */
  cancel() {
    this._dir = null;
  }

  /**
   * Returns true while a run is in progress.
   *
   * @returns {boolean}
   */
  isRunning() {
    return this._dir !== null;
  }

  /**
   * Returns the active run direction, or null if no run is in progress.
   *
   * @returns {string|null}
   */
  getDir() {
    return this._dir;
  }

  /**
   * Evaluates whether the run should continue and returns the direction to
   * move, or null if the run has been stopped.
   *
   * The run stops (and this._dir is cleared) when:
   *  - nextTileIsBlocked is true — wall or entity occupies the next tile.
   *  - anyEntityVisible is true — an enemy or item is in the player's FOV.
   *
   * @param {boolean} nextTileIsBlocked - True if the next tile cannot be entered.
   * @param {boolean} anyEntityVisible  - True if any enemy or item is currently visible.
   * @returns {string|null} The direction to move, or null to stop.
   */
  nextDir(nextTileIsBlocked, anyEntityVisible) {
    if (!this._dir) return null;

    if (nextTileIsBlocked || anyEntityVisible) {
      this._dir = null;
      return null;
    }

    return this._dir;
  }
}
