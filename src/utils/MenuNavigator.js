/**
 * @module MenuNavigator
 * @description Pure JS helper that tracks keyboard focus within a fixed-length
 * list of menu items.  Wraps at both ends so navigation is cyclic.
 * Contains no Phaser dependency — each menu scene wires it to key events
 * and updates the visual focus indicator itself.
 */

export class MenuNavigator {
  /**
   * @param {number} count - Number of items in the menu (must be ≥ 1).
   */
  constructor(count) {
    this._count = count;
    this._index = 0;
  }

  /** @returns {number} The index of the currently focused item. */
  get focusedIndex() {
    return this._index;
  }

  /**
   * Move focus to the next item, wrapping from the last to the first.
   */
  next() {
    this._index = (this._index + 1) % this._count;
  }

  /**
   * Move focus to the previous item, wrapping from the first to the last.
   */
  prev() {
    this._index = (this._index - 1 + this._count) % this._count;
  }
}
