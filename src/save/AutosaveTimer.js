/**
 * @module AutosaveTimer
 * @description Fires a save callback at a regular interval while the game is
 * in progress.  The scheduler is injectable so tests can control timing
 * without waiting for real time to pass.
 */

export class AutosaveTimer {
  /**
   * @param {number} intervalMs - Milliseconds between each autosave.
   * @param {function(): void} onSave - Called on each tick.
   * @param {{ schedule: function, cancel: function }} [scheduler]
   *   Defaults to setInterval / clearInterval.
   */
  constructor(intervalMs, onSave, scheduler = {}) {
    this._intervalMs = intervalMs;
    this._onSave     = onSave;
    this._schedule   = scheduler.schedule ?? ((cb, ms) => setInterval(cb, ms));
    this._cancel     = scheduler.cancel   ?? ((id)     => clearInterval(id));
    this._timerId    = null;
  }

  /** Starts the repeating timer.  Does nothing if already running. */
  start() {
    if (this._timerId !== null) return;
    this._timerId = this._schedule(() => this._onSave(), this._intervalMs);
  }

  /** Stops the timer and prevents further saves. */
  stop() {
    if (this._timerId === null) return;
    this._cancel(this._timerId);
    this._timerId = null;
  }
}
