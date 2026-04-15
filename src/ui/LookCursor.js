/**
 * @module LookCursor
 * @description Manages a keyboard-driven look cursor for non-touch devices.
 * Activated with 'l', moved with direction keys, deactivated with ESC or 'l'.
 * Renders a highlighted rectangle on the current tile in world space so it
 * scrolls with the camera.  Does not advance the game turn.
 */
import { FOV_STATE } from '../utils/TileTypes.js';

export class LookCursor {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} dungeonMap - Map with inBounds(x,y) and getFovState(x,y).
   * @param {number} tileSize   - Pixel size of one tile (16 or 32).
   */
  constructor(scene, dungeonMap, tileSize) {
    this.scene     = scene;
    this._map      = dungeonMap;
    this._tileSize = tileSize;
    this.active    = false;
    /** Current cursor position in tile coordinates. */
    this.x         = 0;
    this.y         = 0;
    this._build();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Activates the cursor at the given tile coordinates and shows the graphic.
   * @param {number} x - Tile x.
   * @param {number} y - Tile y.
   */
  activate(x, y) {
    this.x = x;
    this.y = y;
    this.active = true;
    this._redraw();
    this._gfx.setVisible(true);
  }

  /**
   * Moves the cursor by (dx, dy) tiles if the target tile is in bounds and
   * currently visible in the player's FOV.  No-ops otherwise.
   * @param {number} dx
   * @param {number} dy
   */
  move(dx, dy) {
    const nx = this.x + dx;
    const ny = this.y + dy;
    if (!this._map.inBounds(nx, ny)) return;
    if (this._map.getFovState(nx, ny) !== FOV_STATE.VISIBLE) return;
    this.x = nx;
    this.y = ny;
    this._redraw();
  }

  /**
   * Deactivates the cursor and hides the graphic.
   */
  deactivate() {
    this.active = false;
    this._gfx.setVisible(false);
  }

  /**
   * Updates the internal map reference and tile size after a floor change.
   * @param {object} dungeonMap
   * @param {number} tileSize
   */
  updateMap(dungeonMap, tileSize) {
    this._map      = dungeonMap;
    this._tileSize = tileSize;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  /** Creates the Phaser Graphics object used to draw the cursor rectangle. */
  _build() {
    // depth 200 — above map tiles and entities but below UI panels (depth 250+)
    this._gfx = this.scene.add.graphics().setDepth(200).setVisible(false);
  }

  /** Redraws the cursor rectangle at the current tile position. */
  _redraw() {
    const s = this._tileSize;
    this._gfx.clear();
    // Outer bright stroke
    this._gfx.lineStyle(2, 0xffff00, 1);
    this._gfx.strokeRect(this.x * s, this.y * s, s, s);
    // Inner semi-transparent fill to highlight the tile
    this._gfx.fillStyle(0xffff00, 0.15);
    this._gfx.fillRect(this.x * s, this.y * s, s, s);
  }
}
