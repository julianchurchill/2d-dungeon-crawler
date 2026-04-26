import Phaser from 'phaser';
import { createClassicEntityTextures, createClassicItemTextures, createClassicTileTextures } from './ClassicTextures.js';

const T = 16; // tile size in pixels

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
    createClassicTileTextures((key, w, h, drawFn) => { this._genTextureWithGfx(key, w, h, drawFn, this._gfx()) });
    this._createModernTileTextures();
    this._createHdTileTextures();
    this._createUniqueRoomTileTextures();
    createClassicEntityTextures((key, w, h, drawFn) => { this._genTextureWithGfx(key, w, h, drawFn, this._gfx()) });
    this._createModernEntityTextures();
    this._createHdEntityTextures();
    createClassicItemTextures((key, w, h, drawFn) => { this._genTextureWithGfx(key, w, h, drawFn, this._gfx()) });
    this._createModernItemTextures();
    this._createHdItemTextures();
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
    this._genTextureExternal(key, w, h, drawFn, g);
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
  // Modern tileset  (prefix: 'modern_')
  //
  // Higher-contrast palette with crisper brick lines and richer colours —
  // contemporary indie roguelike aesthetic.
  // ---------------------------------------------------------------------------

  /** Generates all modern_ prefixed tile textures. */
  _createModernTileTextures() {
    // Dungeon floor — dark teal-slate with a 2×2 stone block grid
    this._genTexture('modern_tile_floor', T, T, (g) => {
      // Mortar background
      g.fillStyle(0x141820);
      g.fillRect(0, 0, T, T);
      // Stone blocks (offset row pattern): top row
      g.fillStyle(0x252a38);
      g.fillRect(1, 1, 6, 6);
      g.fillRect(9, 1, 6, 6);
      // Bottom row (half-brick offset)
      g.fillRect(5, 9, 6, 6);
      g.fillRect(0, 9, 4, 6);
      g.fillRect(12, 9, 3, 6);
      // Subtle highlight on block top edges
      g.fillStyle(0x303545, 0.8);
      g.fillRect(1, 1, 6, 1);
      g.fillRect(9, 1, 6, 1);
      g.fillRect(5, 9, 6, 1);
    });

    // Dungeon wall — slate-blue brick with strong bevel and mortar
    this._genTexture('modern_tile_wall', T, T, (g) => {
      // Stone base
      g.fillStyle(0x304050);
      g.fillRect(0, 0, T, T);
      // Brick courses (mortar lines)
      g.fillStyle(0x1a2530);
      g.fillRect(0, 5, T, 1);
      g.fillRect(0, 11, T, 1);
      // Brick vertical joints (alternating rows)
      g.fillRect(8, 0, 1, 5);
      g.fillRect(4, 6, 1, 5);
      g.fillRect(11, 6, 1, 5);
      g.fillRect(8, 12, 1, 4);
      // Top highlight — bright edge catch
      g.fillStyle(0x6070a0);
      g.fillRect(0, 0, T, 1);
      g.fillRect(0, 0, 1, 5);
      g.fillRect(0, 6, 1, 5);
      g.fillRect(0, 12, 1, 4);
      // Bottom shadow
      g.fillStyle(0x0e1520);
      g.fillRect(0, T - 1, T, 1);
      g.fillRect(T - 1, 0, 1, T);
    });

    // Door — dark mahogany with ornate gold handle
    this._genTexture('modern_tile_door', T, T, (g) => {
      // Door frame — very dark brown
      g.fillStyle(0x3a1e08);
      g.fillRect(0, 0, T, T);
      // Door face — rich mahogany
      g.fillStyle(0x8a4c20);
      g.fillRect(2, 1, T - 4, T - 2);
      // Upper panel
      g.fillStyle(0x6a3a18);
      g.fillRect(3, 2, T - 6, 5);
      // Lower panel
      g.fillRect(3, 9, T - 6, 5);
      // Gold handle surround
      g.fillStyle(0xffd060);
      g.fillRect(T - 5, T / 2 - 2, 3, 4);
      // Handle knob
      g.fillStyle(0xffe890);
      g.fillRect(T - 4, T / 2 - 1, 2, 2);
      // Panel bead highlight
      g.fillStyle(0xb06030, 0.7);
      g.fillRect(3, 2, 1, 5);
      g.fillRect(3, 9, 1, 5);
    });

    // Dungeon stairs down — dark teal base with bright green-tinted steps
    this._genTexture('modern_tile_stairs', T, T, (g) => {
      g.fillStyle(0x141820);
      g.fillRect(0, 0, T, T);
      // Steps — brightest at top (nearest the viewer)
      const stepColors = [0x70c870, 0x50a050, 0x387038, 0x285028];
      for (let i = 0; i < 4; i++) {
        g.fillStyle(stepColors[i]);
        g.fillRect(2 + i * 2, 3 + i * 3, T - 4 - i * 4, 1); // tread highlight
        g.fillStyle(0x0e1520);
        g.fillRect(2 + i * 2, 4 + i * 3, T - 4 - i * 4, 2); // riser shadow
      }
      // Down arrow accent
      g.fillStyle(0x70c870);
      g.fillRect(7, 13, 2, 2);
    });

    // Dungeon stairs up — dark teal base with bright blue steps
    this._genTexture('modern_tile_stairs_up', T, T, (g) => {
      g.fillStyle(0x141820);
      g.fillRect(0, 0, T, T);
      const stepColors = [0x60a8e0, 0x4080b8, 0x285890, 0x183868];
      for (let i = 0; i < 4; i++) {
        g.fillStyle(stepColors[i]);
        g.fillRect(2 + i * 2, 3 + (3 - i) * 3, T - 4 - i * 4, 1);
        g.fillStyle(0x0e1520);
        g.fillRect(2 + i * 2, 4 + (3 - i) * 3, T - 4 - i * 4, 2);
      }
      g.fillStyle(0x60a8e0);
      g.fillRect(7, 2, 2, 2);
    });

    // Town floor — warm sandstone with clear offset cobblestone joints
    this._genTexture('modern_tile_town_floor', T, T, (g) => {
      // Mortar
      g.fillStyle(0x5a4432);
      g.fillRect(0, 0, T, T);
      // Stone slabs — two rows with offset
      g.fillStyle(0xa88a68);
      g.fillRect(1, 1, 7, 6);  // top-left stone
      g.fillRect(10, 1, 5, 6); // top-right stone
      g.fillRect(1, 9, 5, 6);  // bottom-left stone
      g.fillRect(8, 9, 7, 6);  // bottom-right stone
      // Surface highlights (warm)
      g.fillStyle(0xc0a07a, 0.7);
      g.fillRect(1, 1, 7, 1);
      g.fillRect(10, 1, 5, 1);
      g.fillRect(1, 9, 5, 1);
      g.fillRect(8, 9, 7, 1);
      // Surface shadow at base of each slab
      g.fillStyle(0x8a6a4a, 0.6);
      g.fillRect(1, 6, 7, 1);
      g.fillRect(10, 6, 5, 1);
    });

    // Town wall — cream limestone blocks with clear mortar
    this._genTexture('modern_tile_town_wall', T, T, (g) => {
      // Mortar
      g.fillStyle(0x7a6848);
      g.fillRect(0, 0, T, T);
      // Stone blocks
      g.fillStyle(0xcabca0);
      g.fillRect(1, 1, 7, 4);
      g.fillRect(10, 1, 5, 4);
      g.fillRect(1, 7, 4, 4);
      g.fillRect(7, 7, 8, 4);
      g.fillRect(1, 13, 6, 2);
      g.fillRect(9, 13, 6, 2);
      // Block highlights (top edge — light catches limestone)
      g.fillStyle(0xe8d8bc);
      g.fillRect(1, 1, 7, 1);
      g.fillRect(10, 1, 5, 1);
      g.fillRect(1, 7, 4, 1);
      g.fillRect(7, 7, 8, 1);
      // Block shadow (bottom edge)
      g.fillStyle(0xa89878);
      g.fillRect(1, 4, 7, 1);
      g.fillRect(10, 4, 5, 1);
    });

    // Town stairs down — warm limestone steps
    this._genTexture('modern_tile_town_stairs', T, T, (g) => {
      g.fillStyle(0x8a7050);
      g.fillRect(0, 0, T, T);
      const stepHighlights = [0xe8c890, 0xc8a870, 0xa88850, 0x886840];
      for (let i = 0; i < 4; i++) {
        g.fillStyle(stepHighlights[i]);
        g.fillRect(2 + i * 2, 3 + i * 3, T - 4 - i * 4, 1);
        g.fillStyle(0x5a4030);
        g.fillRect(2 + i * 2, 4 + i * 3, T - 4 - i * 4, 2);
      }
      g.fillStyle(0xe8c890);
      g.fillRect(7, 13, 2, 2);
    });

    // Shop roof — dark mahogany planks with prominent grain
    this._genTexture('modern_tile_shop_roof', T, T, (g) => {
      g.fillStyle(0x281408);
      g.fillRect(0, 0, T, T);
      // Wide planks
      g.fillStyle(0x4a2810);
      g.fillRect(0, 0, T, 4);
      g.fillRect(0, 6, T, 4);
      g.fillRect(0, 12, T, 4);
      // Plank grain highlight
      g.fillStyle(0x603818, 0.8);
      g.fillRect(0, 1, T, 1);
      g.fillRect(0, 7, T, 1);
      g.fillRect(0, 13, T, 1);
      // Gap / shadow between planks
      g.fillStyle(0x180c04);
      g.fillRect(0, 4, T, 2);
      g.fillRect(0, 10, T, 2);
      // Knots
      g.fillStyle(0x381808, 0.8);
      g.fillEllipse(5, 2, 3, 2);
      g.fillEllipse(12, 8, 3, 2);
    });

    // Town accent — polished pale limestone with subtle veining
    this._genTexture('modern_tile_town_accent', T, T, (g) => {
      // Mortar (lighter than regular town floor)
      g.fillStyle(0x9a8868);
      g.fillRect(0, 0, T, T);
      // Polished slabs — warmer and lighter
      g.fillStyle(0xd8c8a8);
      g.fillRect(1, 1, 7, 6);
      g.fillRect(10, 1, 5, 6);
      g.fillRect(1, 9, 5, 6);
      g.fillRect(8, 9, 7, 6);
      // Top-edge specular (polished stone catches light strongly)
      g.fillStyle(0xf0e0c0);
      g.fillRect(1, 1, 7, 1);
      g.fillRect(10, 1, 5, 1);
      g.fillRect(1, 9, 5, 1);
      g.fillRect(8, 9, 7, 1);
      // Vein lines
      g.fillStyle(0xc0a888, 0.5);
      g.fillRect(3, 3, 3, 1);
      g.fillRect(11, 4, 2, 1);
      g.fillRect(2, 11, 2, 1);
    });

    // Potion shop door — mahogany with flask icon
    this._genTexture('modern_tile_door_potion', T, T, (g) => {
      this._drawModernDoorBase(g);
      // Flask body
      g.fillStyle(0xee3366);
      g.fillEllipse(T / 2, 9, 5, 5);
      // Neck
      g.fillStyle(0x992244);
      g.fillRect(T / 2 - 1, 4, 2, 4);
      // Cork
      g.fillStyle(0xffcc77);
      g.fillRect(T / 2 - 1, 3, 2, 2);
      // Shine
      g.fillStyle(0xff99bb, 0.7);
      g.fillRect(T / 2 - 2, 8, 1, 2);
    });

    // Weapon shop door — mahogany with sword icon
    this._genTexture('modern_tile_door_weapon', T, T, (g) => {
      this._drawModernDoorBase(g);
      // Blade
      g.fillStyle(0xeeeeff);
      g.fillRect(T / 2 - 1, 2, 2, 8);
      // Guard
      g.fillStyle(0xffd060);
      g.fillRect(T / 2 - 3, 10, 6, 2);
      // Handle
      g.fillStyle(0x9a5028);
      g.fillRect(T / 2 - 1, 12, 2, 3);
      // Blade shine
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(T / 2, 2, 1, 7);
    });

    // Armour shop door — mahogany with shield icon
    this._genTexture('modern_tile_door_armour', T, T, (g) => {
      this._drawModernDoorBase(g);
      // Shield body
      g.fillStyle(0x5080b0);
      g.fillRect(T / 2 - 3, 3, 6, 5);
      g.fillTriangle(T / 2 - 3, 8, T / 2 + 3, 8, T / 2, 12);
      // Shield highlight
      g.fillStyle(0x80b0e0, 0.6);
      g.fillRect(T / 2 - 2, 3, 4, 2);
      // Emblem
      g.fillStyle(0xffd060);
      g.fillRect(T / 2 - 1, 4, 2, 4);
      g.fillRect(T / 2 - 2, 6, 4, 2);
    });

    // Home door — rich oak with ornate gold house icon
    this._genTexture('modern_tile_home_door', T, T, (g) => {
      // Frame — very dark oak
      g.fillStyle(0x281408);
      g.fillRect(0, 0, T, T);
      // Door face — rich warm oak
      g.fillStyle(0x9a5a20);
      g.fillRect(2, 1, T - 4, T - 2);
      // Door panels
      g.fillStyle(0x7a4418);
      g.fillRect(3, 2, T - 6, 5);
      g.fillRect(3, 9, T - 6, 5);
      // Panel highlights
      g.fillStyle(0xc07838, 0.6);
      g.fillRect(3, 2, 1, 5);
      g.fillRect(3, 9, 1, 5);
      // House icon — bright gold
      g.fillStyle(0xffd060);
      g.fillTriangle(T / 2, 3, T / 2 - 4, 7, T / 2 + 4, 7); // roof
      g.fillRect(T / 2 - 3, 7, 6, 5);                          // walls
      // Door handle
      g.fillStyle(0xffe890);
      g.fillRect(T - 4, T / 2 + 1, 2, 2);
    });
  }

  /**
   * Draws the modern door base (frame + face + panels) onto a graphics context.
   * Extracted to avoid repeating the base code in each shop door generator.
   * @param {Phaser.GameObjects.Graphics} g
   */
  _drawModernDoorBase(g) {
    // Frame
    g.fillStyle(0x3a1e08);
    g.fillRect(0, 0, T, T);
    // Face
    g.fillStyle(0x8a4c20);
    g.fillRect(2, 1, T - 4, T - 2);
    // Panels
    g.fillStyle(0x6a3a18);
    g.fillRect(3, 2, T - 6, 5);
    g.fillRect(3, 9, T - 6, 5);
    // Panel bead highlight
    g.fillStyle(0xb06030, 0.7);
    g.fillRect(3, 2, 1, 5);
    g.fillRect(3, 9, 1, 5);
  }

  // ---------------------------------------------------------------------------
  // Modern entity textures  (prefix: 'modern_')
  //
  // Higher-saturation colours with crisper pixel silhouettes and stronger
  // contrast between foreground and background elements.
  // ---------------------------------------------------------------------------

  /** Generates modern_ prefixed entity sprite textures. */
  _createModernEntityTextures() {
    // Player — vivid electric-blue diamond with sharper facets
    this._genTexture('modern_entity_player', T, T, (g) => {
      // Outer outline (dark border 1px)
      g.fillStyle(0x002266);
      g.fillTriangle(T/2, 0, T-1, T/2, T/2, T);
      g.fillTriangle(T/2, 0, 1, T/2, T/2, T);
      // Main body — vivid cyan-blue
      g.fillStyle(0x22aaff);
      g.fillTriangle(T/2, 2, T-3, T/2, T/2, T-2);
      g.fillTriangle(T/2, 2, 3, T/2, T/2, T-2);
      // Highlight facet (top-left)
      g.fillStyle(0x88ddff, 0.8);
      g.fillTriangle(T/2, 2, 3, T/2, T/2, T/2);
      // Bright eye
      g.fillStyle(0xffffff);
      g.fillRect(T/2 - 1, T/2 - 2, 2, 2);
      g.fillStyle(0x0044aa);
      g.fillRect(T/2, T/2 - 2, 1, 1);
    });

    // Cockroach — dark chitinous brown with visible segmented legs
    this._genTexture('modern_entity_cockroach', T, T, (g) => {
      // Dark outline
      g.fillStyle(0x220800);
      g.fillRect(4, 2, 8, 12);
      // Body segments
      g.fillStyle(0x5a2e10);
      g.fillRect(5, 3, 6, 10);
      // Shell highlight
      g.fillStyle(0x8a5028, 0.8);
      g.fillRect(6, 3, 3, 4);
      // Eyes
      g.fillStyle(0xff4400);
      g.fillRect(5, 4, 1, 1);
      g.fillRect(10, 4, 1, 1);
      // Legs — 3 per side as single-pixel marks
      g.fillStyle(0x3a1a08);
      g.fillRect(3, 5, 2, 1);  g.fillRect(11, 5, 2, 1);
      g.fillRect(3, 8, 2, 1);  g.fillRect(11, 8, 2, 1);
      g.fillRect(3,11, 2, 1);  g.fillRect(11,11, 2, 1);
      // Antennae
      g.fillRect(5, 2, 1, 2);
      g.fillRect(10, 2, 1, 2);
    });

    // Sprite — star-bright fairy with vivid white-gold glow
    this._genTexture('modern_entity_sprite', T, T, (g) => {
      // Wing glow (light blue)
      g.fillStyle(0x88ccff, 0.5);
      g.fillRect(1, 4, 4, 8);
      g.fillRect(11, 4, 4, 8);
      // Wing outline (brighter edge)
      g.fillStyle(0xbbddff, 0.8);
      g.fillRect(2, 5, 2, 6);
      g.fillRect(12, 5, 2, 6);
      // Body
      g.fillStyle(0x5588cc);
      g.fillRect(6, 6, 4, 6);
      // Head
      g.fillStyle(0x88aaee);
      g.fillRect(5, 2, 6, 5);
      // Bright halo
      g.fillStyle(0xffffff);
      g.fillRect(7, 1, 2, 2);
      // Eyes
      g.fillStyle(0x220044);
      g.fillRect(6, 3, 1, 1);
      g.fillRect(9, 3, 1, 1);
    });

    // Goblin — vivid lime green with clear head/torso, yellow slit pupils
    this._genTexture('modern_entity_goblin', T, T, (g) => {
      // Outline
      g.fillStyle(0x114411);
      g.fillRect(3, 3, 10, 12);
      // Body
      g.fillStyle(0x44cc44);
      g.fillRect(4, 7, 8, 7);
      // Head
      g.fillStyle(0x55dd55);
      g.fillRect(4, 3, 8, 5);
      // Ear nubs
      g.fillStyle(0x338833);
      g.fillRect(3, 4, 1, 2);
      g.fillRect(12, 4, 1, 2);
      // Eyes — bright yellow slit pupils
      g.fillStyle(0xffff00);
      g.fillRect(5, 4, 2, 2);
      g.fillRect(9, 4, 2, 2);
      g.fillStyle(0x221100);
      g.fillRect(6, 4, 1, 2);
      g.fillRect(10, 4, 1, 2);
      // Mouth
      g.fillStyle(0x221100);
      g.fillRect(5, 7, 6, 1);
    });

    // Orc — muscular red-brown bruiser with prominent tusks
    this._genTexture('modern_entity_orc', T, T, (g) => {
      // Outline
      g.fillStyle(0x440000);
      g.fillRect(2, 2, 12, 13);
      // Body
      g.fillStyle(0xaa2222);
      g.fillRect(3, 7, 10, 8);
      // Head
      g.fillStyle(0xcc3333);
      g.fillRect(3, 2, 10, 6);
      // Helmet ridge
      g.fillStyle(0x552222);
      g.fillRect(3, 2, 10, 1);
      // Glowing yellow eyes
      g.fillStyle(0xffee00);
      g.fillRect(5, 3, 3, 2);
      g.fillRect(9, 3, 3, 2);
      g.fillStyle(0x330000);
      g.fillRect(6, 3, 1, 2);
      g.fillRect(10, 3, 1, 2);
      // Tusks — cream/white protruding from lower jaw
      g.fillStyle(0xeeeedd);
      g.fillRect(5, 8, 2, 4);
      g.fillRect(9, 8, 2, 4);
      // Body shadow
      g.fillStyle(0x881818, 0.6);
      g.fillRect(3, 13, 10, 2);
    });

    // Troll — towering stone-grey mass filling most of the tile
    this._genTexture('modern_entity_troll', T, T, (g) => {
      // Outline
      g.fillStyle(0x0a0a0a);
      g.fillRect(1, 0, 14, 15);
      // Rocky body (charcoal with brown hints)
      g.fillStyle(0x282020);
      g.fillRect(2, 4, 12, 11);
      // Head — slightly lighter
      g.fillStyle(0x332828);
      g.fillRect(2, 0, 12, 5);
      // Horns
      g.fillStyle(0x553333);
      g.fillRect(3, 0, 2, 4);
      g.fillRect(11, 0, 2, 4);
      // Blazing orange eyes
      g.fillStyle(0xff6600);
      g.fillRect(5, 1, 3, 2);
      g.fillRect(9, 1, 3, 2);
      g.fillStyle(0xffaa00, 0.7);
      g.fillRect(6, 1, 1, 1);
      g.fillRect(10, 1, 1, 1);
      // Knuckle highlight (bottom of body)
      g.fillStyle(0x443838, 0.8);
      g.fillRect(2, 13, 12, 2);
    });

    // Skeleton — crisply drawn bone figure with stark white on black
    this._genTexture('modern_entity_skeleton', T, T, (g) => {
      // Dark background silhouette
      g.fillStyle(0x111111);
      g.fillRect(5, 0, 6, 16);
      g.fillRect(4, 6, 8, 8);
      // Skull — bright white
      g.fillStyle(0xeeeeee);
      g.fillRect(5, 1, 6, 5);
      // Skull jaw line
      g.fillStyle(0xaaaaaa);
      g.fillRect(5, 5, 6, 1);
      // Eye sockets — vivid red glow
      g.fillStyle(0xff2222);
      g.fillRect(6, 2, 2, 2);
      g.fillRect(9, 2, 2, 2);
      // Ribcage — alternating white / gap
      g.fillStyle(0xcccccc);
      g.fillRect(5, 6, 6, 1);
      g.fillRect(5, 8, 6, 1);
      g.fillRect(5, 10, 6, 1);
      // Spine
      g.fillStyle(0xaaaaaa);
      g.fillRect(7, 6, 2, 7);
      // Legs
      g.fillStyle(0xbbbbbb);
      g.fillRect(5, 13, 2, 3);
      g.fillRect(9, 13, 2, 3);
    });

    // Skeleton Warrior — armoured skeleton with bold metal highlights
    this._genTexture('modern_entity_skeleton_warrior', T, T, (g) => {
      // Dark silhouette
      g.fillStyle(0x111111);
      g.fillRect(4, 0, 8, 16);
      g.fillRect(3, 6, 10, 8);
      // Armour plate — cool grey steel
      g.fillStyle(0xaaaaaa);
      g.fillRect(4, 6, 8, 7);
      // Armour highlight band
      g.fillStyle(0xdddddd);
      g.fillRect(5, 7, 6, 2);
      // Helmet
      g.fillStyle(0x888888);
      g.fillRect(4, 0, 8, 3);
      // Skull face
      g.fillStyle(0xeeeeee);
      g.fillRect(5, 2, 6, 4);
      // Jaw
      g.fillStyle(0xaaaaaa);
      g.fillRect(5, 5, 6, 1);
      // Eyes — vivid red
      g.fillStyle(0xff2222);
      g.fillRect(6, 3, 2, 2);
      g.fillRect(9, 3, 2, 2);
      // Leg bones
      g.fillStyle(0xbbbbbb);
      g.fillRect(4, 13, 3, 3);
      g.fillRect(9, 13, 3, 3);
    });

    // Skeleton Mage — robed skeleton with vivid arcane glow
    this._genTexture('modern_entity_skeleton_mage', T, T, (g) => {
      // Dark silhouette
      g.fillStyle(0x110022);
      g.fillRect(4, 0, 8, 16);
      g.fillRect(3, 6, 10, 10);
      // Robe — rich purple
      g.fillStyle(0x8833cc);
      g.fillRect(4, 6, 8, 10);
      // Robe shading
      g.fillStyle(0x551199);
      g.fillRect(5, 11, 6, 5);
      // Skull
      g.fillStyle(0xeeeeee);
      g.fillRect(5, 1, 6, 5);
      // Jaw
      g.fillStyle(0xaaaaaa);
      g.fillRect(5, 5, 6, 1);
      // Eyes — vivid arcane purple
      g.fillStyle(0xdd44ff);
      g.fillRect(6, 2, 2, 2);
      g.fillRect(9, 2, 2, 2);
      // Staff
      g.fillStyle(0x664400);
      g.fillRect(13, 2, 2, 11);
      // Orb
      g.fillStyle(0xdd44ff);
      g.fillRect(12, 0, 4, 4);
      g.fillStyle(0xffffff);
      g.fillRect(13, 1, 2, 2);
    });

    // Old Bones — imposing ivory boss with strong silhouette and crown
    this._genTexture('modern_entity_old_bones', T, T, (g) => {
      // Dark outline / shadow
      g.fillStyle(0x111100);
      g.fillRect(2, 0, 12, 16);
      // Torso — rich warm ivory
      g.fillStyle(0xf0eed8);
      g.fillRect(3, 6, 10, 8);
      // Detailed ribcage (alternating bands)
      g.fillStyle(0xd0cebc);
      g.fillRect(3, 7, 10, 1);
      g.fillRect(3, 9, 10, 1);
      g.fillRect(3, 11, 10, 1);
      // Spine channel
      g.fillStyle(0xa0a090);
      g.fillRect(7, 6, 2, 8);
      // Skull — creamy bone
      g.fillStyle(0xf8f6e8);
      g.fillRect(3, 0, 10, 7);
      // Crown spikes
      g.fillStyle(0xe8e6d8);
      g.fillRect(3, 0, 2, 3);
      g.fillRect(7, 0, 2, 2);
      g.fillRect(11, 0, 2, 3);
      // Burning amber eye sockets
      g.fillStyle(0xff9900);
      g.fillRect(4, 2, 3, 2);
      g.fillRect(9, 2, 3, 2);
      g.fillStyle(0xffdd44, 0.8);
      g.fillRect(5, 2, 1, 1);
      g.fillRect(10, 2, 1, 1);
      // Leg bones
      g.fillStyle(0xe8e6d8);
      g.fillRect(3, 14, 4, 2);
      g.fillRect(9, 14, 4, 2);
    });

    // Creeping Mass — toxic electric-green ooze blob
    this._genTexture('modern_entity_creeping_mass', T, T, (g) => {
      // Outer dark shell
      g.fillStyle(0x082808);
      g.fillRect(1, 1, 14, 14);
      // Outer ooze layer
      g.fillStyle(0x1a5a1a);
      g.fillRect(2, 2, 12, 12);
      // Mid layer — brighter
      g.fillStyle(0x2a9a2a);
      g.fillRect(4, 4, 8, 8);
      // Toxic core — vivid electric green
      g.fillStyle(0x44ff44);
      g.fillRect(6, 6, 4, 4);
      g.fillStyle(0x88ff88, 0.7);
      g.fillRect(7, 7, 2, 2);
      // Dark nucleus spots
      g.fillStyle(0x041204);
      g.fillRect(5, 5, 2, 2);
      g.fillRect(9, 9, 2, 2);
      // Drip tendrils
      g.fillStyle(0x1a5a1a);
      g.fillRect(4, 14, 2, 2);
      g.fillRect(10, 14, 2, 2);
      g.fillRect(1, 7, 1, 3);
      g.fillRect(14, 7, 1, 3);
    });

    // Spitter — acid-green blob with glowing toxic core and spit gland
    this._genTexture('modern_entity_spitter', T, T, (g) => {
      // Dark outer shell
      g.fillStyle(0x1a3300);
      g.fillRect(2, 3, 12, 10);
      // Acid-green body
      g.fillStyle(0x66aa11);
      g.fillRect(3, 4, 10, 8);
      // Toxic inner core
      g.fillStyle(0xaadd22);
      g.fillRect(4, 5, 6, 6);
      // Spit gland — bright neon protrusion
      g.fillStyle(0xddff00);
      g.fillRect(11, 6, 3, 4);
      g.fillStyle(0xeeff88, 0.8);
      g.fillRect(12, 7, 2, 2);
      // Eyes — toxic glow
      g.fillStyle(0xffff00);
      g.fillRect(4, 5, 2, 2);
      g.fillRect(8, 5, 2, 2);
      // Acid drips
      g.fillStyle(0x66aa11);
      g.fillRect(4, 12, 2, 2);
      g.fillRect(10, 12, 2, 2);
    });

    // Elder — vivid white-gold robes with ornate staff
    this._genTexture('modern_entity_npc_elder', T, T, (g) => {
      // Robe outline
      g.fillStyle(0x888877);
      g.fillRect(2, T/2 - 1, 12, 9);
      // Robe — bright white
      g.fillStyle(0xf0f0e8);
      g.fillRect(3, T/2, 10, 8);
      g.fillTriangle(T/2, T - 1, 3, T/2, 13, T/2);
      // Robe accent (gold trim)
      g.fillStyle(0xddbb44);
      g.fillRect(3, T/2, 10, 1);
      // Body / arms
      g.fillStyle(0xe0e0d8);
      g.fillRect(T/2 - 2, T/2 - 3, 4, 5);
      // Head
      g.fillStyle(0xffddbf);
      g.fillEllipse(T/2, T/2 - 5, 6, 6);
      // White beard
      g.fillStyle(0xffffff);
      g.fillTriangle(T/2 - 2, T/2 - 2, T/2 + 2, T/2 - 2, T/2, T/2 + 2);
      // Gold staff
      g.fillStyle(0xddaa22);
      g.fillRect(T/2 + 4, 0, 2, T - 1);
      // Staff orb
      g.fillStyle(0x88ddff);
      g.fillRect(T/2 + 3, 0, 4, 3);
    });

    // Guard — polished steel armour with bright visor
    this._genTexture('modern_entity_npc_guard', T, T, (g) => {
      // Armour outline
      g.fillStyle(0x223344);
      g.fillRect(3, T/2 - 8, 10, 15);
      // Plate armour body — blue-steel
      g.fillStyle(0x7090b0);
      g.fillRect(4, T/2, 8, 7);
      // Helmet
      g.fillStyle(0x5a7898);
      g.fillRect(3, T/2 - 7, 10, 8);
      // Helmet crest
      g.fillStyle(0xff3300);
      g.fillRect(6, T/2 - 8, 4, 2);
      // Visor slit — bright cyan
      g.fillStyle(0x00eeff);
      g.fillRect(4, T/2 - 4, 8, 2);
      // Armour chest plate highlight
      g.fillStyle(0x90b0d0, 0.8);
      g.fillRect(5, T/2, 3, 4);
      // Steel spear handle
      g.fillStyle(0xaabbcc);
      g.fillRect(T - 3, 0, 2, T);
      // Spear tip — bright silver
      g.fillStyle(0xeeeeff);
      g.fillTriangle(T - 2, 0, T, 0, T - 1, 5);
    });

    // Merchant — rich emerald cloak with prominent gold coin bag
    this._genTexture('modern_entity_npc_merchant', T, T, (g) => {
      // Cloak outline
      g.fillStyle(0x112211);
      g.fillRect(3, T/2 - 8, 10, 15);
      // Deep emerald cloak body
      g.fillStyle(0x22aa44);
      g.fillRect(3, T/2 - 1, 10, 8);
      // Hood
      g.fillStyle(0x117733);
      g.fillRect(3, T/2 - 7, 10, 7);
      // Hood shadow
      g.fillStyle(0x0a4422);
      g.fillRect(3, T/2 - 7, 10, 1);
      // Face
      g.fillStyle(0xffddbb);
      g.fillEllipse(T/2, T/2 - 3, 6, 6);
      // Smile
      g.fillStyle(0x884422);
      g.fillRect(T/2 - 1, T/2 - 1, 3, 1);
      // Gold coin bag — vivid amber circle
      g.fillStyle(0x332200);
      g.fillEllipse(T/2 + 4, T - 3, 8, 8);
      g.fillStyle(0xffbb00);
      g.fillEllipse(T/2 + 4, T - 4, 6, 6);
      // Coin shine
      g.fillStyle(0xffee88, 0.8);
      g.fillRect(T/2 + 2, T - 6, 2, 2);
    });

    // Warrior — Martel the Varangian: horned helm, chain mail, broad axe (vivid)
    this._genTexture('modern_entity_npc_warrior', T, T, (g) => {
      // Body outline
      g.fillStyle(0x3a2208);
      g.fillRect(3, T/2 - 1, 10, 8);
      // Tunic — rich amber leather
      g.fillStyle(0x9a6c3a);
      g.fillRect(4, T/2, 8, 7);
      // Chain mail — steel-blue links
      g.fillStyle(0x445577);
      g.fillRect(4, T/2, 8, 3);
      // Mail highlight
      g.fillStyle(0x6688aa, 0.6);
      g.fillRect(4, T/2, 4, 1);
      // Face — warm weathered skin
      g.fillStyle(0xcc9966);
      g.fillEllipse(T/2, T/2 - 2, 8, 7);
      // Eyes — dark, weary
      g.fillStyle(0x332211);
      g.fillRect(T/2 - 2, T/2 - 4, 2, 1);
      g.fillRect(T/2 + 1, T/2 - 4, 2, 1);
      // Beard — steel grey
      g.fillStyle(0xbbbbcc);
      g.fillTriangle(T/2 - 3, T/2, T/2 + 3, T/2, T/2, T/2 + 5);
      // Helmet — blue-black iron
      g.fillStyle(0x223344);
      g.fillRect(3, T/2 - 7, 10, 4);
      // Helmet rim highlight
      g.fillStyle(0x556688);
      g.fillRect(3, T/2 - 4, 10, 1);
      // Horns — ivory with leather base
      g.fillStyle(0xeeddcc);
      g.fillRect(1, T/2 - 9, 3, 4);
      g.fillRect(T - 4, T/2 - 9, 3, 4);
      g.fillStyle(0x775544);
      g.fillRect(1, T/2 - 6, 3, 1);
      g.fillRect(T - 4, T/2 - 6, 3, 1);
      // Axe handle — mahogany
      g.fillStyle(0x8a3d1a);
      g.fillRect(T - 3, 1, 2, T - 2);
      // Axe head — dark iron
      g.fillStyle(0x334455);
      g.fillRect(T - 5, 1, 4, 6);
      // Axe cutting edge — bright silver
      g.fillStyle(0xaaccee);
      g.fillTriangle(T - 5, 1, T, 1, T - 2, 6);
    });
  }

  // ---------------------------------------------------------------------------
  // Modern item textures  (prefix: 'modern_')
  //
  // Bolder, higher-contrast visuals with clear glass/metal highlights.
  // ---------------------------------------------------------------------------

  /** Generates modern_ prefixed item sprite textures. */
  _createModernItemTextures() {
    // Health potion — vivid ruby vial with glass shine
    this._genTexture('modern_item_potion_health', T, T, (g) => {
      // Outline
      g.fillStyle(0x440011);
      g.fillEllipse(T/2, T/2 + 2, 10, 11);
      g.fillRect(T/2 - 2, T/2 - 6, 4, 5);
      // Vial body — vivid red
      g.fillStyle(0xee1144);
      g.fillEllipse(T/2, T/2 + 2, 8, 9);
      // Neck
      g.fillStyle(0xcc0033);
      g.fillRect(T/2 - 1, T/2 - 5, 3, 4);
      // Cork
      g.fillStyle(0xeecc88);
      g.fillRect(T/2 - 1, T/2 - 7, 3, 3);
      // Glass shine (left edge of bulb)
      g.fillStyle(0xff88aa, 0.9);
      g.fillRect(T/2 - 3, T/2, 2, 4);
      g.fillStyle(0xffffff, 0.7);
      g.fillRect(T/2 - 2, T/2 + 1, 1, 2);
    });

    // Weapon — longsword with gleaming blade and gold cross-guard
    this._genTexture('modern_item_weapon', T, T, (g) => {
      // Blade shadow (dark edge line)
      g.fillStyle(0x444444);
      g.fillRect(T/2 - 2, 1, 4, 11);
      // Blade — bright silver
      g.fillStyle(0xddddee);
      g.fillRect(T/2 - 1, 1, 3, 10);
      // Blade centre shine
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(T/2, 2, 1, 8);
      // Cross-guard — vivid gold
      g.fillStyle(0x221100);
      g.fillRect(T/2 - 5, 10, 10, 3);
      g.fillStyle(0xffcc00);
      g.fillRect(T/2 - 4, 11, 9, 2);
      // Pommel
      g.fillStyle(0xddaa22);
      g.fillRect(T/2 - 1, 13, 3, 3);
      // Handle wrap
      g.fillStyle(0x8a5028);
      g.fillRect(T/2, 13, 1, 3);
    });

    // Armor — heater shield with metallic sheen and gem
    this._genTexture('modern_item_armor', T, T, (g) => {
      // Shield outline
      g.fillStyle(0x1a2a3a);
      g.fillRect(2, 1, 12, 10);
      g.fillTriangle(2, 11, 14, 11, T/2, 15);
      // Shield face — rich blue steel
      g.fillStyle(0x4477aa);
      g.fillRect(3, 2, 10, 8);
      g.fillTriangle(3, 10, 13, 10, T/2, 14);
      // Highlight — upper-left quadrant lighter
      g.fillStyle(0x6699cc, 0.7);
      g.fillRect(3, 2, 5, 4);
      // Gold boss (centre emblem)
      g.fillStyle(0xffcc00);
      g.fillRect(T/2 - 1, 3, 3, 7);
      g.fillRect(T/2 - 3, 6, 7, 3);
      // Gem at cross centre
      g.fillStyle(0xff3366);
      g.fillRect(T/2, 6, 2, 2);
    });

    // Ranged weapon — detailed bow with colour-shaded stave and taut string
    this._genTexture('modern_item_ranged_weapon', T, T, (g) => {
      // Bow stave shadow
      g.fillStyle(0x442211);
      g.fillRect(T/2 - 2, 1, 3, 14);
      // Bow stave main
      g.fillStyle(0xaa6633);
      g.fillRect(T/2 - 1, 1, 2, 14);
      // Bow stave highlight
      g.fillStyle(0xddaa66, 0.7);
      g.fillRect(T/2, 2, 1, 12);
      // String
      g.fillStyle(0xeeeecc);
      g.fillRect(T/2 - 4, 2, 1, 1);
      g.fillRect(T/2 - 4, 13, 1, 1);
      g.fillRect(T/2 - 3, 6, 1, 1);
      g.fillRect(T/2 - 3, 9, 1, 1);
      // Arrow shaft
      g.fillStyle(0xbbaa77);
      g.fillRect(4, 7, 8, 1);
      // Arrowhead
      g.fillStyle(0xcccccc);
      g.fillRect(3, 6, 2, 3);
      g.fillStyle(0xaaaaaa);
      g.fillRect(3, 7, 1, 1);
    });

    // Bone Blade — gleaming bone blade with vivid amber guard
    this._genTexture('modern_item_bone_blade', T, T, (g) => {
      // Blade shadow
      g.fillStyle(0x555544);
      g.fillRect(T/2 - 2, 0, 4, 12);
      // Blade — bright ivory
      g.fillStyle(0xf8f6e0);
      g.fillRect(T/2 - 1, 1, 3, 10);
      // Serrated teeth — prominent notches on left edge
      g.fillStyle(0xccccaa);
      g.fillRect(T/2 - 2, 2, 1, 1);
      g.fillRect(T/2 - 2, 5, 1, 1);
      g.fillRect(T/2 - 2, 8, 1, 1);
      // Blade shine
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(T/2, 1, 1, 9);
      // Guard — vivid amber gold
      g.fillStyle(0x552200);
      g.fillRect(T/2 - 5, 10, 10, 3);
      g.fillStyle(0xffaa00);
      g.fillRect(T/2 - 4, 11, 9, 2);
      // Handle
      g.fillStyle(0xddddcc);
      g.fillRect(T/2 - 1, 13, 3, 3);
    });

    // Night Cloak — dark flowing cloak with blue-shadow sheen
    this._genTexture('modern_item_night_cloak', T, T, (g) => {
      // Outline
      g.fillStyle(0x080810);
      g.fillRect(2, 1, 12, 13);
      g.fillTriangle(2, 14, 14, 14, T/2, T - 1);
      // Cloak body — deep midnight blue
      g.fillStyle(0x0d1133);
      g.fillRect(3, 2, 10, 11);
      g.fillTriangle(3, 13, 13, 13, T/2, T - 2);
      // Shadow sheen highlights
      g.fillStyle(0x3355bb, 0.5);
      g.fillRect(4, 3, 3, 8);
      g.fillStyle(0x6688ff, 0.3);
      g.fillRect(5, 4, 1, 5);
      g.fillRect(10, 7, 1, 3);
      // Hood opening
      g.fillStyle(0x000008);
      g.fillRect(5, 2, 6, 3);
    });

    // Null Scimitar — void-purple curved blade with dark energy
    this._genTexture('modern_item_null_scimitar', T, T, (g) => {
      // Blade shadow
      g.fillStyle(0x110022);
      g.fillRect(T/2 - 2, 0, 5, 12);
      g.fillRect(T/2, 2, 4, 7);
      // Void blade — deep purple
      g.fillStyle(0x6600aa);
      g.fillRect(T/2 - 1, 1, 3, 10);
      g.fillRect(T/2 + 1, 2, 3, 6);
      // Void energy shine
      g.fillStyle(0xcc44ff, 0.8);
      g.fillRect(T/2, 2, 1, 8);
      g.fillRect(T/2 + 2, 3, 1, 4);
      // Guard
      g.fillStyle(0x330044);
      g.fillRect(T/2 - 5, 10, 10, 3);
      g.fillStyle(0x884499);
      g.fillRect(T/2 - 4, 11, 9, 2);
      // Handle
      g.fillStyle(0x555566);
      g.fillRect(T/2 - 1, 13, 3, 3);
    });

    // Key to Elsewhere — ornate golden key with blue arcane shimmer
    this._genTexture('modern_item_key_to_elsewhere', T, T, (g) => {
      // Outline
      g.fillStyle(0x553300);
      g.fillRect(T/2 - 2, 1, 4, 12);
      g.fillRect(T/2 - 4, 1, 8, 5);
      // Shaft — warm gold
      g.fillStyle(0xddbb44);
      g.fillRect(T/2 - 1, 2, 3, 10);
      // Bow (head) — gold ring
      g.fillStyle(0xeecc55);
      g.fillRect(T/2 - 3, 2, 7, 4);
      g.fillStyle(0x221100);
      g.fillRect(T/2 - 1, 3, 3, 2);
      // Teeth
      g.fillStyle(0xeecc55);
      g.fillRect(T/2 + 1, 8, 2, 2);
      g.fillRect(T/2 + 1, 11, 2, 1);
      // Gold shine
      g.fillStyle(0xffffff, 0.4);
      g.fillRect(T/2 - 1, 2, 1, 8);
      // Arcane portal glow
      g.fillStyle(0x6699ff, 0.6);
      g.fillRect(T/2, 3, 1, 2);
      g.fillRect(T/2 - 2, 4, 1, 1);
      g.fillRect(T/2 + 2, 4, 1, 1);
    });

    // Eclipse Blade — void-dark sword outlined in deep shadow
    this._genTexture('modern_item_eclipse_blade', T, T, (g) => {
      // Blade outline
      g.fillStyle(0x050505);
      g.fillRect(T/2 - 2, 0, 5, 12);
      // Blade body — polished void-black
      g.fillStyle(0x0c0c14);
      g.fillRect(T/2 - 1, 1, 3, 10);
      // Eclipse shimmer — faint dark-blue edge
      g.fillStyle(0x1a1a44, 0.7);
      g.fillRect(T/2, 2, 1, 8);
      // Guard — dark iron
      g.fillStyle(0x151515);
      g.fillRect(T/2 - 5, 11, 11, 2);
      g.fillStyle(0x2a2a3a);
      g.fillRect(T/2 - 4, 11, 9, 1);
      // Handle
      g.fillStyle(0x0a0a0a);
      g.fillRect(T/2 - 1, 13, 3, 3);
      g.fillStyle(0x222233, 0.5);
      g.fillRect(T/2, 14, 1, 2);
    });

    // Key to Beyond — heavy iron key etched with unknown runes
    this._genTexture('modern_item_key_to_beyond', T, T, (g) => {
      // Outline
      g.fillStyle(0x111111);
      g.fillRect(T/2 - 2, 1, 5, 13);
      g.fillRect(T/2 - 4, 1, 9, 6);
      // Shaft — dark iron
      g.fillStyle(0x2e2e2e);
      g.fillRect(T/2 - 1, 2, 3, 11);
      // Bow — heavy ring
      g.fillStyle(0x3a3a3a);
      g.fillRect(T/2 - 3, 2, 7, 5);
      g.fillStyle(0x0d0d0d);
      g.fillRect(T/2 - 1, 3, 3, 3);
      // Shine
      g.fillStyle(0x666677, 0.35);
      g.fillRect(T/2 - 1, 2, 1, 9);
      // Teeth — heavy notches
      g.fillStyle(0x3a3a3a);
      g.fillRect(T/2 + 2, 9, 2, 2);
      g.fillRect(T/2 + 2, 12, 3, 2);
      // Rune etching — faint crimson
      g.fillStyle(0x660000, 0.7);
      g.fillRect(T/2 - 1, 6, 1, 1);
      g.fillRect(T/2,     9, 1, 1);
      g.fillRect(T/2 - 1, 12, 1, 1);
    });

    // Skeleton Shield — bone-white shield with purple gem and clear cross
    this._genTexture('modern_item_skeleton_shield', T, T, (g) => {
      // Outline
      g.fillStyle(0x333322);
      g.fillRect(2, 1, 12, 10);
      g.fillTriangle(2, 11, 14, 11, T/2, 15);
      // Bone face — bright ivory
      g.fillStyle(0xeeeedd);
      g.fillRect(3, 2, 10, 8);
      g.fillTriangle(3, 10, 13, 10, T/2, 14);
      // Surface texture (bone grain)
      g.fillStyle(0xd8d8cc, 0.7);
      g.fillRect(4, 3, 8, 1);
      g.fillRect(4, 7, 8, 1);
      // Cross — bright white
      g.fillStyle(0xffffff);
      g.fillRect(T/2 - 1, 2, 3, 10);
      g.fillRect(3, 6, 10, 3);
      // Purple gem at centre
      g.fillStyle(0x8833cc);
      g.fillRect(T/2, 7, 2, 2);
      g.fillStyle(0xcc88ff, 0.8);
      g.fillRect(T/2, 7, 1, 1);
    });

    // Teleport potion — deep violet vial with swirling star sparkles
    this._genTexture('modern_item_potion_teleport', T, T, (g) => {
      // Outline
      g.fillStyle(0x220044);
      g.fillEllipse(T/2, T/2 + 2, 10, 11);
      g.fillRect(T/2 - 2, T/2 - 6, 4, 5);
      // Vial body — vivid violet
      g.fillStyle(0x7722cc);
      g.fillEllipse(T/2, T/2 + 2, 8, 9);
      // Neck
      g.fillStyle(0x551199);
      g.fillRect(T/2 - 1, T/2 - 5, 3, 4);
      // Cork
      g.fillStyle(0xeecc88);
      g.fillRect(T/2 - 1, T/2 - 7, 3, 3);
      // Glass shine
      g.fillStyle(0xbb88ff, 0.8);
      g.fillRect(T/2 - 3, T/2, 2, 4);
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(T/2 - 2, T/2 + 1, 1, 2);
      // Star sparkles
      g.fillStyle(0xeeddff, 0.9);
      g.fillRect(T/2 + 2, T/2 - 1, 1, 1);
      g.fillRect(T/2 + 3, T/2 + 2, 1, 1);
      g.fillRect(T/2 - 4, T/2 + 4, 1, 1);
    });

    // Home Seeking Scroll — rolled parchment with portal rune (modern)
    this._genTexture('modern_item_home_seeking_scroll', T, T, (g) => {
      // Parchment shadow
      g.fillStyle(0xaa9944);
      g.fillRect(4, 4, 10, 9);
      // Parchment body
      g.fillStyle(0xeedd99);
      g.fillRect(3, 3, 10, 9);
      // Rolled ends (darker)
      g.fillStyle(0xccbb77);
      g.fillRect(3, 3, 10, 2);
      g.fillRect(3, 10, 10, 2);
      // Portal rune — bright cyan
      g.fillStyle(0x00eeff);
      g.fillRect(T/2 - 1, 5, 2, 1);
      g.fillRect(T/2 - 2, 6, 5, 1);
      g.fillRect(T/2 - 1, 7, 1, 2);
      g.fillRect(T/2 + 1, 7, 1, 2);
      g.fillRect(T/2 - 2, 9, 5, 1);
      // Glow dot
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(T/2, 6, 1, 1);
    });

    // Helmet — polished metal cap with cheekguard shadow
    this._genTexture('modern_item_helmet', T, T, (g) => {
      g.fillStyle(0x445566);
      g.fillRect(3, 5, 10, 8);
      g.fillRect(4, 3, 8, 3);
      g.fillRect(6, 2, 4, 2);
      g.fillRect(2, 12, 12, 2);
      g.fillStyle(0x8899bb);
      g.fillRect(5, 4, 6, 6);
      g.fillStyle(0xbbccdd, 0.7);
      g.fillRect(6, 5, 2, 4);
    });

    // Chest — layered breastplate with rivets
    this._genTexture('modern_item_chest', T, T, (g) => {
      g.fillStyle(0x445566);
      g.fillRect(2, 1, 12, 14);
      g.fillStyle(0x8899bb);
      g.fillRect(3, 2, 10, 12);
      g.fillStyle(0x667788);
      g.fillRect(4, 5, 8, 1);
      g.fillRect(4, 9, 8, 1);
      g.fillStyle(0xbbccdd, 0.6);
      g.fillRect(4, 3, 2, 8);
    });

    // Legs — greaves with knee guard
    this._genTexture('modern_item_legs', T, T, (g) => {
      g.fillStyle(0x445566);
      g.fillRect(2, 1, 12, 7);
      g.fillRect(2, 9, 5, 6);
      g.fillRect(9, 9, 5, 6);
      g.fillStyle(0x8899bb);
      g.fillRect(3, 2, 10, 5);
      g.fillRect(3, 10, 3, 4);
      g.fillRect(10, 10, 3, 4);
      g.fillStyle(0xaabbcc, 0.5);
      g.fillRect(4, 3, 2, 3);
    });

    // Arms — armoured gauntlet with knuckle plates
    this._genTexture('modern_item_arms', T, T, (g) => {
      g.fillStyle(0x445566);
      g.fillRect(3, 2, 10, 12);
      g.fillStyle(0x8899bb);
      g.fillRect(4, 3, 8, 10);
      g.fillStyle(0x667788);
      g.fillRect(4, 5, 8, 1);
      g.fillRect(4, 9, 8, 1);
      g.fillStyle(0xaabbcc, 0.5);
      g.fillRect(5, 4, 2, 7);
    });

    // Boots — armoured sabatons
    this._genTexture('modern_item_boots', T, T, (g) => {
      g.fillStyle(0x445566);
      g.fillRect(3, 1, 8, 11);
      g.fillRect(2, 12, 10, 3);
      g.fillRect(2, 14, 12, 2);
      g.fillStyle(0x8899bb);
      g.fillRect(4, 2, 6, 9);
      g.fillRect(3, 13, 9, 2);
      g.fillStyle(0xaabbcc, 0.5);
      g.fillRect(5, 3, 2, 7);
    });

    // Ring — gold band with gemstone
    this._genTexture('modern_item_ring', T, T, (g) => {
      g.fillStyle(0x996600);
      g.fillEllipse(T/2, T/2, 13, 13);
      g.fillStyle(0x111122);
      g.fillEllipse(T/2, T/2, 8, 8);
      g.fillStyle(0xffcc44);
      g.fillEllipse(T/2, T/2, 11, 11);
      g.fillStyle(0x111122);
      g.fillEllipse(T/2, T/2, 7, 7);
      g.fillStyle(0xff3333);
      g.fillEllipse(T/2, T/2 - 4, 4, 4);
      g.fillStyle(0xff8888, 0.8);
      g.fillRect(T/2 - 1, T/2 - 5, 1, 1);
    });

    // Amulet — golden teardrop pendant with cyan gem
    this._genTexture('modern_item_amulet', T, T, (g) => {
      g.fillStyle(0x996600);
      g.fillRect(T/2 - 1, 1, 3, 6);
      g.fillRect(T/2 - 5, 2, 10, 3);
      g.fillEllipse(T/2, T/2 + 3, 11, 12);
      g.fillStyle(0xffcc44);
      g.fillRect(T/2 - 1, 2, 2, 5);
      g.fillRect(T/2 - 4, 3, 8, 2);
      g.fillEllipse(T/2, T/2 + 3, 9, 10);
      g.fillStyle(0x33ccdd);
      g.fillEllipse(T/2, T/2 + 3, 6, 7);
      g.fillStyle(0xaaeeff, 0.8);
      g.fillRect(T/2 - 2, T/2 + 1, 2, 3);
    });
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

  // ---------------------------------------------------------------------------
  // HD tile textures  (prefix: 'hd_', size: 32×32)
  //
  // 32×32 pixel tiles rendered at camera zoom=1 → 32 screen pixels per tile
  // (same screen size as 16×16 tiles at zoom=2, but with 4× the pixel detail).
  // Palette: rich warm dungeon stone + vibrant town cobblestone.
  // ---------------------------------------------------------------------------

  /** Generates all hd_ prefixed 32×32 tile textures. */
  _createHdTileTextures() {
    const S = 32; // HD tile size

    // Dungeon floor — large stone slabs with mortar grid and surface detail
    this._genTexture('hd_tile_floor', S, S, (g) => {
      // Mortar background
      g.fillStyle(0x0e1018);
      g.fillRect(0, 0, S, S);
      // Four stone slabs in a 2×2 grid (each 14×14 with 2px mortar)
      const slabColor  = 0x22283a;
      const slabHilight = 0x2e3650;
      const slabShadow  = 0x181d28;
      const slabs = [[1,1],[17,1],[1,17],[17,17]];
      for (const [sx, sy] of slabs) {
        g.fillStyle(slabColor);
        g.fillRect(sx, sy, 14, 14);
        // Top-edge highlight
        g.fillStyle(slabHilight);
        g.fillRect(sx, sy, 14, 1);
        g.fillRect(sx, sy, 1, 14);
        // Bottom-right shadow
        g.fillStyle(slabShadow);
        g.fillRect(sx, sy + 13, 14, 1);
        g.fillRect(sx + 13, sy, 1, 14);
      }
      // Surface noise — scattered pits in stone
      const pits = [[4,4],[10,7],[20,3],[27,8],[6,20],[14,25],[23,18],[28,26],[9,12],[19,22]];
      for (const [px, py] of pits) {
        g.fillStyle(0x131820, 0.8);
        g.fillRect(px, py, 2, 1);
      }
    });

    // Dungeon wall — rich layered stone brick with clear courses and bevel
    this._genTexture('hd_tile_wall', S, S, (g) => {
      // Stone base
      g.fillStyle(0x2e3a4e);
      g.fillRect(0, 0, S, S);
      // Brick courses: 3 rows of bricks with alternating offsets
      // Row 0 (y 1–9): bricks at x=1, x=12, x=22
      const brickH   = 9;
      const brickRows = [
        { y: 1,  offsets: [1, 12, 23] },
        { y: 12, offsets: [6, 17] },
        { y: 23, offsets: [1, 12, 23] },
      ];
      for (const row of brickRows) {
        for (const bx of row.offsets) {
          const bw = (bx === row.offsets[row.offsets.length - 1]) ? S - bx - 1 : 9;
          // Brick face
          g.fillStyle(0x3e4e66);
          g.fillRect(bx, row.y, bw, brickH);
          // Top highlight
          g.fillStyle(0x5a7098);
          g.fillRect(bx, row.y, bw, 1);
          g.fillRect(bx, row.y, 1, brickH);
          // Bottom/right shadow
          g.fillStyle(0x1e2a38);
          g.fillRect(bx, row.y + brickH - 1, bw, 1);
          g.fillRect(bx + bw - 1, row.y, 1, brickH);
          // Surface scuff mark
          g.fillStyle(0x344258, 0.6);
          g.fillRect(bx + 3, row.y + 3, 3, 1);
        }
      }
      // Outer top + left bright edge catch
      g.fillStyle(0x6888b0);
      g.fillRect(0, 0, S, 1);
      g.fillRect(0, 0, 1, S);
      // Outer bottom + right deep shadow
      g.fillStyle(0x0a1018);
      g.fillRect(0, S - 1, S, 1);
      g.fillRect(S - 1, 0, 1, S);
    });

    // Dungeon door — dark mahogany with ornate mouldings and gold hardware
    this._genTexture('hd_tile_door', S, S, (g) => {
      // Stone door-frame
      g.fillStyle(0x1e1408);
      g.fillRect(0, 0, S, S);
      // Door face — rich mahogany
      g.fillStyle(0x7a3e18);
      g.fillRect(3, 1, S - 6, S - 2);
      // Upper raised panel
      g.fillStyle(0x5a2e10);
      g.fillRect(5, 3, S - 10, 10);
      g.fillStyle(0x9a5028, 0.5);
      g.fillRect(5, 3, S - 10, 1);
      g.fillRect(5, 3, 1, 10);
      // Middle panel
      g.fillStyle(0x5a2e10);
      g.fillRect(5, 15, S - 10, 8);
      g.fillStyle(0x9a5028, 0.5);
      g.fillRect(5, 15, S - 10, 1);
      g.fillRect(5, 15, 1, 8);
      // Lower raised panel
      g.fillStyle(0x5a2e10);
      g.fillRect(5, 25, S - 10, S - 27);
      g.fillStyle(0x9a5028, 0.5);
      g.fillRect(5, 25, S - 10, 1);
      g.fillRect(5, 25, 1, S - 27);
      // Gold handle plate
      g.fillStyle(0x443300);
      g.fillRect(S - 8, 14, 5, 8);
      g.fillStyle(0xffcc00);
      g.fillRect(S - 7, 15, 4, 6);
      // Handle knob
      g.fillStyle(0xffe880);
      g.fillRect(S - 7, 17, 3, 2);
      // Hinge marks (left side)
      g.fillStyle(0xaa8800);
      g.fillRect(4, 5, 2, 4);
      g.fillRect(4, 23, 2, 4);
    });

    // Dungeon stairs down — deep stone with wide steps and golden tread nosings
    this._genTexture('hd_tile_stairs', S, S, (g) => {
      // Background stone
      g.fillStyle(0x0e1018);
      g.fillRect(0, 0, S, S);
      // Five descending steps — tread + riser for each
      const steps = [
        { y: 2,  w: 28, x: 2 },
        { y: 8,  w: 22, x: 5 },
        { y: 14, w: 16, x: 8 },
        { y: 20, w: 10, x: 11 },
        { y: 26, w: 4,  x: 14 },
      ];
      for (const { x, y, w } of steps) {
        // Riser (dark)
        g.fillStyle(0x1a2030);
        g.fillRect(x, y, w, 5);
        // Tread top highlight (gold nosing)
        g.fillStyle(0xddaa44);
        g.fillRect(x, y, w, 2);
        // Tread body
        g.fillStyle(0x2a3448);
        g.fillRect(x, y + 2, w, 3);
        // Left wall shadow
        g.fillStyle(0x0a0e18);
        g.fillRect(x, y, 1, 5);
        // Right wall shadow
        g.fillRect(x + w - 1, y, 1, 5);
      }
      // Down indicator arrow
      g.fillStyle(0xffcc44);
      g.fillTriangle(S/2 - 3, 30, S/2 + 3, 30, S/2, S - 1);
    });

    // Dungeon stairs up — blue-tinted ascending steps
    this._genTexture('hd_tile_stairs_up', S, S, (g) => {
      g.fillStyle(0x0e1018);
      g.fillRect(0, 0, S, S);
      const steps = [
        { y: 2,  w: 28, x: 2 },
        { y: 8,  w: 22, x: 5 },
        { y: 14, w: 16, x: 8 },
        { y: 20, w: 10, x: 11 },
        { y: 26, w: 4,  x: 14 },
      ];
      // Draw in reverse (bottom step first, visually ascending)
      const reversed = [...steps].reverse();
      for (let i = 0; i < reversed.length; i++) {
        const { x, y, w } = reversed[i];
        const stepY = 2 + i * 6;
        g.fillStyle(0x1a2030);
        g.fillRect(x, stepY, w, 5);
        g.fillStyle(0x4488cc);
        g.fillRect(x, stepY, w, 2);
        g.fillStyle(0x223450);
        g.fillRect(x, stepY + 2, w, 3);
        g.fillStyle(0x0a0e18);
        g.fillRect(x, stepY, 1, 5);
        g.fillRect(x + w - 1, stepY, 1, 5);
      }
      // Up indicator arrow
      g.fillStyle(0x88ccff);
      g.fillTriangle(S/2 - 3, 2, S/2 + 3, 2, S/2, 0);
    });

    // Town floor — warm sandstone with large well-defined cobblestones
    this._genTexture('hd_tile_town_floor', S, S, (g) => {
      // Mortar
      g.fillStyle(0x4a3820);
      g.fillRect(0, 0, S, S);
      // Six cobblestones in two rows (3 top, 3 bottom offset)
      const stones = [
        // Top row
        { x: 1, y: 1, w: 8, h: 13 },
        { x: 11, y: 1, w: 10, h: 13 },
        { x: 23, y: 1, w: 8, h: 13 },
        // Bottom row (offset)
        { x: 1, y: 16, w: 13, h: 14 },
        { x: 16, y: 16, w: 8, h: 14 },
        { x: 26, y: 16, w: 5, h: 14 },
      ];
      for (const { x, y, w, h } of stones) {
        g.fillStyle(0xa08060);
        g.fillRect(x, y, w, h);
        // Top-left highlight
        g.fillStyle(0xc0a07a);
        g.fillRect(x, y, w, 1);
        g.fillRect(x, y, 1, h);
        // Bottom-right shadow
        g.fillStyle(0x786040);
        g.fillRect(x, y + h - 1, w, 1);
        g.fillRect(x + w - 1, y, 1, h);
        // Surface texture (small pit)
        g.fillStyle(0x887050, 0.6);
        g.fillRect(x + 2, y + 3, 2, 1);
      }
    });

    // Town wall — cream limestone blocks with defined mortar and shadow
    this._genTexture('hd_tile_town_wall', S, S, (g) => {
      // Mortar
      g.fillStyle(0x6a5a40);
      g.fillRect(0, 0, S, S);
      // Three rows of limestone blocks
      const rows = [
        { y: 1, blocks: [{x:1,w:14},{x:17,w:14}] },
        { y: 12, blocks: [{x:1,w:8},{x:11,w:11},{x:24,w:7}] },
        { y: 23, blocks: [{x:1,w:14},{x:17,w:14}] },
      ];
      for (const row of rows) {
        for (const { x, w } of row.blocks) {
          g.fillStyle(0xd0c0a0);
          g.fillRect(x, row.y, w, 9);
          // Top-edge light (limestone catches warm light)
          g.fillStyle(0xe8d8b8);
          g.fillRect(x, row.y, w, 1);
          g.fillRect(x, row.y, 1, 9);
          // Bottom-edge shadow
          g.fillStyle(0xa89878);
          g.fillRect(x, row.y + 8, w, 1);
          g.fillRect(x + w - 1, row.y, 1, 9);
          // Mid-block surface variation
          g.fillStyle(0xc8b898, 0.5);
          g.fillRect(x + 3, row.y + 4, 4, 1);
        }
      }
      // Top bright edge
      g.fillStyle(0xf0e0c8);
      g.fillRect(0, 0, S, 1);
    });

    // Town stairs — warm sandstone steps, descending
    this._genTexture('hd_tile_town_stairs', S, S, (g) => {
      g.fillStyle(0x6a5040);
      g.fillRect(0, 0, S, S);
      const steps = [
        { x: 2,  y: 2,  w: 28 },
        { x: 5,  y: 8,  w: 22 },
        { x: 8,  y: 14, w: 16 },
        { x: 11, y: 20, w: 10 },
        { x: 14, y: 26, w: 4  },
      ];
      for (const { x, y, w } of steps) {
        g.fillStyle(0x8a6a50);
        g.fillRect(x, y, w, 5);
        g.fillStyle(0xe8c890);
        g.fillRect(x, y, w, 2);
        g.fillStyle(0xaa8868);
        g.fillRect(x, y + 2, w, 3);
        g.fillStyle(0x4a3020);
        g.fillRect(x, y, 1, 5);
        g.fillRect(x + w - 1, y, 1, 5);
      }
      g.fillStyle(0xffdd99);
      g.fillTriangle(S/2 - 3, 30, S/2 + 3, 30, S/2, S - 1);
    });

    // Shop roof — dark mahogany planks with knots and grain
    this._genTexture('hd_tile_shop_roof', S, S, (g) => {
      g.fillStyle(0x180c04);
      g.fillRect(0, 0, S, S);
      // Five planks across the tile
      const planks = [0, 7, 14, 21, 28];
      for (const py of planks) {
        g.fillStyle(0x3a1e08);
        g.fillRect(0, py, S, 5);
        // Grain highlight line
        g.fillStyle(0x5a3010, 0.8);
        g.fillRect(0, py + 1, S, 1);
        g.fillRect(0, py + 3, S, 1);
        // Dark knot
        g.fillStyle(0x220c02, 0.9);
        const kx = (py * 7 + 4) % (S - 4);
        g.fillEllipse(kx + 4, py + 2, 5, 3);
      }
      // Plank gaps
      g.fillStyle(0x0a0602);
      for (const py of planks) {
        g.fillRect(0, py + 5, S, 2);
      }
    });

    // Town accent floor — polished light limestone with subtle veining
    this._genTexture('hd_tile_town_accent', S, S, (g) => {
      g.fillStyle(0x8a7858);
      g.fillRect(0, 0, S, S);
      const stones = [
        { x: 1, y: 1, w: 8,  h: 13 },
        { x: 11, y: 1, w: 10, h: 13 },
        { x: 23, y: 1, w: 8,  h: 13 },
        { x: 1,  y: 16, w: 13, h: 14 },
        { x: 16, y: 16, w: 8,  h: 14 },
        { x: 26, y: 16, w: 5,  h: 14 },
      ];
      for (const { x, y, w, h } of stones) {
        // Polished stone — lighter and more uniform
        g.fillStyle(0xd8c8a8);
        g.fillRect(x, y, w, h);
        // Strong specular at top-left (polished surface)
        g.fillStyle(0xf0e0c8);
        g.fillRect(x, y, w, 1);
        g.fillRect(x, y, 1, h);
        // Subtle vein
        g.fillStyle(0xc0b090, 0.5);
        g.fillRect(x + 1, y + h / 2 | 0, 3, 1);
        // Bottom shadow (lighter than town floor)
        g.fillStyle(0xb8a888);
        g.fillRect(x, y + h - 1, w, 1);
        g.fillRect(x + w - 1, y, 1, h);
      }
    });

    // Potion shop door — HD mahogany with flask icon
    this._genTexture('hd_tile_door_potion', S, S, (g) => {
      this._drawHdDoorBase(g, S);
      // Flask body — vivid ruby
      g.fillStyle(0x440011);
      g.fillEllipse(S/2, S * 0.58, 12, 14);
      g.fillStyle(0xee1144);
      g.fillEllipse(S/2, S * 0.58, 10, 12);
      // Neck
      g.fillStyle(0xbb0033);
      g.fillRect(S/2 - 2, S * 0.28, 5, 8);
      // Cork
      g.fillStyle(0xeecc88);
      g.fillRect(S/2 - 2, S * 0.20, 5, 5);
      // Shine
      g.fillStyle(0xff88aa, 0.8);
      g.fillRect(S/2 - 4, S * 0.52, 3, 5);
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(S/2 - 3, S * 0.53, 1, 3);
    });

    // Weapon shop door — HD mahogany with sword icon
    this._genTexture('hd_tile_door_weapon', S, S, (g) => {
      this._drawHdDoorBase(g, S);
      // Blade
      g.fillStyle(0x555555);
      g.fillRect(S/2 - 2, 4, 5, 18);
      g.fillStyle(0xeeeeff);
      g.fillRect(S/2 - 1, 4, 4, 17);
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(S/2, 5, 2, 15);
      // Cross-guard — vivid gold
      g.fillStyle(0x332200);
      g.fillRect(S/2 - 6, 20, 13, 5);
      g.fillStyle(0xffcc00);
      g.fillRect(S/2 - 5, 21, 11, 4);
      // Pommel
      g.fillStyle(0xddaa22);
      g.fillRect(S/2 - 2, 25, 5, 4);
    });

    // Armour shop door — HD mahogany with shield icon
    this._genTexture('hd_tile_door_armour', S, S, (g) => {
      this._drawHdDoorBase(g, S);
      // Shield body — blue steel
      g.fillStyle(0x112233);
      g.fillRect(S/2 - 7, 5, 15, 13);
      g.fillTriangle(S/2 - 7, 18, S/2 + 8, 18, S/2, 26);
      g.fillStyle(0x4477aa);
      g.fillRect(S/2 - 6, 6, 13, 11);
      g.fillTriangle(S/2 - 6, 17, S/2 + 7, 17, S/2, 25);
      g.fillStyle(0x6699cc, 0.5);
      g.fillRect(S/2 - 5, 6, 5, 5);
      // Gold cross emblem
      g.fillStyle(0xffcc00);
      g.fillRect(S/2 - 1, 7, 3, 10);
      g.fillRect(S/2 - 5, 11, 11, 3);
      // Gem
      g.fillStyle(0xff2244);
      g.fillRect(S/2, 12, 2, 2);
    });

    // Home door — rich oak with ornate house icon and gold trim
    this._genTexture('hd_tile_home_door', S, S, (g) => {
      this._drawHdDoorBase(g, S);
      // House icon — vivid gold
      // Roof
      g.fillStyle(0x443300);
      g.fillTriangle(S/2, 4, S/2 - 8, 13, S/2 + 8, 13);
      g.fillStyle(0xffdd44);
      g.fillTriangle(S/2, 5, S/2 - 7, 13, S/2 + 7, 13);
      // Chimney
      g.fillStyle(0xddbb33);
      g.fillRect(S/2 + 2, 3, 3, 5);
      // Walls
      g.fillStyle(0x443300);
      g.fillRect(S/2 - 6, 13, 13, 11);
      g.fillStyle(0xeecc55);
      g.fillRect(S/2 - 5, 14, 11, 10);
      // Door
      g.fillStyle(0x6a3a18);
      g.fillRect(S/2 - 2, 18, 5, 6);
      // Window
      g.fillStyle(0x88ccff, 0.8);
      g.fillRect(S/2 + 2, 15, 3, 3);
      g.fillStyle(0x4488aa);
      g.fillRect(S/2 + 3, 15, 1, 3);
      g.fillRect(S/2 + 2, 16, 3, 1);
    });
  }

  /**
   * Draws the HD door base (frame + mahogany face + raised panels) reused by
   * all shop and home door variants.
   * @param {Phaser.GameObjects.Graphics} g
   * @param {number} S - Tile size (32)
   */
  _drawHdDoorBase(g, S) {
    // Stone frame
    g.fillStyle(0x140a04);
    g.fillRect(0, 0, S, S);
    // Mahogany face
    g.fillStyle(0x7a3e18);
    g.fillRect(3, 1, S - 6, S - 2);
    // Upper panel
    g.fillStyle(0x5a2e10);
    g.fillRect(5, 3, S - 10, 10);
    g.fillStyle(0x9a5028, 0.5);
    g.fillRect(5, 3, S - 10, 1);
    g.fillRect(5, 3, 1, 10);
    // Middle panel
    g.fillStyle(0x5a2e10);
    g.fillRect(5, 15, S - 10, 8);
    g.fillStyle(0x9a5028, 0.5);
    g.fillRect(5, 15, S - 10, 1);
    g.fillRect(5, 15, 1, 8);
  }

  // ---------------------------------------------------------------------------
  // HD entity textures  (prefix: 'hd_', size: 32×32)
  // ---------------------------------------------------------------------------

  /** Generates hd_ prefixed 32×32 entity sprite textures. */
  _createHdEntityTextures() {
    const S = 32;

    // Player — diamond with faceted shading and bright pupil
    this._genTexture('hd_entity_player', S, S, (g) => {
      // Dark outline
      g.fillStyle(0x001144);
      g.fillTriangle(S/2, 0, S, S/2, S/2, S);
      g.fillTriangle(S/2, 0, 0, S/2, S/2, S);
      // Main body — vivid royal blue
      g.fillStyle(0x2266ee);
      g.fillTriangle(S/2, 2, S - 2, S/2, S/2, S - 2);
      g.fillTriangle(S/2, 2, 2, S/2, S/2, S - 2);
      // Left-top facet — lighter
      g.fillStyle(0x55aaff, 0.8);
      g.fillTriangle(S/2, 2, 2, S/2, S/2, S/2);
      // Right-bottom facet — darker
      g.fillStyle(0x1144aa, 0.6);
      g.fillTriangle(S/2, S/2, S - 2, S/2, S/2, S - 2);
      // Eye
      g.fillStyle(0xffffff);
      g.fillRect(S/2 - 2, S/2 - 4, 4, 4);
      g.fillStyle(0x0033cc);
      g.fillRect(S/2 - 1, S/2 - 3, 2, 2);
      g.fillStyle(0xffffff);
      g.fillRect(S/2, S/2 - 3, 1, 1);
    });

    // Cockroach — segmented body, six legs, antennae
    this._genTexture('hd_entity_cockroach', S, S, (g) => {
      // Body shadow
      g.fillStyle(0x110400);
      g.fillEllipse(S/2, S/2 + 2, 18, 26);
      // Abdomen segments (3 ovals stacked)
      g.fillStyle(0x5a2a0a);
      g.fillEllipse(S/2, S/2 + 5, 14, 10);
      g.fillStyle(0x6a3a14);
      g.fillEllipse(S/2, S/2 - 1, 14, 8);
      // Head + thorax
      g.fillStyle(0x7a4a1e);
      g.fillEllipse(S/2, S/2 - 7, 12, 8);
      // Shell sheen
      g.fillStyle(0xaa7040, 0.6);
      g.fillEllipse(S/2 - 2, S/2 - 3, 6, 10);
      // Eyes
      g.fillStyle(0xff4400);
      g.fillRect(S/2 - 4, S/2 - 10, 3, 3);
      g.fillRect(S/2 + 1, S/2 - 10, 3, 3);
      g.fillStyle(0xff9966, 0.8);
      g.fillRect(S/2 - 3, S/2 - 10, 1, 1);
      // Antennae
      g.fillStyle(0x3a1804);
      g.fillRect(S/2 - 3, S/2 - 14, 1, 5);
      g.fillRect(S/2 - 5, S/2 - 16, 3, 1);
      g.fillRect(S/2 + 2, S/2 - 14, 1, 5);
      g.fillRect(S/2 + 2, S/2 - 16, 3, 1);
      // Legs — 3 per side
      g.fillStyle(0x2a1008);
      for (let i = 0; i < 3; i++) {
        const ly = S/2 - 5 + i * 5;
        g.fillRect(S/2 - 12, ly, 5, 1);
        g.fillRect(S/2 - 14, ly - 1, 3, 1);
        g.fillRect(S/2 + 7, ly, 5, 1);
        g.fillRect(S/2 + 11, ly - 1, 3, 1);
      }
    });

    // Sprite — radiant fairy with wings and glow
    this._genTexture('hd_entity_sprite', S, S, (g) => {
      // Wing glow aura
      g.fillStyle(0xaaddff, 0.2);
      g.fillEllipse(S/2, S/2, 28, 24);
      // Wings
      g.fillStyle(0x99ccff, 0.5);
      g.fillEllipse(S/2 - 9, S/2, 12, 20);
      g.fillEllipse(S/2 + 9, S/2, 12, 20);
      g.fillStyle(0xbbddff, 0.8);
      g.fillEllipse(S/2 - 8, S/2 - 2, 8, 14);
      g.fillEllipse(S/2 + 8, S/2 - 2, 8, 14);
      // Body
      g.fillStyle(0x5577bb);
      g.fillEllipse(S/2, S/2 + 2, 10, 14);
      // Head
      g.fillStyle(0x88aaee);
      g.fillEllipse(S/2, S/2 - 6, 10, 10);
      // Halo
      g.fillStyle(0xffffff, 0.9);
      g.fillEllipse(S/2, S/2 - 11, 10, 3);
      g.fillStyle(0xffffcc);
      g.fillRect(S/2 - 1, S/2 - 12, 3, 2);
      // Eyes
      g.fillStyle(0x220044);
      g.fillRect(S/2 - 3, S/2 - 7, 2, 2);
      g.fillRect(S/2 + 1, S/2 - 7, 2, 2);
      g.fillStyle(0xeeddff, 0.8);
      g.fillRect(S/2 - 2, S/2 - 7, 1, 1);
      // Dress detail
      g.fillStyle(0x7799cc, 0.6);
      g.fillRect(S/2 - 3, S/2 + 2, 7, 3);
    });

    // Goblin — hunched green creature with big ears and yellow eyes
    this._genTexture('hd_entity_goblin', S, S, (g) => {
      // Body shadow
      g.fillStyle(0x112211);
      g.fillRect(7, 8, 18, 22);
      // Legs
      g.fillStyle(0x338833);
      g.fillRect(8, 24, 6, 6);
      g.fillRect(18, 24, 6, 6);
      // Body
      g.fillStyle(0x44bb44);
      g.fillRect(8, 12, 16, 14);
      // Belly shading
      g.fillStyle(0x55cc55, 0.5);
      g.fillRect(11, 14, 10, 8);
      // Head
      g.fillStyle(0x55cc55);
      g.fillRect(7, 4, 18, 12);
      // Ears
      g.fillStyle(0x338833);
      g.fillRect(4, 6, 4, 6);
      g.fillRect(24, 6, 4, 6);
      g.fillStyle(0xcc4444, 0.6);
      g.fillRect(5, 7, 2, 3);
      g.fillRect(25, 7, 2, 3);
      // Eyes — large yellow with black slit
      g.fillStyle(0xffee00);
      g.fillRect(9, 6, 5, 5);
      g.fillRect(18, 6, 5, 5);
      g.fillStyle(0x221100);
      g.fillRect(11, 6, 2, 5);
      g.fillRect(20, 6, 2, 5);
      // Nose
      g.fillStyle(0x33aa33);
      g.fillRect(14, 11, 4, 2);
      // Mouth / teeth
      g.fillStyle(0x221100);
      g.fillRect(9, 14, 14, 2);
      g.fillStyle(0xeeeedd);
      g.fillRect(10, 14, 2, 3);
      g.fillRect(14, 14, 2, 3);
      g.fillRect(20, 14, 2, 3);
      // Clawed hands
      g.fillStyle(0x44bb44);
      g.fillRect(6, 16, 3, 6);
      g.fillRect(23, 16, 3, 6);
      g.fillStyle(0x222200);
      g.fillRect(6, 22, 1, 2);
      g.fillRect(8, 22, 1, 2);
      g.fillRect(23, 22, 1, 2);
      g.fillRect(25, 22, 1, 2);
    });

    // Orc — muscular warrior with armour scraps and prominent tusks
    this._genTexture('hd_entity_orc', S, S, (g) => {
      // Shadow
      g.fillStyle(0x330000);
      g.fillRect(5, 2, 22, 28);
      // Legs
      g.fillStyle(0xaa2222);
      g.fillRect(7, 22, 7, 8);
      g.fillRect(18, 22, 7, 8);
      // Body
      g.fillStyle(0xcc2222);
      g.fillRect(6, 11, 20, 13);
      // Chest armour — dark leather scraps
      g.fillStyle(0x442211);
      g.fillRect(8, 12, 7, 8);
      g.fillRect(17, 12, 7, 8);
      g.fillStyle(0x664422, 0.6);
      g.fillRect(9, 13, 5, 5);
      g.fillRect(18, 13, 5, 5);
      // Shoulder guards
      g.fillStyle(0x553311);
      g.fillRect(5, 11, 5, 5);
      g.fillRect(22, 11, 5, 5);
      // Head
      g.fillStyle(0xdd3333);
      g.fillRect(7, 2, 18, 12);
      // Brow ridge
      g.fillStyle(0x991111);
      g.fillRect(7, 2, 18, 3);
      // Eyes — fierce orange-yellow
      g.fillStyle(0xff9900);
      g.fillRect(9, 4, 5, 4);
      g.fillRect(18, 4, 5, 4);
      g.fillStyle(0xffdd00, 0.8);
      g.fillRect(11, 5, 2, 2);
      g.fillRect(20, 5, 2, 2);
      g.fillStyle(0x110000);
      g.fillRect(10, 4, 2, 4);
      g.fillRect(19, 4, 2, 4);
      // Nostrils
      g.fillStyle(0x881111);
      g.fillRect(13, 9, 2, 2);
      g.fillRect(17, 9, 2, 2);
      // Jaw / mouth
      g.fillStyle(0x661111);
      g.fillRect(9, 11, 14, 2);
      // Tusks — large and prominent
      g.fillStyle(0xeeeedd);
      g.fillRect(9, 12, 4, 7);
      g.fillRect(19, 12, 4, 7);
      g.fillStyle(0xccccbb);
      g.fillRect(10, 17, 2, 2);
      g.fillRect(20, 17, 2, 2);
      // Arms / hands
      g.fillStyle(0xcc2222);
      g.fillRect(4, 14, 4, 8);
      g.fillRect(24, 14, 4, 8);
      g.fillStyle(0xaa1111);
      g.fillRect(4, 20, 4, 4);
      g.fillRect(24, 20, 4, 4);
    });

    // Troll — hulking stone-grey mass
    this._genTexture('hd_entity_troll', S, S, (g) => {
      // Shadow
      g.fillStyle(0x080808);
      g.fillRect(2, 0, 28, 32);
      // Legs — thick stumps
      g.fillStyle(0x1e1818);
      g.fillRect(4, 22, 9, 10);
      g.fillRect(19, 22, 9, 10);
      // Body — massive
      g.fillStyle(0x2e2424);
      g.fillRect(3, 8, 26, 16);
      // Rocky texture on body
      g.fillStyle(0x383030, 0.6);
      g.fillRect(5, 10, 8, 6);
      g.fillRect(19, 12, 7, 5);
      g.fillRect(12, 17, 6, 4);
      // Head — wide and flat
      g.fillStyle(0x383030);
      g.fillRect(3, 0, 26, 10);
      // Horns
      g.fillStyle(0x4a3838);
      g.fillRect(4, 0, 5, 8);
      g.fillRect(23, 0, 5, 8);
      g.fillStyle(0x6a5050);
      g.fillRect(5, 0, 2, 5);
      g.fillRect(24, 0, 2, 5);
      // Blazing eyes — large and terrifying
      g.fillStyle(0xff5500);
      g.fillRect(7, 2, 7, 5);
      g.fillRect(18, 2, 7, 5);
      g.fillStyle(0xff9900, 0.8);
      g.fillRect(9, 3, 3, 3);
      g.fillRect(20, 3, 3, 3);
      g.fillStyle(0xffcc44, 0.6);
      g.fillRect(10, 4, 1, 1);
      g.fillRect(21, 4, 1, 1);
      // Arms
      g.fillStyle(0x282020);
      g.fillRect(0, 10, 5, 10);
      g.fillRect(27, 10, 5, 10);
      // Knuckles
      g.fillStyle(0x3a2c2c);
      g.fillRect(0, 18, 5, 4);
      g.fillRect(27, 18, 5, 4);
    });

    // Skeleton — crisp anatomical skeleton
    this._genTexture('hd_entity_skeleton', S, S, (g) => {
      // Dark background
      g.fillStyle(0x0a0a0a);
      g.fillRect(10, 0, 12, 32);
      g.fillRect(8, 12, 16, 14);
      // Skull
      g.fillStyle(0xdddddd);
      g.fillRect(9, 1, 14, 10);
      // Jaw
      g.fillStyle(0xcccccc);
      g.fillRect(10, 9, 12, 4);
      // Jaw gap
      g.fillStyle(0x0a0a0a);
      g.fillRect(13, 10, 3, 2);
      g.fillRect(17, 10, 3, 2);
      // Eye sockets — vivid red
      g.fillStyle(0xff1111);
      g.fillRect(11, 3, 4, 4);
      g.fillRect(17, 3, 4, 4);
      g.fillStyle(0xff6666, 0.6);
      g.fillRect(12, 4, 2, 2);
      g.fillRect(18, 4, 2, 2);
      // Ribcage
      g.fillStyle(0xbbbbbb);
      g.fillRect(12, 13, 8, 1);
      g.fillRect(11, 16, 10, 1);
      g.fillRect(12, 19, 8, 1);
      g.fillRect(13, 22, 6, 1);
      // Spine
      g.fillStyle(0x999999);
      g.fillRect(15, 13, 2, 12);
      // Pelvis
      g.fillStyle(0xbbbbbb);
      g.fillRect(11, 24, 10, 3);
      // Leg bones
      g.fillStyle(0xaaaaaa);
      g.fillRect(11, 27, 4, 5);
      g.fillRect(17, 27, 4, 5);
      // Arm bones
      g.fillStyle(0xaaaaaa);
      g.fillRect(7, 13, 4, 8);
      g.fillRect(21, 13, 4, 8);
      // Elbow joints
      g.fillStyle(0xbbbbbb);
      g.fillRect(7, 20, 4, 2);
      g.fillRect(21, 20, 4, 2);
    });

    // Skeleton Warrior — heavily armoured skeleton soldier
    this._genTexture('hd_entity_skeleton_warrior', S, S, (g) => {
      // Dark silhouette
      g.fillStyle(0x0a0a0a);
      g.fillRect(8, 0, 16, 32);
      g.fillRect(6, 12, 20, 16);
      // Armour plate — cool steel
      g.fillStyle(0x888888);
      g.fillRect(9, 12, 14, 14);
      // Armour highlight band
      g.fillStyle(0xcccccc);
      g.fillRect(10, 14, 12, 3);
      // Armour mid shade
      g.fillStyle(0xaaaaaa);
      g.fillRect(10, 17, 12, 9);
      // Helmet
      g.fillStyle(0x777777);
      g.fillRect(8, 0, 16, 5);
      g.fillStyle(0x999999);
      g.fillRect(9, 1, 14, 3);
      // Skull face beneath visor
      g.fillStyle(0xdddddd);
      g.fillRect(10, 4, 12, 8);
      // Jaw
      g.fillStyle(0xbbbbbb);
      g.fillRect(11, 10, 10, 3);
      // Jaw gap
      g.fillStyle(0x0a0a0a);
      g.fillRect(13, 11, 3, 2);
      g.fillRect(17, 11, 3, 2);
      // Eye sockets — red
      g.fillStyle(0xff2222);
      g.fillRect(11, 5, 4, 4);
      g.fillRect(17, 5, 4, 4);
      g.fillStyle(0xff6666, 0.5);
      g.fillRect(12, 6, 2, 2);
      g.fillRect(18, 6, 2, 2);
      // Shoulder pauldrons
      g.fillStyle(0x777777);
      g.fillRect(5, 12, 5, 6);
      g.fillRect(22, 12, 5, 6);
      g.fillStyle(0xaaaaaa);
      g.fillRect(6, 13, 3, 4);
      g.fillRect(23, 13, 3, 4);
      // Leg armour
      g.fillStyle(0x888888);
      g.fillRect(10, 26, 5, 6);
      g.fillRect(17, 26, 5, 6);
      // Leg highlight
      g.fillStyle(0xaaaaaa);
      g.fillRect(11, 27, 3, 4);
      g.fillRect(18, 27, 3, 4);
    });

    // Skeleton Mage — robed skeleton with arcane staff and vivid purple aura
    this._genTexture('hd_entity_skeleton_mage', S, S, (g) => {
      // Dark silhouette
      g.fillStyle(0x0a0010);
      g.fillRect(8, 0, 16, 32);
      g.fillRect(5, 12, 22, 20);
      // Robe — rich purple
      g.fillStyle(0x7722bb);
      g.fillRect(6, 12, 20, 20);
      // Robe shading — lower third
      g.fillStyle(0x551199);
      g.fillRect(7, 22, 18, 10);
      // Robe hem detail
      g.fillStyle(0x9944dd);
      g.fillRect(6, 12, 20, 2);
      // Skull
      g.fillStyle(0xdddddd);
      g.fillRect(10, 1, 12, 10);
      // Jaw
      g.fillStyle(0xbbbbbb);
      g.fillRect(11, 9, 10, 3);
      // Jaw gap
      g.fillStyle(0x0a0010);
      g.fillRect(13, 10, 3, 2);
      g.fillRect(17, 10, 3, 2);
      // Eye sockets — vivid arcane purple
      g.fillStyle(0xcc33ff);
      g.fillRect(11, 3, 4, 4);
      g.fillRect(17, 3, 4, 4);
      g.fillStyle(0xee99ff, 0.7);
      g.fillRect(12, 4, 2, 2);
      g.fillRect(18, 4, 2, 2);
      // Staff
      g.fillStyle(0x553300);
      g.fillRect(26, 4, 3, 26);
      // Orb housing
      g.fillStyle(0x331144);
      g.fillRect(23, 0, 9, 9);
      // Orb glow
      g.fillStyle(0xcc33ff);
      g.fillRect(24, 1, 7, 7);
      g.fillStyle(0xee99ff, 0.8);
      g.fillRect(25, 2, 5, 5);
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(26, 3, 3, 3);
    });

    // Old Bones — imposing ivory skeleton boss
    this._genTexture('hd_entity_old_bones', S, S, (g) => {
      // Large shadow
      g.fillStyle(0x111100);
      g.fillRect(4, 0, 24, 32);
      // Leg bones — thicker than regular skeleton
      g.fillStyle(0xe8e6d8);
      g.fillRect(6, 24, 7, 8);
      g.fillRect(19, 24, 7, 8);
      // Boot/foot
      g.fillStyle(0xd0cec0);
      g.fillRect(5, 29, 9, 3);
      g.fillRect(18, 29, 9, 3);
      // Ribcage torso
      g.fillStyle(0xf0eedd);
      g.fillRect(5, 12, 22, 14);
      // Rib detail — thick slabs
      g.fillStyle(0xd8d6c8);
      g.fillRect(6, 13, 5, 3);
      g.fillRect(6, 17, 5, 3);
      g.fillRect(6, 21, 5, 3);
      g.fillRect(21, 13, 5, 3);
      g.fillRect(21, 17, 5, 3);
      g.fillRect(21, 21, 5, 3);
      // Spine
      g.fillStyle(0xc8c6b8);
      g.fillRect(14, 12, 4, 14);
      // Pelvis
      g.fillStyle(0xe8e6d8);
      g.fillRect(7, 24, 18, 4);
      // Skull
      g.fillStyle(0xf8f6e8);
      g.fillRect(7, 0, 18, 13);
      // Crown of bone spikes
      g.fillStyle(0xe8e0cc);
      g.fillRect(7, 0, 3, 5);
      g.fillRect(13, 0, 4, 4);
      g.fillRect(22, 0, 3, 5);
      // Eye sockets — large, burning amber
      g.fillStyle(0xff9900);
      g.fillRect(8, 3, 6, 5);
      g.fillRect(18, 3, 6, 5);
      g.fillStyle(0xffcc44, 0.9);
      g.fillRect(10, 4, 3, 3);
      g.fillRect(20, 4, 3, 3);
      g.fillStyle(0xffee88, 0.7);
      g.fillRect(11, 5, 1, 1);
      g.fillRect(21, 5, 1, 1);
      // Jaw
      g.fillStyle(0xe8e0d0);
      g.fillRect(9, 10, 14, 4);
      // Teeth
      g.fillStyle(0xf8f8f0);
      g.fillRect(10, 12, 2, 3);
      g.fillRect(13, 12, 2, 3);
      g.fillRect(17, 12, 2, 3);
      g.fillRect(20, 12, 2, 3);
      // Arm bones
      g.fillStyle(0xe8e6d8);
      g.fillRect(2, 12, 5, 10);
      g.fillRect(25, 12, 5, 10);
      // Shoulder joints
      g.fillStyle(0xd0cebc);
      g.fillEllipse(5, 12, 7, 7);
      g.fillEllipse(27, 12, 7, 7);
    });

    // Creeping Mass — toxic electric-green multisegment blob
    this._genTexture('hd_entity_creeping_mass', S, S, (g) => {
      // Outer dark shell
      g.fillStyle(0x041404);
      g.fillRect(1, 1, 30, 30);
      // Outer ooze
      g.fillStyle(0x124412);
      g.fillRect(2, 2, 28, 28);
      // Mid layer
      g.fillStyle(0x228822);
      g.fillRect(5, 5, 22, 22);
      // Inner toxic core — vivid electric green
      g.fillStyle(0x33cc33);
      g.fillRect(9, 9, 14, 14);
      g.fillStyle(0x66ff66, 0.8);
      g.fillRect(12, 12, 8, 8);
      g.fillStyle(0x99ff99, 0.6);
      g.fillRect(14, 14, 4, 4);
      // Dark nucleus / organelles
      g.fillStyle(0x041404);
      g.fillRect(10, 10, 4, 4);
      g.fillRect(18, 18, 4, 4);
      g.fillRect(10, 18, 3, 3);
      g.fillRect(19, 10, 3, 3);
      // Pseudo-pods / drip tendrils
      g.fillStyle(0x124412);
      g.fillRect(5, 0, 4, 3);
      g.fillRect(23, 0, 4, 3);
      g.fillRect(0, 8, 2, 5);
      g.fillRect(30, 8, 2, 5);
      g.fillRect(6, 29, 3, 3);
      g.fillRect(23, 29, 3, 3);
      // Toxic drip highlights
      g.fillStyle(0x44ff44, 0.5);
      g.fillRect(5, 1, 2, 2);
      g.fillRect(25, 1, 2, 2);
    });

    // Spitter — large acid-green blob with pulsing toxic core and spit gland
    this._genTexture('hd_entity_spitter', S, S, (g) => {
      // Dark outer shell
      g.fillStyle(0x0f2200);
      g.fillRect(3, 6, 22, 18);
      // Acid-green body
      g.fillStyle(0x558811);
      g.fillRect(4, 7, 20, 16);
      // Toxic inner core — bright
      g.fillStyle(0x99cc22);
      g.fillRect(6, 9, 14, 12);
      // Core highlight
      g.fillStyle(0xbbee44);
      g.fillRect(8, 11, 8, 8);
      // Spit gland — neon protrusion on right side
      g.fillStyle(0xccff00);
      g.fillRect(22, 10, 7, 8);
      g.fillStyle(0xeeff66, 0.9);
      g.fillRect(24, 12, 4, 4);
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(25, 13, 2, 2);
      // Eyes — large toxic yellow
      g.fillStyle(0xffff00);
      g.fillRect(7, 9, 4, 4);
      g.fillRect(14, 9, 4, 4);
      g.fillStyle(0x003300);
      g.fillRect(8, 10, 2, 2);
      g.fillRect(15, 10, 2, 2);
      // Acid drips
      g.fillStyle(0x558811);
      g.fillRect(6, 23, 3, 4);
      g.fillRect(13, 24, 3, 3);
      g.fillRect(20, 23, 3, 4);
      // Toxic drip highlights
      g.fillStyle(0x99cc22, 0.7);
      g.fillRect(7, 24, 1, 3);
      g.fillRect(21, 24, 1, 3);
    });

    // Elder — robed sage with detailed staff and beard
    this._genTexture('hd_entity_npc_elder', S, S, (g) => {
      // Robe — wide ivory white
      g.fillStyle(0x888877);
      g.fillRect(4, 16, 20, 16);
      g.fillStyle(0xf0f0e8);
      g.fillRect(5, 17, 18, 15);
      g.fillTriangle(5, 32, 23, 32, 14, 17);
      // Gold trim on robe hem
      g.fillStyle(0xddbb44);
      g.fillRect(5, 17, 18, 1);
      g.fillRect(5, 29, 18, 1);
      // Body
      g.fillStyle(0xe8e8e0);
      g.fillRect(10, 12, 12, 8);
      // Arms in sleeves
      g.fillStyle(0xd8d8d0);
      g.fillRect(6, 14, 5, 10);
      g.fillRect(21, 14, 5, 10);
      // Head
      g.fillStyle(0xffddbf);
      g.fillEllipse(S/2, 9, 14, 14);
      // White hair / wisps
      g.fillStyle(0xeeeeee);
      g.fillRect(5, 5, 4, 5);
      g.fillRect(23, 5, 4, 5);
      g.fillRect(9, 3, 14, 3);
      // White beard — flowing downward
      g.fillStyle(0xffffff);
      g.fillTriangle(8, 14, 22, 14, 15, 22);
      g.fillStyle(0xdddddd, 0.7);
      g.fillRect(10, 16, 10, 3);
      // Eyes
      g.fillStyle(0x334466);
      g.fillRect(11, 8, 3, 3);
      g.fillRect(18, 8, 3, 3);
      g.fillStyle(0x88aabb, 0.8);
      g.fillRect(12, 8, 1, 1);
      g.fillRect(19, 8, 1, 1);
      // Eyebrows — white bushy
      g.fillStyle(0xffffff);
      g.fillRect(10, 6, 5, 2);
      g.fillRect(17, 6, 5, 2);
      // Staff — ornate gold with glowing orb
      g.fillStyle(0xaa8822);
      g.fillRect(25, 0, 3, 32);
      // Staff orb
      g.fillStyle(0x113355);
      g.fillEllipse(26, 4, 8, 8);
      g.fillStyle(0x88ccff);
      g.fillEllipse(26, 4, 6, 6);
      g.fillStyle(0xcceeff, 0.8);
      g.fillRect(25, 2, 3, 3);
    });

    // Guard — full polished plate armour with red-crested helmet
    this._genTexture('hd_entity_npc_guard', S, S, (g) => {
      // Shadow
      g.fillStyle(0x111822);
      g.fillRect(5, 0, 22, 32);
      // Sabatons (armoured boots)
      g.fillStyle(0x6688aa);
      g.fillRect(6, 26, 8, 6);
      g.fillRect(18, 26, 8, 6);
      // Greaves
      g.fillStyle(0x7898bb);
      g.fillRect(7, 20, 7, 8);
      g.fillRect(18, 20, 7, 8);
      // Tassets (hip plates)
      g.fillStyle(0x6888aa);
      g.fillRect(7, 18, 7, 4);
      g.fillRect(18, 18, 7, 4);
      // Breastplate — main torso
      g.fillStyle(0x7898bb);
      g.fillRect(7, 10, 18, 10);
      // Chest highlight
      g.fillStyle(0x99bbdd, 0.7);
      g.fillRect(9, 11, 6, 5);
      // Pauldrons (shoulder armour)
      g.fillStyle(0x5878a0);
      g.fillRect(5, 10, 4, 6);
      g.fillRect(23, 10, 4, 6);
      g.fillStyle(0x7898bb, 0.7);
      g.fillRect(5, 10, 4, 2);
      // Gorget + neck
      g.fillStyle(0x6888aa);
      g.fillRect(12, 8, 8, 4);
      // Helmet — full visored
      g.fillStyle(0x5878a0);
      g.fillRect(7, 0, 18, 10);
      // Helmet crest — vivid red
      g.fillStyle(0xcc2200);
      g.fillRect(13, 0, 6, 4);
      g.fillStyle(0xff3300);
      g.fillRect(14, 0, 4, 3);
      // Visor slit — bright cyan
      g.fillStyle(0x00ddff);
      g.fillRect(8, 5, 16, 3);
      g.fillStyle(0x88eeff, 0.7);
      g.fillRect(9, 5, 14, 1);
      // Spear handle — steel
      g.fillStyle(0x99aacc);
      g.fillRect(29, 0, 3, 32);
      // Spear tip
      g.fillStyle(0xddeeff);
      g.fillTriangle(29, 0, 32, 0, 30, 6);
      // Gauntlets
      g.fillStyle(0x6888aa);
      g.fillRect(5, 14, 3, 6);
      g.fillRect(24, 14, 3, 6);
    });

    // Merchant — rich emerald cloak with coin-stuffed pack
    this._genTexture('hd_entity_npc_merchant', S, S, (g) => {
      // Shadow
      g.fillStyle(0x0a1a0a);
      g.fillRect(5, 0, 22, 32);
      // Feet / shoes — brown leather
      g.fillStyle(0x6a3a18);
      g.fillRect(8, 28, 6, 4);
      g.fillRect(18, 28, 6, 4);
      // Deep emerald cloak body
      g.fillStyle(0x115522);
      g.fillRect(5, 14, 22, 18);
      g.fillStyle(0x22aa44);
      g.fillRect(6, 15, 20, 17);
      // Cloak fold highlights
      g.fillStyle(0x33cc55, 0.5);
      g.fillRect(7, 16, 4, 12);
      g.fillRect(18, 18, 4, 10);
      // Cloak hem embroidery
      g.fillStyle(0xddaa22);
      g.fillRect(6, 30, 20, 1);
      g.fillRect(6, 15, 20, 1);
      // Body under cloak
      g.fillStyle(0x224422);
      g.fillRect(10, 10, 12, 8);
      // Hood
      g.fillStyle(0x117733);
      g.fillRect(8, 4, 16, 12);
      g.fillStyle(0x0a5522);
      g.fillRect(8, 4, 16, 2);
      // Face
      g.fillStyle(0xffddbb);
      g.fillEllipse(S/2, 10, 12, 12);
      // Eyes — friendly crinkled
      g.fillStyle(0x664422);
      g.fillRect(11, 8, 3, 2);
      g.fillRect(18, 8, 3, 2);
      // Smile wrinkles
      g.fillStyle(0xddaa99);
      g.fillRect(11, 12, 3, 1);
      g.fillRect(18, 12, 3, 1);
      // Smile
      g.fillStyle(0x884422);
      g.fillRect(13, 13, 6, 1);
      // Coin purse — fat and golden
      g.fillStyle(0x220d00);
      g.fillEllipse(S/2 + 7, S - 4, 14, 14);
      g.fillStyle(0xffbb00);
      g.fillEllipse(S/2 + 7, S - 5, 12, 12);
      g.fillStyle(0xffdd66);
      g.fillEllipse(S/2 + 6, S - 7, 8, 8);
      // Bag tie
      g.fillStyle(0xcc8800);
      g.fillRect(S/2 + 5, S - 12, 4, 2);
    });

    // Warrior — Martel the Varangian: full figure, horned nasal helm, grey beard, broad axe
    this._genTexture('hd_entity_npc_warrior', S, S, (g) => {
      // Shadow
      g.fillStyle(0x1a1008);
      g.fillRect(5, 0, 22, 32);
      // Boots — cracked dark leather
      g.fillStyle(0x3a2210);
      g.fillRect(6, 26, 8, 6);
      g.fillRect(18, 26, 8, 6);
      // Boot strap bands
      g.fillStyle(0x553322);
      g.fillRect(7, 27, 6, 1);
      g.fillRect(19, 27, 6, 1);
      // Leg wraps — rough patched cloth
      g.fillStyle(0x4a3828);
      g.fillRect(7, 20, 7, 8);
      g.fillRect(18, 20, 7, 8);
      // Wrap binding lines
      g.fillStyle(0x3a2818);
      g.fillRect(8, 22, 5, 1);
      g.fillRect(19, 22, 5, 1);
      g.fillRect(8, 25, 5, 1);
      g.fillRect(19, 25, 5, 1);
      // Mail hauberk body — tarnished iron
      g.fillStyle(0x505068);
      g.fillRect(7, 10, 18, 12);
      // Mail ring rows (horizontal stripe detail)
      g.fillStyle(0x3a3a52);
      g.fillRect(7, 11, 18, 1);
      g.fillRect(7, 13, 18, 1);
      g.fillRect(7, 15, 18, 1);
      g.fillRect(7, 17, 18, 1);
      // Mail chest shine — worn bright patch
      g.fillStyle(0x7080a0, 0.5);
      g.fillRect(9, 11, 5, 6);
      // Pauldrons — aged leather shoulder guards
      g.fillStyle(0x7a5c30);
      g.fillRect(5, 10, 4, 7);
      g.fillRect(23, 10, 4, 7);
      // Belt — dark cracked leather
      g.fillStyle(0x442211);
      g.fillRect(7, 20, 18, 2);
      // Belt buckle — tarnished bronze
      g.fillStyle(0x996633);
      g.fillRect(S/2 - 2, 20, 4, 2);
      // Neck / mail coif base
      g.fillStyle(0x404058);
      g.fillRect(12, 8, 8, 3);
      // Head — weathered skin
      g.fillStyle(0xcc9966);
      g.fillEllipse(S/2, 6, 14, 12);
      // Beard — long and grey (years in the dungeon)
      g.fillStyle(0xbbbbcc);
      g.fillTriangle(8, 11, 24, 11, 16, 23);
      // Beard streak highlights
      g.fillStyle(0xddddee, 0.5);
      g.fillRect(12, 12, 3, 7);
      g.fillRect(17, 13, 3, 6);
      // Moustache — thick grey
      g.fillStyle(0xaaaacc);
      g.fillRect(11, 9, 10, 2);
      // Eyes — steady but weary
      g.fillStyle(0x2a1a08);
      g.fillRect(10, 4, 4, 3);
      g.fillRect(18, 4, 4, 3);
      g.fillStyle(0xeeddcc);
      g.fillRect(11, 4, 2, 2);
      g.fillRect(19, 4, 2, 2);
      g.fillStyle(0x4a3a28);
      g.fillRect(12, 4, 1, 2);
      g.fillRect(20, 4, 1, 2);
      // Eyebrows — heavy and greying
      g.fillStyle(0x998877);
      g.fillRect(9, 3, 6, 1);
      g.fillRect(17, 3, 6, 1);
      // Helmet — dark iron nasal helm
      g.fillStyle(0x334455);
      g.fillRect(8, 0, 16, 7);
      // Helmet shine
      g.fillStyle(0x556688, 0.5);
      g.fillRect(9, 0, 7, 3);
      // Nasal guard — vertical strip over face
      g.fillStyle(0x223344);
      g.fillRect(S/2 - 1, 2, 2, 6);
      // Helmet rim band
      g.fillStyle(0x223344);
      g.fillRect(7, 6, 18, 2);
      // Axe handle — rune-carved dark wood
      g.fillStyle(0x553311);
      g.fillRect(29, 4, 3, 28);
      // Rune notches on handle
      g.fillStyle(0x884422, 0.6);
      g.fillRect(29, 10, 3, 1);
      g.fillRect(29, 17, 3, 1);
      g.fillRect(29, 24, 3, 1);
      // Axe head — broad bearded blade
      g.fillStyle(0x445566);
      g.fillRect(24, 0, 8, 12);
      // Axe cutting edge — bright worn iron
      g.fillStyle(0x8899bb);
      g.fillTriangle(24, 0, 32, 0, 29, 12);
      // Edge highlight
      g.fillStyle(0xaabbdd);
      g.fillRect(31, 0, 1, 9);
      // Axe poll (butt)
      g.fillStyle(0x445566);
      g.fillRect(29, 11, 3, 4);
      // Horns drawn last so the right horn renders over the axe head
      g.fillStyle(0xddcc99);
      g.fillRect(3, 0, 5, 7);
      g.fillRect(24, 0, 5, 7);
      // Horn leather wrap (base)
      g.fillStyle(0x553322);
      g.fillRect(3, 5, 5, 2);
      g.fillRect(24, 5, 5, 2);
      // Horn tip taper (darker)
      g.fillStyle(0xccbb88);
      g.fillRect(4, 0, 3, 2);
      g.fillRect(25, 0, 3, 2);
    });
  }

  // ---------------------------------------------------------------------------
  // HD item textures  (prefix: 'hd_', size: 32×32)
  // ---------------------------------------------------------------------------

  /** Generates hd_ prefixed 32×32 item sprite textures. */
  _createHdItemTextures() {
    const S = 32;

    // Health potion — ruby vial with glass caustic and bubbles
    this._genTexture('hd_item_potion_health', S, S, (g) => {
      // Outline shadow
      g.fillStyle(0x330011);
      g.fillEllipse(S/2, S * 0.6, 18, 20);
      g.fillRect(S/2 - 4, S * 0.22, 9, 14);
      // Vial body — deep red fill
      g.fillStyle(0xcc0033);
      g.fillEllipse(S/2, S * 0.6, 16, 18);
      // Liquid highlight — lighter at top (light refraction)
      g.fillStyle(0xee2255);
      g.fillEllipse(S/2, S * 0.53, 12, 10);
      // Neck — narrow glass
      g.fillStyle(0x990022);
      g.fillRect(S/2 - 3, S * 0.24, 7, 12);
      g.fillStyle(0xcc1144, 0.5);
      g.fillRect(S/2, S * 0.25, 2, 10);
      // Cork — warm amber
      g.fillStyle(0x885500);
      g.fillRect(S/2 - 3, S * 0.14, 7, 7);
      g.fillStyle(0xddaa55);
      g.fillRect(S/2 - 2, S * 0.15, 5, 5);
      // Glass shine — left-side specular
      g.fillStyle(0xff88aa, 0.8);
      g.fillRect(S/2 - 6, S * 0.52, 4, 8);
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(S/2 - 5, S * 0.54, 2, 5);
      // Bubble detail inside liquid
      g.fillStyle(0xff6688, 0.5);
      g.fillRect(S/2 + 2, S * 0.6, 3, 3);
      g.fillRect(S/2 - 1, S * 0.68, 2, 2);
    });

    // Weapon — longsword with detailed blade, guard, and wrapped grip
    this._genTexture('hd_item_weapon', S, S, (g) => {
      // Blade shadow
      g.fillStyle(0x222233);
      g.fillRect(S/2 - 3, 1, 7, 22);
      // Blade — mirror-polished steel
      g.fillStyle(0xccccdd);
      g.fillRect(S/2 - 2, 1, 5, 21);
      // Blade edge — bright
      g.fillStyle(0xeeeeff);
      g.fillRect(S/2 - 1, 2, 3, 19);
      // Central fuller (groove down the centre)
      g.fillStyle(0x8888aa, 0.6);
      g.fillRect(S/2, 3, 1, 17);
      // Blade shine highlight
      g.fillStyle(0xffffff, 0.7);
      g.fillRect(S/2 - 1, 2, 2, 6);
      // Cross-guard — gold with shadow
      g.fillStyle(0x221100);
      g.fillRect(S/2 - 8, 20, 17, 5);
      g.fillStyle(0xffcc00);
      g.fillRect(S/2 - 7, 21, 15, 4);
      g.fillStyle(0xffee88, 0.6);
      g.fillRect(S/2 - 6, 21, 13, 1);
      // Guard end caps (round)
      g.fillStyle(0xddaa00);
      g.fillRect(S/2 - 8, 22, 2, 2);
      g.fillRect(S/2 + 6, 22, 2, 2);
      // Grip — leather wrap
      g.fillStyle(0x7a3a18);
      g.fillRect(S/2 - 1, 25, 3, 5);
      g.fillStyle(0x5a2a10);
      g.fillRect(S/2 - 1, 26, 3, 1);
      g.fillRect(S/2 - 1, 28, 3, 1);
      // Pommel — faceted gold sphere
      g.fillStyle(0x443300);
      g.fillRect(S/2 - 3, 29, 7, 3);
      g.fillStyle(0xffcc00);
      g.fillRect(S/2 - 2, 30, 5, 2);
      g.fillStyle(0xffee88, 0.7);
      g.fillRect(S/2 - 1, 30, 3, 1);
    });

    // Armor — heater shield with metallic face, rivets, and gem boss
    this._genTexture('hd_item_armor', S, S, (g) => {
      // Outline
      g.fillStyle(0x0a1620);
      g.fillRect(3, 1, 26, 20);
      g.fillTriangle(3, 21, 29, 21, S/2, 31);
      // Shield face — layered blue steel
      g.fillStyle(0x3366aa);
      g.fillRect(4, 2, 24, 18);
      g.fillTriangle(4, 20, 28, 20, S/2, 30);
      // Upper highlight — lighter quadrant (light catch)
      g.fillStyle(0x5588cc, 0.7);
      g.fillRect(4, 2, 12, 9);
      // Steel rivets at corners
      g.fillStyle(0xaabbcc);
      g.fillRect(5, 3, 2, 2);
      g.fillRect(25, 3, 2, 2);
      g.fillRect(5, 17, 2, 2);
      g.fillRect(25, 17, 2, 2);
      // Gold cross boss
      g.fillStyle(0x221100);
      g.fillRect(S/2 - 3, 4, 7, 18);
      g.fillRect(5, 11, 22, 7);
      g.fillStyle(0xffcc00);
      g.fillRect(S/2 - 2, 5, 5, 16);
      g.fillRect(6, 12, 20, 5);
      // Central gem — large ruby
      g.fillStyle(0x550011);
      g.fillRect(S/2 - 2, 12, 5, 5);
      g.fillStyle(0xff1133);
      g.fillRect(S/2 - 1, 13, 3, 3);
      g.fillStyle(0xff7799, 0.8);
      g.fillRect(S/2 - 1, 13, 2, 1);
      // Raised edge trim
      g.fillStyle(0x7799bb);
      g.fillRect(4, 2, 24, 1);
      g.fillRect(4, 2, 1, 18);
    });

    // Ranged weapon — detailed 32×32 bow with shaded stave and arrow
    this._genTexture('hd_item_ranged_weapon', S, S, (g) => {
      // Bow stave shadow
      g.fillStyle(0x331100);
      g.fillRect(S/2 - 3, 2, 5, 28);
      // Stave body
      g.fillStyle(0xaa6633);
      g.fillRect(S/2 - 2, 2, 4, 28);
      // Stave highlight
      g.fillStyle(0xddaa66, 0.8);
      g.fillRect(S/2 + 1, 3, 1, 26);
      // Dark inner edge for depth
      g.fillStyle(0x774422);
      g.fillRect(S/2 - 2, 3, 1, 26);
      // Bowstring
      g.fillStyle(0xeeeedd);
      g.fillRect(S/2 - 7, 3, 2, 1);    // top anchor
      g.fillRect(S/2 - 7, 28, 2, 1);   // bottom anchor
      g.fillRect(S/2 - 6, 4, 1, 5);    // top run
      g.fillRect(S/2 - 6, 23, 1, 5);   // bottom run
      g.fillRect(S/2 - 5, 9, 1, 3);    // mid-top
      g.fillRect(S/2 - 5, 20, 1, 3);   // mid-bottom
      g.fillRect(S/2 - 4, 12, 1, 8);   // centre run
      // Arrow shaft
      g.fillStyle(0xbbaa77);
      g.fillRect(6, S/2 - 1, 18, 2);
      // Arrowhead
      g.fillStyle(0xcccccc);
      g.fillRect(4, S/2 - 3, 4, 6);
      g.fillStyle(0xaaaaaa);
      g.fillRect(4, S/2 - 1, 2, 2);
      // Fletching
      g.fillStyle(0xcc4444);
      g.fillRect(22, S/2 - 3, 2, 3);
      g.fillRect(22, S/2, 2, 3);
    });

    // Bone Blade — pale ivory weapon with detailed serrations and amber pommel
    this._genTexture('hd_item_bone_blade', S, S, (g) => {
      // Blade shadow
      g.fillStyle(0x333322);
      g.fillRect(S/2 - 3, 0, 7, 22);
      // Blade — bright ivory
      g.fillStyle(0xf0eedd);
      g.fillRect(S/2 - 2, 1, 5, 20);
      // Serrated left edge — five prominent notches
      g.fillStyle(0xccccaa);
      for (let i = 0; i < 5; i++) {
        g.fillRect(S/2 - 3, 2 + i * 4, 2, 2);
      }
      // Blade tip
      g.fillStyle(0xf8f6e0);
      g.fillTriangle(S/2 - 2, 1, S/2 + 3, 1, S/2, 0);
      // Blade shine
      g.fillStyle(0xffffff, 0.7);
      g.fillRect(S/2, 2, 2, 16);
      // Bone grain texture
      g.fillStyle(0xe0dec8, 0.5);
      g.fillRect(S/2 - 1, 5, 3, 1);
      g.fillRect(S/2 - 1, 10, 3, 1);
      g.fillRect(S/2 - 1, 15, 3, 1);
      // Guard — amber gold
      g.fillStyle(0x331100);
      g.fillRect(S/2 - 8, 20, 17, 5);
      g.fillStyle(0xff9900);
      g.fillRect(S/2 - 7, 21, 15, 4);
      g.fillStyle(0xffcc44, 0.7);
      g.fillRect(S/2 - 6, 21, 13, 1);
      // Bone handle
      g.fillStyle(0xe8e0cc);
      g.fillRect(S/2 - 2, 25, 5, 6);
      g.fillStyle(0xd0c8b0);
      g.fillRect(S/2 - 2, 26, 5, 1);
      g.fillRect(S/2 - 2, 28, 5, 1);
      // Pommel — ivory sphere
      g.fillStyle(0xf0e8d8);
      g.fillRect(S/2 - 3, 30, 7, 2);
    });

    // Night Cloak — midnight-blue flowing cloak with void shimmer
    this._genTexture('hd_item_night_cloak', S, S, (g) => {
      // Outline
      g.fillStyle(0x04040e);
      g.fillRect(4, 2, 24, 22);
      g.fillTriangle(4, 24, 28, 24, S/2, S - 2);
      // Cloak body — deep midnight blue
      g.fillStyle(0x0a0d2a);
      g.fillRect(5, 3, 22, 20);
      g.fillTriangle(5, 23, 27, 23, S/2, S - 3);
      // Left shadow panel
      g.fillStyle(0x050818);
      g.fillRect(5, 3, 7, 18);
      // Right panel — slightly lighter
      g.fillStyle(0x0f1440);
      g.fillRect(13, 3, 14, 16);
      // Blue-shadow sheen streaks
      g.fillStyle(0x2244aa, 0.4);
      g.fillRect(7, 5, 3, 12);
      g.fillStyle(0x4466dd, 0.25);
      g.fillRect(8, 6, 1, 9);
      g.fillRect(18, 8, 2, 6);
      // Hood opening — dark void
      g.fillStyle(0x000005);
      g.fillRect(9, 3, 14, 5);
      // Subtle clasp
      g.fillStyle(0x334466);
      g.fillRect(S/2 - 2, 6, 4, 3);
      g.fillStyle(0x6688bb);
      g.fillRect(S/2 - 1, 7, 2, 1);
    });

    // Null Scimitar — void-energy curved blade with dark-purple aura
    this._genTexture('hd_item_null_scimitar', S, S, (g) => {
      // Blade shadow
      g.fillStyle(0x0d0018);
      g.fillRect(S/2 - 4, 0, 9, 22);
      g.fillRect(S/2, 3, 7, 14);
      // Void blade — deep purple
      g.fillStyle(0x5500aa);
      g.fillRect(S/2 - 3, 1, 6, 20);
      g.fillRect(S/2 + 1, 3, 5, 12);
      // Blade edge sheen
      g.fillStyle(0xaa33ff, 0.8);
      g.fillRect(S/2 - 1, 2, 2, 18);
      g.fillRect(S/2 + 3, 4, 2, 8);
      // Void energy sparkles
      g.fillStyle(0xee88ff, 0.6);
      g.fillRect(S/2, 4, 1, 1);
      g.fillRect(S/2, 9, 1, 1);
      g.fillRect(S/2, 14, 1, 1);
      g.fillRect(S/2 + 4, 6, 1, 1);
      g.fillRect(S/2 + 4, 10, 1, 1);
      // Guard
      g.fillStyle(0x1a0030);
      g.fillRect(S/2 - 9, 20, 18, 5);
      g.fillStyle(0x6622aa);
      g.fillRect(S/2 - 8, 21, 16, 4);
      g.fillStyle(0xaa66cc, 0.6);
      g.fillRect(S/2 - 7, 21, 14, 1);
      // Handle wrapping
      g.fillStyle(0x334444);
      g.fillRect(S/2 - 3, 25, 7, 8);
      g.fillStyle(0x4a5566);
      for (let i = 0; i < 4; i++) g.fillRect(S/2 - 3, 26 + i * 2, 7, 1);
      // Pommel
      g.fillStyle(0x220044);
      g.fillRect(S/2 - 4, 32, 9, 3);
      g.fillStyle(0x8833bb);
      g.fillRect(S/2 - 2, 33, 5, 2);
    });

    // Key to Elsewhere — ornate golden key with glowing arcane portal sigil
    this._genTexture('hd_item_key_to_elsewhere', S, S, (g) => {
      // Outline
      g.fillStyle(0x331100);
      g.fillRect(S/2 - 4, 2, 8, 22);
      g.fillRect(S/2 - 8, 2, 16, 9);
      // Shaft — warm layered gold
      g.fillStyle(0xcc9933);
      g.fillRect(S/2 - 3, 3, 7, 20);
      g.fillStyle(0xeecc44);
      g.fillRect(S/2 - 2, 4, 5, 18);
      // Bow (head) — decorative ring
      g.fillStyle(0xeedd55);
      g.fillRect(S/2 - 7, 3, 14, 8);
      g.fillStyle(0x221100);
      g.fillRect(S/2 - 4, 4, 8, 6);
      // Bow inner arch highlight
      g.fillStyle(0xfff0aa, 0.5);
      g.fillRect(S/2 - 6, 3, 12, 2);
      // Gold shaft shine
      g.fillStyle(0xffffff, 0.35);
      g.fillRect(S/2 - 1, 5, 2, 15);
      // Teeth (bit)
      g.fillStyle(0xeedd55);
      g.fillRect(S/2 + 3, 16, 4, 3);
      g.fillRect(S/2 + 3, 20, 4, 2);
      g.fillRect(S/2 + 3, 23, 3, 2);
      // Arcane portal sigil in bow — blue rune glow
      g.fillStyle(0x4488ff, 0.7);
      g.fillRect(S/2 - 2, 5, 4, 1);
      g.fillRect(S/2 - 2, 9, 4, 1);
      g.fillRect(S/2 - 3, 6, 1, 3);
      g.fillRect(S/2 + 2, 6, 1, 3);
      // Centre sigil gem
      g.fillStyle(0x99ccff);
      g.fillRect(S/2 - 1, 7, 2, 1);
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(S/2, 7, 1, 1);
    });

    // Eclipse Blade HD — void-forged blade that drinks surrounding light
    this._genTexture('hd_item_eclipse_blade', S, S, (g) => {
      // Blade shadow silhouette
      g.fillStyle(0x020204);
      g.fillRect(S/2 - 4, 0, 9, 22);
      // Blade body — near-absolute black with blue-void tint
      g.fillStyle(0x06060f);
      g.fillRect(S/2 - 3, 1, 7, 20);
      // Edge bevel — left
      g.fillStyle(0x0a0a1a, 0.8);
      g.fillRect(S/2 - 2, 2, 2, 18);
      // Eclipse shimmer — faint midnight-blue centre streak
      g.fillStyle(0x151540, 0.6);
      g.fillRect(S/2, 3, 2, 16);
      // Void sparkles along blade
      g.fillStyle(0x2020aa, 0.5);
      g.fillRect(S/2, 5, 1, 1);
      g.fillRect(S/2 + 1, 10, 1, 1);
      g.fillRect(S/2, 15, 1, 1);
      // Guard — dark iron, wide
      g.fillStyle(0x0e0e0e);
      g.fillRect(S/2 - 10, 22, 20, 4);
      g.fillStyle(0x1c1c2a);
      g.fillRect(S/2 - 9, 23, 18, 2);
      // Handle — dark wrapped grip
      g.fillStyle(0x080808);
      g.fillRect(S/2 - 3, 26, 7, 7);
      g.fillStyle(0x151515);
      for (let i = 0; i < 3; i++) g.fillRect(S/2 - 3, 27 + i * 2, 7, 1);
      // Pommel
      g.fillStyle(0x0c0c1c);
      g.fillRect(S/2 - 4, 33, 9, 3);
      g.fillStyle(0x1e1e44);
      g.fillRect(S/2 - 2, 34, 5, 1);
    });

    // Key to Beyond HD — massive iron key bearing indecipherable void runes
    this._genTexture('hd_item_key_to_beyond', S, S, (g) => {
      // Outline
      g.fillStyle(0x0a0a0a);
      g.fillRect(S/2 - 5, 2, 10, 24);
      g.fillRect(S/2 - 9, 2, 18, 11);
      // Shaft — dark layered iron
      g.fillStyle(0x252525);
      g.fillRect(S/2 - 4, 3, 8, 22);
      g.fillStyle(0x303030);
      g.fillRect(S/2 - 3, 4, 6, 20);
      // Bow — heavy chunky ring
      g.fillStyle(0x383838);
      g.fillRect(S/2 - 8, 3, 16, 10);
      g.fillStyle(0x0d0d0d);
      g.fillRect(S/2 - 5, 4, 10, 8);
      // Bow inner highlight
      g.fillStyle(0x555566, 0.3);
      g.fillRect(S/2 - 7, 3, 14, 2);
      // Shaft shine
      g.fillStyle(0x666677, 0.25);
      g.fillRect(S/2 - 2, 5, 2, 17);
      // Teeth — wide heavy notches
      g.fillStyle(0x383838);
      g.fillRect(S/2 + 4, 18, 5, 4);
      g.fillRect(S/2 + 4, 23, 6, 4);
      g.fillRect(S/2 + 4, 28, 4, 3);
      // Rune etchings — faint dark crimson marks along shaft
      g.fillStyle(0x660000, 0.65);
      g.fillRect(S/2 - 2, 8, 2, 1);
      g.fillRect(S/2 - 1, 12, 3, 1);
      g.fillRect(S/2 - 2, 16, 2, 1);
      g.fillRect(S/2 - 1, 20, 2, 1);
      // Dim rune glow
      g.fillStyle(0x330000, 0.4);
      g.fillRect(S/2 - 3, 9, 1, 1);
      g.fillRect(S/2 + 2, 13, 1, 1);
    });

    // Skeleton Shield — bone-white with skull motif and purple soul gem
    this._genTexture('hd_item_skeleton_shield', S, S, (g) => {
      // Outline
      g.fillStyle(0x222211);
      g.fillRect(3, 1, 26, 20);
      g.fillTriangle(3, 21, 29, 21, S/2, 31);
      // Bone face — rich ivory
      g.fillStyle(0xeeeedd);
      g.fillRect(4, 2, 24, 18);
      g.fillTriangle(4, 20, 28, 20, S/2, 30);
      // Bone texture bands (horizontal grain)
      g.fillStyle(0xe0dec8, 0.4);
      g.fillRect(5, 5, 22, 1);
      g.fillRect(5, 10, 22, 1);
      g.fillRect(5, 15, 22, 1);
      // Skull face in the upper half
      g.fillStyle(0xd8d8cc);
      g.fillRect(10, 3, 12, 8);
      // Skull eye sockets
      g.fillStyle(0x0a0a0a);
      g.fillRect(11, 5, 3, 3);
      g.fillRect(18, 5, 3, 3);
      // Skull teeth
      g.fillRect(12, 10, 2, 2);
      g.fillRect(15, 10, 2, 2);
      g.fillRect(18, 10, 2, 2);
      // Crossed bones lower half
      g.fillStyle(0xe8e8d8);
      // Bone 1 (top-left to bottom-right)
      g.fillRect(6, 14, 4, 4);
      g.fillRect(9, 17, 14, 4);
      g.fillRect(22, 14, 4, 4);
      // Cross-arms on bones
      g.fillStyle(0xddddcc);
      g.fillRect(6, 14, 4, 1);
      g.fillRect(22, 14, 4, 1);
      // Soul gem — large deep purple
      g.fillStyle(0x220033);
      g.fillRect(S/2 - 3, 12, 7, 7);
      g.fillStyle(0x8822cc);
      g.fillRect(S/2 - 2, 13, 5, 5);
      g.fillStyle(0xbb55ff, 0.8);
      g.fillRect(S/2 - 1, 14, 3, 3);
      g.fillStyle(0xddaaff, 0.6);
      g.fillRect(S/2 - 1, 14, 2, 1);
      // Raised bone border
      g.fillStyle(0xf8f8ee);
      g.fillRect(4, 2, 24, 1);
      g.fillRect(4, 2, 1, 18);
    });

    // Teleport potion — deep violet vial with swirling cosmic effect
    this._genTexture('hd_item_potion_teleport', S, S, (g) => {
      // Outline
      g.fillStyle(0x110022);
      g.fillEllipse(S/2, S * 0.6, 18, 20);
      g.fillRect(S/2 - 4, S * 0.22, 9, 14);
      // Vial body — deep violet
      g.fillStyle(0x6611aa);
      g.fillEllipse(S/2, S * 0.6, 16, 18);
      // Swirling inner liquid — lighter bands
      g.fillStyle(0x8833cc);
      g.fillEllipse(S/2, S * 0.54, 12, 10);
      g.fillStyle(0xaa55dd, 0.6);
      g.fillEllipse(S/2 - 1, S * 0.58, 7, 7);
      // Neck
      g.fillStyle(0x440088);
      g.fillRect(S/2 - 3, S * 0.24, 7, 12);
      g.fillStyle(0x8822bb, 0.5);
      g.fillRect(S/2, S * 0.25, 2, 10);
      // Cork
      g.fillStyle(0x885500);
      g.fillRect(S/2 - 3, S * 0.14, 7, 7);
      g.fillStyle(0xddaa55);
      g.fillRect(S/2 - 2, S * 0.15, 5, 5);
      // Glass shine
      g.fillStyle(0xbb88ff, 0.7);
      g.fillRect(S/2 - 6, S * 0.52, 4, 8);
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(S/2 - 5, S * 0.54, 2, 5);
      // Cosmic sparkles around vial
      g.fillStyle(0xeeddff, 0.9);
      g.fillRect(S/2 + 4, S * 0.38, 2, 2);
      g.fillRect(S/2 + 6, S * 0.52, 2, 2);
      g.fillRect(S/2 + 3, S * 0.65, 2, 2);
      g.fillRect(S/2 - 8, S * 0.48, 2, 2);
      g.fillRect(S/2 - 6, S * 0.62, 2, 2);
      // Star centres
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(S/2 + 5, S * 0.39, 1, 1);
      g.fillRect(S/2 + 4, S * 0.66, 1, 1);
    });

    // Home Seeking Scroll — detailed parchment with portal rune (HD)
    this._genTexture('hd_item_home_seeking_scroll', S, S, (g) => {
      // Drop shadow
      g.fillStyle(0x887733, 0.4);
      g.fillRect(8, 8, 18, 18);
      // Parchment body
      g.fillStyle(0xeedd99);
      g.fillRect(6, 6, 18, 18);
      // Parchment edge detail
      g.fillStyle(0xddcc88);
      g.fillRect(6, 6, 18, 3);
      g.fillRect(6, 21, 18, 3);
      // Rolled end highlights
      g.fillStyle(0xffeebb, 0.7);
      g.fillRect(7, 7, 16, 1);
      g.fillRect(7, 22, 16, 1);
      // Portal rune — glowing cyan frame
      g.fillStyle(0x00ddff);
      g.fillRect(S/2 - 3, 10, 6, 2);
      g.fillRect(S/2 - 4, 12, 2, 6);
      g.fillRect(S/2 + 2, 12, 2, 6);
      g.fillRect(S/2 - 3, 18, 6, 2);
      // Inner rune glow
      g.fillStyle(0x44eeff, 0.8);
      g.fillRect(S/2 - 2, 12, 4, 6);
      // Rune centre spark
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(S/2 - 1, S * 0.48, 2, 2);
    });

    // Helmet — polished metal helm with visor shadow
    this._genTexture('hd_item_helmet', S, S, (g) => {
      g.fillStyle(0x334455);
      g.fillRect(6, 10, 20, 16);
      g.fillRect(8, 6, 16, 5);
      g.fillRect(12, 4, 8, 3);
      g.fillRect(4, 24, 24, 4);
      g.fillStyle(0x7799bb);
      g.fillRect(7, 11, 18, 13);
      g.fillRect(9, 7, 14, 5);
      g.fillRect(13, 5, 6, 3);
      g.fillStyle(0x99bbdd, 0.6);
      g.fillRect(10, 12, 5, 10);
    });

    // Chest — detailed breastplate with pauldron hints
    this._genTexture('hd_item_chest', S, S, (g) => {
      g.fillStyle(0x334455);
      g.fillRect(4, 2, 24, 28);
      g.fillStyle(0x7799bb);
      g.fillRect(5, 3, 22, 26);
      g.fillStyle(0x556677);
      g.fillRect(6, 8, 20, 2);
      g.fillRect(6, 14, 20, 2);
      g.fillRect(6, 20, 20, 2);
      g.fillStyle(0xaabbcc, 0.5);
      g.fillRect(7, 4, 4, 20);
    });

    // Legs — plate greaves with articulated knee
    this._genTexture('hd_item_legs', S, S, (g) => {
      g.fillStyle(0x334455);
      g.fillRect(4, 1, 24, 14);
      g.fillRect(4, 17, 10, 13);
      g.fillRect(18, 17, 10, 13);
      g.fillStyle(0x7799bb);
      g.fillRect(5, 2, 22, 12);
      g.fillRect(5, 18, 8, 11);
      g.fillRect(19, 18, 8, 11);
      g.fillStyle(0xaabbcc, 0.5);
      g.fillRect(7, 3, 4, 9);
    });

    // Arms — full gauntlet with articulated fingers
    this._genTexture('hd_item_arms', S, S, (g) => {
      g.fillStyle(0x334455);
      g.fillRect(6, 4, 20, 24);
      g.fillStyle(0x7799bb);
      g.fillRect(7, 5, 18, 22);
      g.fillStyle(0x556677);
      g.fillRect(8, 9, 16, 2);
      g.fillRect(8, 15, 16, 2);
      g.fillRect(8, 21, 16, 2);
      g.fillStyle(0xaabbcc, 0.5);
      g.fillRect(9, 6, 4, 18);
    });

    // Boots — plate sabatons with toe cap
    this._genTexture('hd_item_boots', S, S, (g) => {
      g.fillStyle(0x334455);
      g.fillRect(7, 2, 14, 20);
      g.fillRect(5, 22, 18, 6);
      g.fillRect(4, 26, 24, 4);
      g.fillStyle(0x7799bb);
      g.fillRect(8, 3, 12, 18);
      g.fillRect(6, 23, 16, 5);
      g.fillRect(5, 27, 22, 3);
      g.fillStyle(0xaabbcc, 0.5);
      g.fillRect(10, 4, 4, 15);
    });

    // Ring — ornate gold band with faceted ruby
    this._genTexture('hd_item_ring', S, S, (g) => {
      g.fillStyle(0x775500);
      g.fillEllipse(S/2, S/2, 26, 26);
      g.fillStyle(0x111122);
      g.fillEllipse(S/2, S/2, 16, 16);
      g.fillStyle(0xffcc44);
      g.fillEllipse(S/2, S/2, 23, 23);
      g.fillStyle(0x111122);
      g.fillEllipse(S/2, S/2, 14, 14);
      g.fillStyle(0xee2222);
      g.fillEllipse(S/2, S/2 - 8, 8, 8);
      g.fillStyle(0xff8888, 0.8);
      g.fillRect(S/2 - 2, S/2 - 10, 3, 3);
      g.fillStyle(0xffaaaa, 0.5);
      g.fillRect(S/2 - 1, S/2 - 9, 1, 1);
    });

    // Amulet — ornate golden teardrop with glowing cyan stone
    this._genTexture('hd_item_amulet', S, S, (g) => {
      g.fillStyle(0x775500);
      g.fillRect(S/2 - 2, 2, 5, 12);
      g.fillRect(S/2 - 10, 4, 20, 5);
      g.fillEllipse(S/2, S/2 + 6, 22, 24);
      g.fillStyle(0xffcc44);
      g.fillRect(S/2 - 1, 3, 3, 10);
      g.fillRect(S/2 - 8, 5, 16, 4);
      g.fillEllipse(S/2, S/2 + 6, 19, 21);
      g.fillStyle(0x22aacc);
      g.fillEllipse(S/2, S/2 + 6, 13, 14);
      g.fillStyle(0x55eeff, 0.7);
      g.fillEllipse(S/2 - 2, S/2 + 3, 7, 8);
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(S/2 - 4, S/2 + 2, 3, 4);
    });
  }

  /**
   * Generates themed tile textures for unique named rooms.  Each unique room
   * definition has a `floorKey` and `wallKey`; these textures are generated for
   * all three tileset sizes (classic 16px, modern 16px, HD 32px) using the
   * same prefixing convention as standard dungeon tiles.
   *
   * The Dark Armoury uses a blackened-iron / rust palette.
   * The Necropolis Library uses an obsidian / arcane-blue palette.
   */
  _createUniqueRoomTileTextures() {
    // ── Decoration tile textures (all tilesets) ─────────────────────────────
    // Weapon mount — 16px classic/modern
    const T = 16;
    // Weapon mount — dark iron bracket with two crossed blades (steel gray)
    for (const prefix of ['classic', 'modern']) {
      this._genTexture(`${prefix}_tile_weapon_mount`, T, T, (g) => {
        // Iron wall backing (armoury wall colour)
        g.fillStyle(0x1e1410);
        g.fillRect(0, 0, T, T);
        // Mounting bracket — dark metal frame
        g.fillStyle(0x302010);
        g.fillRect(5, 5, 6, 6);
        g.fillRect(6, 6, 4, 4);
        // First blade — diagonal top-left → bottom-right (steel)
        g.fillStyle(0x8090a0);
        g.fillRect(2, 2, 2, 2);
        g.fillRect(4, 4, 2, 2);
        g.fillRect(10, 10, 2, 2);
        g.fillRect(12, 12, 2, 2);
        // Second blade — diagonal top-right → bottom-left (slightly darker)
        g.fillStyle(0x607080);
        g.fillRect(12, 2, 2, 2);
        g.fillRect(10, 4, 2, 2);
        g.fillRect(4, 10, 2, 2);
        g.fillRect(2, 12, 2, 2);
        // Centre crossguard
        g.fillStyle(0xc0a840);
        g.fillRect(7, 7, 2, 2);
      });
    }
    // Bookcase — 16px classic/modern (dark wood shelves with coloured book spines)
    for (const prefix of ['classic', 'modern']) {
      this._genTexture(`${prefix}_tile_bookcase`, T, T, (g) => {
        // Dark wood backing
        g.fillStyle(0x140c06);
        g.fillRect(0, 0, T, T);
        // Wood frame
        g.fillStyle(0x1e1008);
        g.fillRect(1, 1, T - 2, T - 2);
        // Shelf dividers
        g.fillStyle(0x0e0806);
        g.fillRect(1, 5, T - 2, 1);
        g.fillRect(1, 10, T - 2, 1);
        // Top shelf books (y 1–4): alternating coloured spines (2px wide each)
        const topBooks  = [0x5a1818, 0x184a18, 0x18244a, 0x4a3610, 0x381838];
        const midBooks  = [0x184a18, 0x4a3610, 0x5a1818, 0x381838, 0x18244a];
        const botBooks  = [0x4a3610, 0x5a1818, 0x381838, 0x18244a, 0x184a18];
        for (let i = 0; i < topBooks.length; i++) {
          g.fillStyle(topBooks[i]);
          g.fillRect(1 + i * 3, 2, 2, 3);
        }
        for (let i = 0; i < midBooks.length; i++) {
          g.fillStyle(midBooks[i]);
          g.fillRect(1 + i * 3, 6, 2, 3);
        }
        for (let i = 0; i < botBooks.length; i++) {
          g.fillStyle(botBooks[i]);
          g.fillRect(1 + i * 3, 11, 2, 3);
        }
      });
    }

    // ── Weapon mount HD (32px) ───────────────────────────────────────────────
    const S = 32;
    this._genTexture('hd_tile_weapon_mount', S, S, (g) => {
      // Iron wall backing
      g.fillStyle(0x1e1410);
      g.fillRect(0, 0, S, S);
      // Central mounting plaque
      g.fillStyle(0x2e2018);
      g.fillRect(8, 8, 16, 16);
      g.fillStyle(0x3e3020);
      g.fillRect(9, 9, 14, 14);
      // First blade (sword) — top-left to bottom-right, steel with highlight
      const blade1 = [[2,2],[4,4],[6,6],[18,18],[20,20],[22,22],[24,24]];
      for (const [bx, by] of blade1) {
        g.fillStyle(0x7888a0);
        g.fillRect(bx, by, 3, 3);
        g.fillStyle(0xa0b0c0);
        g.fillRect(bx, by, 1, 1);
      }
      // Second blade (spear) — top-right to bottom-left, darker steel
      const blade2 = [[24,2],[22,4],[20,6],[12,14],[10,16],[8,18],[6,20],[4,22],[2,24]];
      for (const [bx, by] of blade2) {
        g.fillStyle(0x5a6878);
        g.fillRect(bx, by, 3, 3);
      }
      // Gold crossguard at centre crossing
      g.fillStyle(0xd4a830);
      g.fillRect(13, 13, 6, 6);
      g.fillStyle(0xf0c850);
      g.fillRect(14, 14, 4, 4);
    });

    // ── Bookcase HD (32px) ───────────────────────────────────────────────────
    this._genTexture('hd_tile_bookcase', S, S, (g) => {
      // Deep dark wood
      g.fillStyle(0x120a04);
      g.fillRect(0, 0, S, S);
      // Wood case frame
      g.fillStyle(0x1c1008);
      g.fillRect(2, 2, S - 4, S - 4);
      // Shelf dividers
      g.fillStyle(0x100806);
      g.fillRect(2, 10, S - 4, 2);
      g.fillRect(2, 20, S - 4, 2);
      // Book tops (slight protrusion highlight)
      g.fillStyle(0x281810);
      g.fillRect(2, 9, S - 4, 1);
      g.fillRect(2, 19, S - 4, 1);
      // Top shelf books (y 2–8, 4px wide books)
      const topBooks = [0x6a2020,0x1e5a1e,0x1e2e5a,0x5a4212,0x481848,0x5a2020,0x1e5a1e];
      const midBooks = [0x1e2e5a,0x5a4212,0x6a2020,0x481848,0x1e5a1e,0x1e2e5a,0x5a4212];
      const botBooks = [0x481848,0x6a2020,0x1e2e5a,0x1e5a1e,0x5a4212,0x6a2020,0x481848];
      for (let i = 0; i < topBooks.length; i++) {
        g.fillStyle(topBooks[i]);
        g.fillRect(3 + i * 4, 3, 3, 6);
        // Spine highlight
        g.fillStyle(0xffffff, 0.1);
        g.fillRect(3 + i * 4, 3, 1, 6);
      }
      for (let i = 0; i < midBooks.length; i++) {
        g.fillStyle(midBooks[i]);
        g.fillRect(3 + i * 4, 12, 3, 7);
        g.fillStyle(0xffffff, 0.1);
        g.fillRect(3 + i * 4, 12, 1, 7);
      }
      for (let i = 0; i < botBooks.length; i++) {
        g.fillStyle(botBooks[i]);
        g.fillRect(3 + i * 4, 22, 3, 7);
        g.fillStyle(0xffffff, 0.1);
        g.fillRect(3 + i * 4, 22, 1, 7);
      }
    });

    // Dark Armoury floor — charcoal stone with rust-red stains
    this._genTexture('classic_tile_floor_dark_armoury', T, T, (g) => {
      g.fillStyle(0x120c08);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x1e1410, 0.9);
      g.fillRect(0, 0, T - 1, T - 1);
      // Rust / blood stain details
      const pts = [[3,3],[7,11],[12,5],[5,13],[11,9],[14,2],[2,8]];
      for (const [px, py] of pts) {
        g.fillStyle(0x4a1808, 0.7);
        g.fillRect(px, py, 1, 1);
      }
    });

    // Dark Armoury wall — dark iron with oxidised rust streaks
    this._genTexture('classic_tile_wall_dark_armoury', T, T, (g) => {
      g.fillStyle(0x382820);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x4e3828);
      g.fillRect(0, 0, T, 1);
      g.fillRect(0, 0, 1, T);
      g.fillStyle(0x1a100a);
      g.fillRect(0, T - 1, T, 1);
      g.fillRect(T - 1, 0, 1, T);
      // Rust streaks
      g.fillStyle(0x6a2010, 0.7);
      g.fillRect(3, 4, 4, 1);
      g.fillRect(9, 10, 5, 1);
      g.fillRect(6, 7, 1, 3);
    });

    // Necropolis Library floor — near-black obsidian with arcane blue dots
    this._genTexture('classic_tile_floor_necropolis_library', T, T, (g) => {
      g.fillStyle(0x080812);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x0c1020, 0.9);
      g.fillRect(0, 0, T - 1, T - 1);
      // Arcane rune glow dots
      const pts = [[4,3],[8,12],[11,6],[3,10],[13,4],[6,14],[10,9]];
      for (const [px, py] of pts) {
        g.fillStyle(0x2840c0, 0.6);
        g.fillRect(px, py, 1, 1);
      }
    });

    // Necropolis Library wall — dark navy stone with blue arcane carvings
    this._genTexture('classic_tile_wall_necropolis_library', T, T, (g) => {
      g.fillStyle(0x0e1830);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x1a2848);
      g.fillRect(0, 0, T, 1);
      g.fillRect(0, 0, 1, T);
      g.fillStyle(0x060c18);
      g.fillRect(0, T - 1, T, 1);
      g.fillRect(T - 1, 0, 1, T);
      // Arcane carved lines
      g.fillStyle(0x3050a0, 0.7);
      g.fillRect(3, 4, 4, 1);
      g.fillRect(9, 10, 5, 1);
      g.fillRect(6, 7, 1, 3);
    });

    // ── Modern (also 16px) ───────────────────────────────────────────────────

    // Dark Armoury floor — modern variant (slightly warmer rust tones)
    this._genTexture('modern_tile_floor_dark_armoury', T, T, (g) => {
      g.fillStyle(0x150e09);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x221612, 0.9);
      g.fillRect(1, 1, T - 2, T - 2);
      const pts = [[5,3],[9,11],[13,5],[3,13],[11,8]];
      for (const [px, py] of pts) {
        g.fillStyle(0x5a1c0a, 0.7);
        g.fillRect(px, py, 1, 1);
      }
    });

    // Dark Armoury wall — modern variant
    this._genTexture('modern_tile_wall_dark_armoury', T, T, (g) => {
      g.fillStyle(0x3e2e22);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x5a4030, 0.9);
      g.fillRect(1, 1, T - 2, T - 2);
      g.fillStyle(0x6e2818, 0.7);
      g.fillRect(2, 5, T - 4, 1);
      g.fillRect(2, 11, T - 4, 1);
    });

    // Necropolis Library floor — modern variant
    this._genTexture('modern_tile_floor_necropolis_library', T, T, (g) => {
      g.fillStyle(0x090912);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x0e1224, 0.9);
      g.fillRect(1, 1, T - 2, T - 2);
      const pts = [[4,4],[9,11],[12,6],[2,10],[14,3]];
      for (const [px, py] of pts) {
        g.fillStyle(0x3050b8, 0.6);
        g.fillRect(px, py, 1, 1);
      }
    });

    // Necropolis Library wall — modern variant
    this._genTexture('modern_tile_wall_necropolis_library', T, T, (g) => {
      g.fillStyle(0x0c1830);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x182040, 0.9);
      g.fillRect(1, 1, T - 2, T - 2);
      g.fillStyle(0x2e50a0, 0.7);
      g.fillRect(2, 5, T - 4, 1);
      g.fillRect(2, 11, T - 4, 1);
    });

    // ── HD (32px) ────────────────────────────────────────────────────────────

    // Dark Armoury floor HD — charcoal slabs with rust-red mortar and blood stains
    this._genTexture('hd_tile_floor_dark_armoury', S, S, (g) => {
      // Dark rust mortar background
      g.fillStyle(0x0c0806);
      g.fillRect(0, 0, S, S);
      // Four iron/charcoal slabs
      const slabColor   = 0x1e1410;
      const slabHilight = 0x2e1e16;
      const slabShadow  = 0x0e0a08;
      const slabs = [[1,1],[17,1],[1,17],[17,17]];
      for (const [sx, sy] of slabs) {
        g.fillStyle(slabColor);
        g.fillRect(sx, sy, 14, 14);
        g.fillStyle(slabHilight);
        g.fillRect(sx, sy, 14, 1);
        g.fillRect(sx, sy, 1, 14);
        g.fillStyle(slabShadow);
        g.fillRect(sx, sy + 13, 14, 1);
        g.fillRect(sx + 13, sy, 1, 14);
      }
      // Rust / blood-stain surface marks
      const stains = [[4,4],[10,8],[20,3],[27,9],[6,21],[14,26],[23,17],[28,27]];
      for (const [px, py] of stains) {
        g.fillStyle(0x5a1808, 0.8);
        g.fillRect(px, py, 2, 1);
      }
    });

    // Dark Armoury wall HD — dark iron brickwork with rust-orange highlights
    this._genTexture('hd_tile_wall_dark_armoury', S, S, (g) => {
      g.fillStyle(0x22180e);
      g.fillRect(0, 0, S, S);
      const brickH  = 9;
      const brickRows = [
        { y: 1,  offsets: [1, 12, 23] },
        { y: 12, offsets: [6, 17] },
        { y: 23, offsets: [1, 12, 23] },
      ];
      for (const row of brickRows) {
        for (const bx of row.offsets) {
          const bw = (bx === row.offsets[row.offsets.length - 1]) ? S - bx - 1 : 9;
          g.fillStyle(0x342416);
          g.fillRect(bx, row.y, bw, brickH);
          g.fillStyle(0x5a3820);
          g.fillRect(bx, row.y, bw, 1);
          g.fillRect(bx, row.y, 1, brickH);
          g.fillStyle(0x100806);
          g.fillRect(bx, row.y + brickH - 1, bw, 1);
          g.fillRect(bx + bw - 1, row.y, 1, brickH);
          // Rust streak
          g.fillStyle(0x6a2010, 0.6);
          g.fillRect(bx + 3, row.y + 3, 3, 1);
        }
      }
      g.fillStyle(0x6e4030);
      g.fillRect(0, 0, S, 1);
      g.fillRect(0, 0, 1, S);
      g.fillStyle(0x060402);
      g.fillRect(0, S - 1, S, 1);
      g.fillRect(S - 1, 0, 1, S);
    });

    // Necropolis Library floor HD — obsidian slabs with blue arcane rune glow
    this._genTexture('hd_tile_floor_necropolis_library', S, S, (g) => {
      // Deep void mortar
      g.fillStyle(0x04060e);
      g.fillRect(0, 0, S, S);
      // Four dark obsidian slabs
      const slabColor   = 0x0c1020;
      const slabHilight = 0x141828;
      const slabShadow  = 0x060810;
      const slabs = [[1,1],[17,1],[1,17],[17,17]];
      for (const [sx, sy] of slabs) {
        g.fillStyle(slabColor);
        g.fillRect(sx, sy, 14, 14);
        g.fillStyle(slabHilight);
        g.fillRect(sx, sy, 14, 1);
        g.fillRect(sx, sy, 1, 14);
        g.fillStyle(slabShadow);
        g.fillRect(sx, sy + 13, 14, 1);
        g.fillRect(sx + 13, sy, 1, 14);
      }
      // Arcane rune glow marks
      const runes = [[4,4],[10,7],[20,3],[27,8],[6,20],[14,25],[23,18],[28,26],[9,12],[19,22]];
      for (const [px, py] of runes) {
        g.fillStyle(0x2840c0, 0.7);
        g.fillRect(px, py, 2, 1);
      }
    });

    // Necropolis Library wall HD — dark navy brickwork with arcane-blue carvings
    this._genTexture('hd_tile_wall_necropolis_library', S, S, (g) => {
      g.fillStyle(0x080e20);
      g.fillRect(0, 0, S, S);
      const brickH  = 9;
      const brickRows = [
        { y: 1,  offsets: [1, 12, 23] },
        { y: 12, offsets: [6, 17] },
        { y: 23, offsets: [1, 12, 23] },
      ];
      for (const row of brickRows) {
        for (const bx of row.offsets) {
          const bw = (bx === row.offsets[row.offsets.length - 1]) ? S - bx - 1 : 9;
          g.fillStyle(0x101828);
          g.fillRect(bx, row.y, bw, brickH);
          g.fillStyle(0x1e2e50);
          g.fillRect(bx, row.y, bw, 1);
          g.fillRect(bx, row.y, 1, brickH);
          g.fillStyle(0x040810);
          g.fillRect(bx, row.y + brickH - 1, bw, 1);
          g.fillRect(bx + bw - 1, row.y, 1, brickH);
          // Arcane carved rune
          g.fillStyle(0x3050a0, 0.6);
          g.fillRect(bx + 3, row.y + 3, 3, 1);
        }
      }
      g.fillStyle(0x2840a0);
      g.fillRect(0, 0, S, 1);
      g.fillRect(0, 0, 1, S);
      g.fillStyle(0x020408);
      g.fillRect(0, S - 1, S, 1);
      g.fillRect(S - 1, 0, 1, S);
    });

    // ── The Darker Way tiles ─────────────────────────────────────────────────

    // Locked door — iron-bound door with glowing keyhole
    this._genTexture('classic_tile_locked_door', T, T, (g) => {
      g.fillStyle(0x1a1008);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x2a1a0a);
      g.fillRect(1, 1, T - 2, T - 2);
      // Door planks
      g.fillStyle(0x3a2010);
      g.fillRect(2, 2, T - 4, 5);
      g.fillRect(2, 9, T - 4, 5);
      // Iron banding
      g.fillStyle(0x111111);
      g.fillRect(2, 7, T - 4, 2);
      // Keyhole
      g.fillStyle(0xaa7700);
      g.fillRect(T/2 - 1, 10, 2, 3);
      g.fillRect(T/2 - 1, 10, 3, 2);
    });

    this._genTexture('modern_tile_locked_door', T, T, (g) => {
      g.fillStyle(0x0e0e0e);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x181818);
      g.fillRect(1, 1, T - 2, T - 2);
      // Iron panels
      g.fillStyle(0x222222);
      g.fillRect(2, 2, T - 4, 5);
      g.fillRect(2, 9, T - 4, 5);
      // Panel rivets
      g.fillStyle(0x333333);
      g.fillRect(3, 4, 1, 1);
      g.fillRect(T - 4, 4, 1, 1);
      g.fillRect(3, 11, 1, 1);
      g.fillRect(T - 4, 11, 1, 1);
      // Keyhole — golden glow
      g.fillStyle(0xcc9900, 0.9);
      g.fillRect(T/2 - 1, 10, 2, 3);
      g.fillRect(T/2 - 1, 10, 3, 2);
    });

    this._genTexture('hd_tile_locked_door', S, S, (g) => {
      g.fillStyle(0x080808);
      g.fillRect(0, 0, S, S);
      g.fillStyle(0x101010);
      g.fillRect(1, 1, S - 2, S - 2);
      // Door panels — dark iron
      g.fillStyle(0x1c1c1c);
      g.fillRect(2, 2, S - 4, 12);
      g.fillRect(2, 18, S - 4, 12);
      // Panel highlights
      g.fillStyle(0x2a2a2a);
      g.fillRect(2, 2, S - 4, 1);
      g.fillRect(2, 18, S - 4, 1);
      // Rivets
      g.fillStyle(0x383838);
      for (const [rx, ry] of [[3,3],[S-5,3],[3,9],[S-5,9],[3,19],[S-5,19],[3,25],[S-5,25]]) {
        g.fillRect(rx, ry, 2, 2);
      }
      // Iron banding across centre
      g.fillStyle(0x141414);
      g.fillRect(2, 14, S - 4, 4);
      // Keyhole — warm amber glow
      g.fillStyle(0xcc8800, 0.95);
      g.fillRect(S/2 - 2, 20, 4, 6);
      g.fillRect(S/2 - 2, 20, 5, 4);
      g.fillStyle(0xffcc44, 0.6);
      g.fillRect(S/2 - 1, 21, 2, 3);
    });

    // Recall Portal tile — a shimmering floor tile that returns the player to their last floor
    this._genTexture('classic_tile_recall_portal', T, T, (g) => {
      // Base: town accent floor
      g.fillStyle(0x557755);
      g.fillRect(0, 0, T, T);
      // Portal ring
      g.fillStyle(0x44ddff);
      g.fillEllipse(T/2, T/2, T - 2, T - 2);
      // Inner glow
      g.fillStyle(0x88eeff);
      g.fillEllipse(T/2, T/2, T - 6, T - 6);
      // Centre spark
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(T/2 - 1, T/2 - 1, 2, 2);
    });

    this._genTexture('modern_tile_recall_portal', T, T, (g) => {
      g.fillStyle(0x446644);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x220044);
      g.fillEllipse(T/2, T/2, T - 1, T - 1);
      g.fillStyle(0x3399ff);
      g.fillEllipse(T/2, T/2, T - 3, T - 3);
      g.fillStyle(0x88ddff, 0.8);
      g.fillEllipse(T/2, T/2, T - 7, T - 7);
      g.fillStyle(0xffffff, 0.7);
      g.fillRect(T/2 - 1, T/2 - 1, 2, 2);
    });

    this._genTexture('hd_tile_recall_portal', S, S, (g) => {
      g.fillStyle(0x334433);
      g.fillRect(0, 0, S, S);
      // Outer dark ring
      g.fillStyle(0x110033);
      g.fillEllipse(S/2, S/2, S - 2, S - 2);
      // Portal glow layers
      g.fillStyle(0x2255cc);
      g.fillEllipse(S/2, S/2, S - 4, S - 4);
      g.fillStyle(0x44aaff);
      g.fillEllipse(S/2, S/2, S - 8, S - 8);
      g.fillStyle(0x88ddff, 0.7);
      g.fillEllipse(S/2, S/2, S - 14, S - 14);
      // Sparkle lines
      g.fillStyle(0xaaeeff, 0.9);
      g.fillRect(S/2 - 1, 4, 2, 8);
      g.fillRect(S/2 - 1, S - 12, 2, 8);
      g.fillRect(4, S/2 - 1, 8, 2);
      g.fillRect(S - 12, S/2 - 1, 8, 2);
      // Centre spark
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(S/2 - 2, S/2 - 2, 4, 4);
    });

    // The Darker Way floor — deep void-stone, darker than the armoury
    this._genTexture('classic_tile_floor_darker_way', T, T, (g) => {
      g.fillStyle(0x080810);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x0d0d1a);
      g.fillRect(2, 2, T - 4, T - 4);
      // Faint void cracks
      g.fillStyle(0x040408, 0.8);
      g.fillRect(3, T/2, 4, 1);
      g.fillRect(T/2, 3, 1, 4);
    });

    this._genTexture('modern_tile_floor_darker_way', T, T, (g) => {
      g.fillStyle(0x060610);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x0c0c1e);
      g.fillRect(1, 1, T - 2, T - 2);
      // Grid lines — very faint
      g.fillStyle(0x050510, 0.7);
      g.fillRect(0, T/2, T, 1);
      g.fillRect(T/2, 0, 1, T);
      // Void shimmer dot
      g.fillStyle(0x111133, 0.5);
      g.fillRect(T/2 - 1, T/2 - 1, 2, 2);
    });

    this._genTexture('hd_tile_floor_darker_way', S, S, (g) => {
      g.fillStyle(0x060610);
      g.fillRect(0, 0, S, S);
      g.fillStyle(0x0a0a1c);
      g.fillRect(1, 1, S - 2, S - 2);
      // Stone slab lines
      g.fillStyle(0x040408);
      g.fillRect(0, S/2, S, 1);
      g.fillRect(S/2, 0, 1, S);
      // Void cracks
      g.fillStyle(0x080814, 0.6);
      g.fillRect(4, 8, 6, 1);
      g.fillRect(20, 18, 5, 1);
      g.fillRect(12, 26, 4, 1);
      // Subtle shimmer
      g.fillStyle(0x0f0f33, 0.4);
      g.fillRect(S/2 - 2, S/2 - 2, 4, 4);
    });

    // The Darker Way wall — shadow-cracked stone, almost lightless
    this._genTexture('classic_tile_wall_darker_way', T, T, (g) => {
      g.fillStyle(0x050508);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x0a0a10);
      g.fillRect(1, 1, T - 2, T - 2);
      // Crack marks
      g.fillStyle(0x020205);
      g.fillRect(2, 4, 3, 1);
      g.fillRect(8, 9, 4, 1);
      g.fillRect(4, 13, 3, 1);
    });

    this._genTexture('modern_tile_wall_darker_way', T, T, (g) => {
      g.fillStyle(0x040408);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x090910);
      g.fillRect(1, 1, T - 2, T - 2);
      g.fillStyle(0x111120, 0.4);
      g.fillRect(2, 2, T - 4, T - 4);
      // Subtle fissure
      g.fillStyle(0x020204);
      g.fillRect(3, 6, 5, 1);
      g.fillRect(7, 11, 4, 1);
    });

    this._genTexture('hd_tile_wall_darker_way', S, S, (g) => {
      g.fillStyle(0x030306);
      g.fillRect(0, 0, S, S);
      g.fillStyle(0x07070e);
      g.fillRect(1, 1, S - 2, S - 2);
      // Brickwork — barely visible
      const brickRows = [{ y: 1, offsets: [1, 12, 23] }, { y: 12, offsets: [6, 17] }, { y: 23, offsets: [1, 12, 23] }];
      for (const row of brickRows) {
        for (const bx of row.offsets) {
          const bw = bx === row.offsets[row.offsets.length - 1] ? S - bx - 1 : 9;
          g.fillStyle(0x080810);
          g.fillRect(bx, row.y, bw, 9);
          g.fillStyle(0x0c0c18);
          g.fillRect(bx, row.y, bw, 1);
        }
      }
      // Deep shadow cracks
      g.fillStyle(0x010104);
      g.fillRect(3, 5, 7, 1);
      g.fillRect(18, 14, 6, 1);
      g.fillRect(7, 25, 8, 1);
    });

    // ── Trash pile textures (all tilesets) ──────────────────────────────────
    // Each texture opens with an exact copy of the floor drawing code so the
    // pile appears to rest ON the stone.  A cast shadow darkens the floor just
    // beneath the pile, then the debris pieces are painted on top with a lighter
    // top-face highlight to suggest raised, three-dimensional objects.

    // Helper: draw the classic floor pattern onto g (16×16)
    const drawClassicFloor = (g) => {
      g.fillStyle(0x1a1a2e); g.fillRect(0, 0, T, T);
      g.fillStyle(0x16213e); g.fillRect(0, 0, T - 1, T - 1);
      for (const [px, py] of [[3,3],[7,11],[12,5],[5,13],[11,9],[14,2],[2,8]]) {
        g.fillStyle(0x222244); g.fillRect(px, py, 1, 1);
      }
    };

    // Helper: draw the modern floor pattern onto g (16×16)
    const drawModernFloor = (g) => {
      g.fillStyle(0x141820); g.fillRect(0, 0, T, T);
      g.fillStyle(0x252a38);
      g.fillRect(1, 1, 6, 6); g.fillRect(9, 1, 6, 6);
      g.fillRect(5, 9, 6, 6); g.fillRect(0, 9, 4, 6); g.fillRect(12, 9, 3, 6);
      g.fillStyle(0x303545);
      g.fillRect(1, 1, 6, 1); g.fillRect(9, 1, 6, 1); g.fillRect(5, 9, 6, 1);
    };

    // Helper: draw the HD floor pattern onto g (32×32)
    const drawHDFloor = (g) => {
      g.fillStyle(0x0e1018); g.fillRect(0, 0, S, S);
      for (const [sx, sy] of [[1,1],[17,1],[1,17],[17,17]]) {
        g.fillStyle(0x22283a); g.fillRect(sx, sy, 14, 14);
        g.fillStyle(0x2e3650); g.fillRect(sx, sy, 14, 1); g.fillRect(sx, sy, 1, 14);
        g.fillStyle(0x181d28); g.fillRect(sx, sy + 13, 14, 1); g.fillRect(sx + 13, sy, 1, 14);
      }
      for (const [px, py] of [[4,4],[10,7],[20,3],[27,8],[6,20],[14,25],[23,18],[28,26],[9,12],[19,22]]) {
        g.fillStyle(0x131820); g.fillRect(px, py, 2, 1);
      }
    };

    // ── Variant 1: compact rounded cluster of stone chips ────────────────────
    this._genTexture('classic_tile_trash_pile_1', T, T, (g) => {
      drawClassicFloor(g);
      g.fillStyle(0x0c0c20); g.fillRect(5, 10, 7, 3);  // cast shadow on floor
      g.fillStyle(0x32324e); g.fillRect(5, 8, 6, 4);   // pile body
      g.fillStyle(0x3e3e5c); g.fillRect(6, 8, 4, 1);   // top-face highlight
      g.fillStyle(0x3e3e5c); g.fillRect(5, 9, 1, 1);
      g.fillStyle(0x26263e); g.fillRect(9, 10, 2, 2);  // right-side shadow
    });
    this._genTexture('modern_tile_trash_pile_1', T, T, (g) => {
      drawModernFloor(g);
      g.fillStyle(0x0c0e18); g.fillRect(5, 10, 7, 3);
      g.fillStyle(0x303548); g.fillRect(5, 8, 6, 4);
      g.fillStyle(0x3c4058); g.fillRect(6, 8, 4, 1);
      g.fillStyle(0x3c4058); g.fillRect(5, 9, 1, 1);
      g.fillStyle(0x242838); g.fillRect(9, 10, 2, 2);
    });
    this._genTexture('hd_tile_trash_pile_1', S, S, (g) => {
      drawHDFloor(g);
      g.fillStyle(0x0a0c18); g.fillRect(10, 20, 12, 6); // cast shadow
      g.fillStyle(0x303660); g.fillRect(10, 14, 10, 8); // pile body
      g.fillStyle(0x3c4470); g.fillRect(11, 14, 8, 2);  // top highlight
      g.fillStyle(0x3c4470); g.fillRect(10, 16, 2, 4);  // left highlight
      g.fillStyle(0x222848); g.fillRect(16, 18, 4, 4);  // right shadow face
      g.fillStyle(0x1a1e3a); g.fillRect(12, 20, 6, 2);  // base shadow
    });

    // ── Variant 2: two separate angular stone chips ───────────────────────────
    this._genTexture('classic_tile_trash_pile_2', T, T, (g) => {
      drawClassicFloor(g);
      g.fillStyle(0x0c0c20); g.fillRect(3, 11, 4, 2);  // shadow left chip
      g.fillStyle(0x0c0c20); g.fillRect(9, 11, 4, 2);  // shadow right chip
      g.fillStyle(0x32324e); g.fillRect(3, 9, 4, 3);   // left chip body
      g.fillStyle(0x32324e); g.fillRect(9, 9, 4, 3);   // right chip body
      g.fillStyle(0x3e3e5c); g.fillRect(3, 9, 4, 1);   // left top-face
      g.fillStyle(0x3e3e5c); g.fillRect(9, 9, 4, 1);   // right top-face
    });
    this._genTexture('modern_tile_trash_pile_2', T, T, (g) => {
      drawModernFloor(g);
      g.fillStyle(0x0c0e18); g.fillRect(3, 11, 4, 2);
      g.fillStyle(0x0c0e18); g.fillRect(9, 11, 4, 2);
      g.fillStyle(0x303548); g.fillRect(3, 9, 4, 3);
      g.fillStyle(0x303548); g.fillRect(9, 9, 4, 3);
      g.fillStyle(0x3c4058); g.fillRect(3, 9, 4, 1);
      g.fillStyle(0x3c4058); g.fillRect(9, 9, 4, 1);
    });
    this._genTexture('hd_tile_trash_pile_2', S, S, (g) => {
      drawHDFloor(g);
      g.fillStyle(0x0a0c18); g.fillRect(5, 21, 8, 4);  // shadow left
      g.fillStyle(0x0a0c18); g.fillRect(19, 21, 8, 4); // shadow right
      g.fillStyle(0x303660); g.fillRect(5, 14, 8, 8);  // left chip body
      g.fillStyle(0x303660); g.fillRect(19, 16, 8, 6); // right chip body
      g.fillStyle(0x3c4470); g.fillRect(5, 14, 8, 2);  // left top-face
      g.fillStyle(0x3c4470); g.fillRect(19, 16, 8, 2); // right top-face
      g.fillStyle(0x222848); g.fillRect(11, 18, 2, 4); // left side shadow
      g.fillStyle(0x222848); g.fillRect(25, 20, 2, 2); // right side shadow
    });

    // ── Variant 3: flat elongated grit strip ─────────────────────────────────
    this._genTexture('classic_tile_trash_pile_3', T, T, (g) => {
      drawClassicFloor(g);
      g.fillStyle(0x0c0c20); g.fillRect(2, 11, 12, 2); // cast shadow
      g.fillStyle(0x32324e); g.fillRect(2, 9, 12, 3);  // grit body (low and wide)
      g.fillStyle(0x3e3e5c); g.fillRect(3, 9, 10, 1);  // top highlight
      g.fillStyle(0x26263e); g.fillRect(2, 11, 12, 1); // base edge shadow
    });
    this._genTexture('modern_tile_trash_pile_3', T, T, (g) => {
      drawModernFloor(g);
      g.fillStyle(0x0c0e18); g.fillRect(2, 11, 12, 2);
      g.fillStyle(0x303548); g.fillRect(2, 9, 12, 3);
      g.fillStyle(0x3c4058); g.fillRect(3, 9, 10, 1);
      g.fillStyle(0x242838); g.fillRect(2, 11, 12, 1);
    });
    this._genTexture('hd_tile_trash_pile_3', S, S, (g) => {
      drawHDFloor(g);
      g.fillStyle(0x0a0c18); g.fillRect(3, 22, 26, 4); // cast shadow
      g.fillStyle(0x303660); g.fillRect(3, 16, 26, 7); // grit body
      g.fillStyle(0x3c4470); g.fillRect(4, 16, 24, 2); // top highlight
      g.fillStyle(0x1a1e3a); g.fillRect(3, 21, 26, 2); // base edge shadow
      // A few pebble bumps on the strip surface
      g.fillStyle(0x424870); g.fillRect(7, 17, 3, 2);
      g.fillStyle(0x424870); g.fillRect(14, 18, 3, 2);
      g.fillStyle(0x424870); g.fillRect(22, 17, 3, 2);
    });
  }
}
