/**
 * Tracks which movement direction key is currently held down.
 *
 * Self-registers keydown and keyup listeners on the supplied keyboard emitter
 * so that GameScene does not need to manage held-direction state directly.
 * Clears the held direction automatically when a 'game-over' or
 * 'open-inventory' event fires on the supplied event bus.
 *
 * A direction is only considered "held" after the key has been down for at
 * least `holdThresholdMs` milliseconds (default 150 ms).  This prevents a
 * brief tap from triggering continuous auto-repeat movement: the first
 * keydown always moves the player once (via _handleDir), but _beginPlayerTurn
 * will see getDir() === null and won't repeat unless the key is still held
 * after the threshold.
 *
 * Only one direction is tracked at a time — the most recently pressed key
 * takes precedence, so the player can change direction mid-hold.
 */
import { DIR } from '../utils/Direction.js';

export class HeldMovementTracker {
  /**
   * @param {object} keyboard          - Emitter that fires 'keydown-<KEY>' and 'keyup-<KEY>' events.
   * @param {object} eventBus          - Application event bus; clears direction on 'game-over' / 'open-inventory'.
   * @param {number} [holdThresholdMs=150] - Milliseconds a key must be held before getDir() reports it.
   */
  constructor(keyboard, eventBus, holdThresholdMs = 150) {
    /** @type {string|null} The currently held direction, or null if none. */
    this._dir = null;

    /**
     * Pending hold timers keyed by direction constant.
     * @type {Object.<string, ReturnType<typeof setTimeout>>}
     */
    this._timers = {};

    this._holdThresholdMs = holdThresholdMs;

    // Map each physical key name to a logical direction.
    const keyDirs = [
      ['UP',    DIR.UP],
      ['DOWN',  DIR.DOWN],
      ['LEFT',  DIR.LEFT],
      ['RIGHT', DIR.RIGHT],
      // WASD aliases
      ['W', DIR.UP],
      ['S', DIR.DOWN],
      ['A', DIR.LEFT],
      ['D', DIR.RIGHT],
    ];

    for (const [key, dir] of keyDirs) {
      keyboard.on(`keydown-${key}`, () => {
        // Cancel any pending timers (only one direction held at a time).
        this._cancelAllTimers();
        // Direction is only "held" once the threshold has elapsed.
        this._timers[dir] = setTimeout(() => {
          this._dir = dir;
          delete this._timers[dir];
        }, this._holdThresholdMs);
      });

      keyboard.on(`keyup-${key}`, () => {
        // If released before threshold, cancel the pending timer.
        if (this._timers[dir] !== undefined) {
          clearTimeout(this._timers[dir]);
          delete this._timers[dir];
        }
        // If threshold had already elapsed, clear the held direction.
        if (this._dir === dir) {
          this._dir = null;
        }
      });
    }

    // Clear held direction and any pending timers on game-stopping events.
    eventBus.on('game-over',      () => { this._cancelAllTimers(); this._dir = null; });
    eventBus.on('open-inventory', () => { this._cancelAllTimers(); this._dir = null; });
  }

  /**
   * Returns the currently held direction, or null if no key has been held
   * long enough to pass the threshold.
   *
   * @returns {string|null}
   */
  getDir() {
    return this._dir;
  }

  /**
   * Cancels all pending hold timers without clearing the tracked direction.
   * Used internally when a new key is pressed or a game event fires.
   *
   * @private
   */
  _cancelAllTimers() {
    for (const timer of Object.values(this._timers)) {
      clearTimeout(timer);
    }
    this._timers = {};
  }
}
