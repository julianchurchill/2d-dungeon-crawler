/**
 * Tracks which movement direction key is currently held down.
 *
 * Self-registers keydown and keyup listeners on the supplied keyboard emitter
 * so that GameScene does not need to manage held-direction state directly.
 * Clears the held direction automatically when a 'game-over' or
 * 'open-inventory' event fires on the supplied event bus.
 *
 * Only one direction is tracked at a time — the most recently pressed key
 * takes precedence, so the player can change direction mid-hold.
 *
 * Note: the direction is recorded immediately on keydown.  Tap-prevention
 * (ensuring a brief press does not trigger auto-repeat movement) is handled
 * by GameScene._beginPlayerTurn(), which defers its check so that keyup has a
 * chance to clear the direction before the next move is considered.
 */
import { DIR } from '../utils/Direction.js';

export class HeldMovementTracker {
  /**
   * @param {object} keyboard  - Emitter that fires 'keydown-<KEY>' and 'keyup-<KEY>' events.
   * @param {object} eventBus  - Application event bus; clears direction on 'game-over' / 'open-inventory'.
   */
  constructor(keyboard, eventBus) {
    /** @type {string|null} The currently held direction, or null if none. */
    this._dir = null;

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
      // Pressing any direction key immediately records it as the held direction.
      keyboard.on(`keydown-${key}`, () => { this._dir = dir; });
      // Releasing a key clears the direction only if it is the currently held one.
      keyboard.on(`keyup-${key}`,   () => { if (this._dir === dir) this._dir = null; });
    }

    // Clear held direction whenever game-stopping events occur.
    eventBus.on('game-over',      () => { this._dir = null; });
    eventBus.on('open-inventory', () => { this._dir = null; });
  }

  /**
   * Returns the currently held direction, or null if no key is held.
   *
   * @returns {string|null}
   */
  getDir() {
    return this._dir;
  }
}
