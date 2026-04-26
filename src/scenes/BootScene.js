import Phaser from 'phaser';
import { createClassicEntityTextures, createClassicItemTextures, createClassicTileTextures, createClassicUniqueRoomTileTextures } from './ClassicTextures.js';
import { createModernEntityTextures, createModernItemTextures, createModernTileTextures, createModernUniqueRoomTileTextures } from './ModernTextures.js';
import { createHdEntityTextures, createHdItemTextures, createHdTileTextures, createHdUniqueRoomTileTextures } from './HdTextures.js';

/**
 * BootScene is the first scene to run.  It generates all procedural textures
 * for both tilesets (classic and modern) and then transitions to the main menu.
 *
 * All textures are generated with a tileset prefix so the TilesetManager can
 * look them up at render time:
 *   classic_tile_floor / modern_tile_floor
 *   classic_entity_goblin / modern_entity_goblin
 *   classic_item_weapon / modern_item_weapon  etc.
 *
 * Only the UI heart texture is shared (no prefix needed).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const genTextureFn = (key, w, h, drawFn) => { this._genTextureWithGfx(key, w, h, drawFn, this._gfx()) };
    createClassicTileTextures(genTextureFn);
    createModernTileTextures(genTextureFn);
    createHdTileTextures(genTextureFn);
    createClassicUniqueRoomTileTextures(genTextureFn);
    createModernUniqueRoomTileTextures(genTextureFn);
    createHdUniqueRoomTileTextures(genTextureFn);
    createClassicEntityTextures(genTextureFn);
    createModernEntityTextures(genTextureFn);
    createHdEntityTextures(genTextureFn);
    createClassicItemTextures(genTextureFn);
    createModernItemTextures(genTextureFn);
    createHdItemTextures(genTextureFn);
    this._createUITextures();
    this.scene.start('MainMenuScene');
  }

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  /** @returns {Phaser.GameObjects.Graphics} off-screen graphics context */
  _gfx() {
    return this.make.graphics({ x: 0, y: 0, add: false });
  }

  /**
   * Generates a texture from a drawing function.
   * @param {string} key - Texture cache key.
   * @param {number} w - Width in pixels.
   * @param {number} h - Height in pixels.
   * @param {function(Phaser.GameObjects.Graphics):void} drawFn
   */
  _genTexture(key, w, h, drawFn) {
    const g = this._gfx();
    this._genTextureWithGfx(key, w, h, drawFn, g);
  }

  /**
   * Generates a texture from a drawing function.
   * @param {string} key - Texture cache key.
   * @param {number} w - Width in pixels.
   * @param {number} h - Height in pixels.
   * @param {function(Phaser.GameObjects.Graphics):void} drawFn
   * @param {Phaser.GameObjects.Graphics} gfx
   */
  _genTextureWithGfx(key, w, h, drawFn, gfx) {
    const g = gfx;
    drawFn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ---------------------------------------------------------------------------
  // UI textures (shared between tilesets — no prefix)
  // ---------------------------------------------------------------------------

  /** Generates HUD / UI textures. */
  _createUITextures() {
    // Heart icon for HP display
    this._genTexture('ui_heart', 10, 9, (g) => {
      g.fillStyle(0xdd2222);
      g.fillRect(1, 2, 3, 3);
      g.fillRect(6, 2, 3, 3);
      g.fillRect(0, 3, 10, 3);
      g.fillRect(2, 6, 6, 2);
      g.fillRect(4, 8, 2, 1);
    });
  }
}