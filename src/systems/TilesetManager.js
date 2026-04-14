/**
 * @module TilesetManager
 * Manages the active visual tileset and persists the user's choice.
 */

/** Names of all supported tilesets. */
export const TILESETS = Object.freeze({
  CLASSIC: 'classic',
  MODERN:  'modern',
  HD:      'hd',
});

/** Tile size in pixels for each tileset. */
const TILE_SIZES = {
  [TILESETS.CLASSIC]: 16,
  [TILESETS.MODERN]:  16,
  [TILESETS.HD]:      32,
};

/**
 * Camera zoom factor for each tileset.
 * Classic and Modern use 16×16 tiles at zoom=2 → 32 screen pixels per tile.
 * HD uses 32×32 tiles at zoom=1 → 32 screen pixels per tile (native resolution).
 */
const CAMERA_ZOOMS = {
  [TILESETS.CLASSIC]: 2,
  [TILESETS.MODERN]:  2,
  [TILESETS.HD]:      1,
};

const STORAGE_KEY = 'dungeon_crawler_tileset';

/**
 * Tracks which tileset is active and maps base texture keys to their
 * tileset-prefixed counterparts.  Storage is injected so the class is
 * testable without a browser environment.
 */
export class TilesetManager {
  /**
   * @param {Storage|null} storage - localStorage-compatible storage object.
   */
  constructor(storage = (typeof localStorage !== 'undefined' ? localStorage : null)) {
    this._storage = storage;
  }

  /**
   * Returns the name of the currently active tileset.
   * @returns {'classic'|'modern'|'hd'}
   */
  getTileset() {
    return this._storage?.getItem(STORAGE_KEY) ?? TILESETS.HD;
  }

  /**
   * Sets the active tileset and persists the choice to storage.
   * @param {'classic'|'modern'|'hd'} name
   */
  setTileset(name) {
    this._storage?.setItem(STORAGE_KEY, name);
  }

  /**
   * Returns the tile size in pixels for the active tileset.
   * 16 for Classic and Modern, 32 for HD.
   * @returns {number}
   */
  getTileSize() {
    return TILE_SIZES[this.getTileset()] ?? 16;
  }

  /**
   * Returns the Phaser camera zoom factor for the active tileset.
   * Both Classic and Modern use zoom=2 (16px tiles → 32 screen px per tile).
   * HD uses zoom=1 (32px tiles → 32 screen px per tile, native resolution).
   * @returns {number}
   */
  getCameraZoom() {
    return CAMERA_ZOOMS[this.getTileset()] ?? 2;
  }

  /**
   * Returns the fully-qualified texture key for a base key, prefixed
   * with the active tileset name.
   * @param {string} baseKey - e.g. 'tile_floor'
   * @returns {string} - e.g. 'classic_tile_floor'
   */
  getTileKey(baseKey) {
    return `${this.getTileset()}_${baseKey}`;
  }
}

/** Singleton instance used by the game scenes. */
export const tilesetManager = new TilesetManager();
