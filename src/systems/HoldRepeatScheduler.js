/**
 * Schedules a delayed auto-repeat move when a movement key is held.
 *
 * After each player move completes, call `schedule(onRepeat)`. If a movement
 * key is still held when the delay elapses, `onRepeat(dir)` is called with the
 * currently held direction (re-checked at the time the delay fires, so a
 * direction change during the delay is honoured).
 *
 * The scheduler function is injectable so that unit tests can trigger the delay
 * synchronously without needing real timers.
 */
export class HoldRepeatScheduler {
  /**
   * @param {import('./HeldMovementTracker.js').HeldMovementTracker} tracker
   *   Tracks which direction key is currently held.
   * @param {number} delayMs
   *   Time in milliseconds to wait before triggering auto-repeat.
   * @param {function} [schedFn=setTimeout]
   *   Scheduler function with the same signature as `setTimeout`:
   *   `schedFn(callback, delayMs)`.
   */
  constructor(tracker, delayMs, schedFn = setTimeout) {
    this._tracker = tracker;
    this._delayMs = delayMs;
    this._schedFn = schedFn;
  }

  /**
   * If a direction key is currently held, queues `onRepeat` to be called after
   * `delayMs` with whatever direction is held at that point.
   *
   * Does nothing if no key is held when this method is called.
   *
   * @param {function(string): void} onRepeat
   *   Callback invoked with the held direction string if a key is still held
   *   when the delay elapses.
   */
  schedule(onRepeat) {
    if (!this._tracker.getDir()) return;

    this._schedFn(() => {
      const dir = this._tracker.getDir();
      if (dir) onRepeat(dir);
    }, this._delayMs);
  }
}
