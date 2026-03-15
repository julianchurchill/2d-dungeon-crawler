/**
 * @module DoubleTapDetector
 * @description Detects whether two successive taps on the same direction occur
 * within a configurable time threshold.  The time source is injectable so that
 * unit tests can control time without real timers.
 */
export class DoubleTapDetector {
  /**
   * @param {number} thresholdMs - Maximum milliseconds between taps to count as a double-tap.
   * @param {function(): number} [nowFn] - Returns the current timestamp in ms. Defaults to Date.now.
   */
  constructor(thresholdMs, nowFn = () => Date.now()) {
    this._thresholdMs = thresholdMs;
    this._nowFn = nowFn;
    /** @type {string|null} Direction of the last tap. */
    this._lastDir = null;
    /** @type {number} Timestamp of the last tap. */
    this._lastTime = 0;
  }

  /**
   * Record a tap in the given direction and return whether it constitutes a
   * double-tap (same direction as the previous tap, within the threshold).
   *
   * @param {string} dir - A DIR constant (e.g. DIR.UP).
   * @returns {boolean} True if this tap and the previous tap form a double-tap.
   */
  tap(dir) {
    const now = this._nowFn();
    const isDouble = dir === this._lastDir && (now - this._lastTime) < this._thresholdMs;
    this._lastDir = dir;
    this._lastTime = now;
    return isDouble;
  }
}
