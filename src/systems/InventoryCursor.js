/**
 * Tracks the keyboard cursor position within a rectangular inventory grid.
 *
 * Movement stops at grid edges (no wrap-around) so the player always knows
 * exactly where the cursor is. The cursor position is a flat index into the
 * grid: index = row * cols + col.
 *
 * This class is pure logic with no Phaser dependency, making it straightforward
 * to unit-test independently of the rendering layer.
 */
export class InventoryCursor {
  /**
   * @param {number} cols - Number of columns in the inventory grid.
   * @param {number} rows - Number of rows in the inventory grid.
   */
  constructor(cols, rows) {
    this._cols  = cols;
    this._rows  = rows;
    this._index = 0;
  }

  /** @returns {number} The current flat slot index (row * cols + col). */
  get index() {
    return this._index;
  }

  /**
   * Set the cursor directly to a specific slot index.
   * Clamps to [0, cols * rows - 1].
   *
   * @param {number} index
   */
  setIndex(index) {
    const max = this._cols * this._rows - 1;
    this._index = Math.max(0, Math.min(max, index));
  }

  /** Move one column to the right; stops at the last column of the current row. */
  moveRight() {
    if (this._index % this._cols < this._cols - 1) {
      this._index++;
    }
  }

  /** Move one column to the left; stops at the first column of the current row. */
  moveLeft() {
    if (this._index % this._cols > 0) {
      this._index--;
    }
  }

  /** Move one row down; stops at the last row. */
  moveDown() {
    if (this._index + this._cols < this._cols * this._rows) {
      this._index += this._cols;
    }
  }

  /** Move one row up; stops at the first row. */
  moveUp() {
    if (this._index >= this._cols) {
      this._index -= this._cols;
    }
  }

  /** Reset the cursor to slot 0 (top-left corner). */
  reset() {
    this._index = 0;
  }
}
