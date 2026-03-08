/**
 * @module MessageHistory
 * @description Pure-data store for the in-game message log.
 * Holds a capped chronological list of all messages received during a session
 * and provides a windowed slice for the scrollable history panel.
 * Has no Phaser dependency so it can be unit-tested directly.
 */

/** Maximum number of messages retained in memory. */
const MAX_HISTORY = 200;

export class MessageHistory {
  constructor() {
    /** @type {string[]} All messages in chronological order (oldest first). */
    this.messages = [];
  }

  /**
   * Appends a new message to the history, evicting the oldest entry when the
   * cap is reached.
   *
   * @param {string} text - The message to add.
   */
  add(text) {
    this.messages.push(text);
    if (this.messages.length > MAX_HISTORY) this.messages.shift();
  }

  /**
   * Returns a copy of all stored messages in chronological order.
   *
   * @returns {string[]}
   */
  getAll() {
    return [...this.messages];
  }

  /**
   * Returns the total number of stored messages.
   *
   * @returns {number}
   */
  getCount() {
    return this.messages.length;
  }

  /**
   * Returns a window of messages for the history panel.
   *
   * `scrollOffset = 0` returns the newest `windowSize` messages.
   * `scrollOffset = N` scrolls back N positions so the window ends at
   * `messages[total - N]`.  The result is clamped so it never reads outside
   * the stored array.
   *
   * @param {number} scrollOffset - How many positions from the newest message
   *   the window end is shifted back.
   * @param {number} windowSize   - Number of messages to return.
   * @returns {string[]}
   */
  getWindow(scrollOffset, windowSize) {
    const total = this.messages.length;
    // Shift the window end back by scrollOffset from the newest entry.
    // Clamp so the window always fills from the oldest available message when
    // the offset is larger than what the history contains.
    const rawEndIdx = total - scrollOffset;
    const endIdx    = Math.max(Math.min(windowSize, total), rawEndIdx);
    const startIdx  = Math.max(0, endIdx - windowSize);
    return this.messages.slice(startIdx, endIdx);
  }
}
