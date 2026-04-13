/**
 * @module DisplayCase
 * A display case for storing unique items in the player's home.
 *
 * Only unique items (item.unique === true) may be stored. Items can be
 * retrieved by index and returned to the player's inventory.
 *
 * The DisplayCase is attached to the Player instance so it persists across
 * floor transitions in the same way as player.inventory and player.gold.
 */

export class DisplayCase {
  constructor() {
    /** @type {import('../items/Item.js').Item[]} */
    this._items = [];
  }

  /**
   * Read-only snapshot of the items currently in the display case.
   * @returns {import('../items/Item.js').Item[]}
   */
  get items() {
    return [...this._items];
  }

  /**
   * Store a unique item in the display case.
   *
   * @param {import('../items/Item.js').Item} item
   * @returns {boolean} True if stored successfully; false if the item is not unique.
   */
  store(item) {
    if (!item.unique) return false;
    this._items.push(item);
    return true;
  }

  /**
   * Retrieve the item at the given index, removing it from the display case.
   *
   * @param {number} index - Zero-based index into the display case items.
   * @returns {import('../items/Item.js').Item|null} The item, or null if index is out of bounds.
   */
  retrieve(index) {
    if (index < 0 || index >= this._items.length) return null;
    return this._items.splice(index, 1)[0];
  }
}
