/**
 * @module TilesetManager
 * Manages the active visual tileset and persists the user's choice.
 */

/** Names of all supported tilesets. */
export const TILESETS = Object.freeze({ CLASSIC: 'classic', MODERN: 'modern' });

const STORAGE_KEY = 'dungeon_crawler_tileset';

/**
 * Tracks which tileset is active and maps base texture keys to their
 * tileset-prefixed counterparts.  Storage is injected so the class is
 * testable without a browser environment.
 */
export class TilesetManager {
  /**
   * @param {Storage|null} storage - localStorage-compatible storage object.
   *   Pass null or omit to disable persistence (useful in tests).
   */
  constructor(storage = (typeof localStorage !== 'undefined' ? localStorage : null)) {
    this._storage = storage;
  }

  /**
   * Returns the name of the currently active tileset.
   * @returns {'classic'|'modern'}
   */
  getTileset() {
    return this._storage?.getItem(STORAGE_KEY) ?? TILESETS.CLASSIC;
  }

  /**
   * Sets the active tileset and persists the choice to storage.
   * @param {'classic'|'modern'} name
   */
  setTileset(name) {
    this._storage?.setItem(STORAGE_KEY, name);
  }

  /**
   * Returns the fully-qualified texture key for a base tile key, prefixed
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
