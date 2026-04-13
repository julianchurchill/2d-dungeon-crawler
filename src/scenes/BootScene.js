import Phaser from 'phaser';

const T = 16; // tile size in pixels

/**
 * BootScene is the first scene to run.  It generates all procedural textures
 * for both tilesets (classic and modern) and then transitions to the main menu.
 *
 * Tile textures are generated with a tileset prefix so the TilesetManager can
 * look them up at render time:
 *   classic_tile_floor, modern_tile_floor, etc.
 *
 * Entity, item, and UI textures are shared between tilesets (no prefix).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this._createClassicTileTextures();
    this._createModernTileTextures();
    this._createEntityTextures();
    this._createItemTextures();
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
    drawFn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ---------------------------------------------------------------------------
  // Classic tileset  (prefix: 'classic_')
  //
  // Dark, minimal palette — nostalgic old-school dungeon crawler feel.
  // ---------------------------------------------------------------------------

  /** Generates all classic_ prefixed tile textures. */
  _createClassicTileTextures() {
    // Dungeon floor — dark stone with subtle noise
    this._genTexture('classic_tile_floor', T, T, (g) => {
      g.fillStyle(0x1a1a2e);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x16213e, 0.8);
      g.fillRect(0, 0, T - 1, T - 1);
      const pts = [[3,3],[7,11],[12,5],[5,13],[11,9],[14,2],[2,8]];
      for (const [px, py] of pts) {
        g.fillStyle(0x222244, 0.6);
        g.fillRect(px, py, 1, 1);
      }
    });

    // Dungeon wall — stone with bevel and cracks
    this._genTexture('classic_tile_wall', T, T, (g) => {
      g.fillStyle(0x4a4a5a);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x6a6a7a);
      g.fillRect(0, 0, T, 1);
      g.fillRect(0, 0, 1, T);
      g.fillStyle(0x2a2a3a);
      g.fillRect(0, T - 1, T, 1);
      g.fillRect(T - 1, 0, 1, T);
      g.fillStyle(0x333344, 0.7);
      g.fillRect(3, 4, 4, 1);
      g.fillRect(9, 10, 5, 1);
      g.fillRect(6, 7, 1, 3);
    });

    // Door — wooden brown with handle and panel lines
    this._genTexture('classic_tile_door', T, T, (g) => {
      g.fillStyle(0x5c3a1e);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x7a5030);
      g.fillRect(2, 1, T - 4, T - 2);
      g.fillStyle(0xddaa44);
      g.fillRect(T - 4, T / 2 - 1, 2, 2);
      g.fillStyle(0x4a2a10, 0.7);
      g.fillRect(3, 5, T - 6, 1);
      g.fillRect(3, T - 6, T - 6, 1);
    });

    // Dungeon stairs down — dark base with golden step lines
    this._genTexture('classic_tile_stairs', T, T, (g) => {
      g.fillStyle(0x1a1a2e);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0xddaa44);
      for (let i = 0; i < 4; i++) {
        g.fillRect(2 + i * 2, 3 + i * 3, T - 4 - i * 4, 2);
      }
      g.fillStyle(0xffcc44);
      g.fillRect(7, 13, 2, 2);
    });

    // Dungeon stairs up — dark base with blue step lines
    this._genTexture('classic_tile_stairs_up', T, T, (g) => {
      g.fillStyle(0x1a1a2e);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x44aadd);
      for (let i = 0; i < 4; i++) {
        g.fillRect(2 + i * 2, 3 + (3 - i) * 3, T - 4 - i * 4, 2);
      }
      g.fillStyle(0x88ccff);
      g.fillRect(7, 3, 2, 2);
    });

    // Town floor — warm cobblestone
    this._genTexture('classic_tile_town_floor', T, T, (g) => {
      g.fillStyle(0x8a7a62);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x796a52);
      g.fillRect(1, 1, T - 2, T - 2);
      g.fillStyle(0x6a5c44, 0.6);
      g.fillRect(0, T / 2, T, 1);
      g.fillRect(T / 2, 0, 1, T / 2);
      const pts = [[4, 4], [11, 6], [6, 11], [13, 13], [3, 12]];
      for (const [px, py] of pts) {
        g.fillStyle(0x5c4e38, 0.5);
        g.fillRect(px, py, 1, 1);
      }
    });

    // Town wall — warm light stone
    this._genTexture('classic_tile_town_wall', T, T, (g) => {
      g.fillStyle(0xb8a88a);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0xd0bca0);
      g.fillRect(0, 0, T, 1);
      g.fillRect(0, 0, 1, T);
      g.fillStyle(0x907060);
      g.fillRect(0, T - 1, T, 1);
      g.fillRect(T - 1, 0, 1, T);
      g.fillStyle(0xa09070, 0.7);
      g.fillRect(1, 5, T - 2, 1);
      g.fillRect(1, 11, T - 2, 1);
    });

    // Town stairs down — warm stone steps
    this._genTexture('classic_tile_town_stairs', T, T, (g) => {
      g.fillStyle(0x796a52);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0xd4b890);
      for (let i = 0; i < 4; i++) {
        g.fillRect(2 + i * 2, 3 + i * 3, T - 4 - i * 4, 2);
      }
      g.fillStyle(0xb89060);
      g.fillRect(7, 13, 2, 2);
    });

    // Shop roof — wooden plank ceiling
    this._genTexture('classic_tile_shop_roof', T, T, (g) => {
      g.fillStyle(0x3a2810);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x4e3820, 0.9);
      g.fillRect(0, 3,  T, 2);
      g.fillRect(0, 8,  T, 2);
      g.fillRect(0, 13, T, 2);
      g.fillStyle(0x5c4428, 0.5);
      g.fillRect(0, 4,  T, 1);
      g.fillRect(0, 9,  T, 1);
      g.fillRect(0, 14, T, 1);
      g.fillStyle(0x2a1808, 0.6);
      g.fillRect(4,  4, 3, 2);
      g.fillRect(11, 9, 3, 2);
    });

    // Town accent — lighter polished cobblestone
    this._genTexture('classic_tile_town_accent', T, T, (g) => {
      g.fillStyle(0xa89870);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0xb8a880);
      g.fillRect(1, 1, T - 2, T - 2);
      g.fillStyle(0x887860, 0.7);
      g.fillRect(0, T / 2, T, 1);
      g.fillRect(T / 2, 0, 1, T / 2);
      const pts = [[3, 3], [10, 5], [5, 10], [12, 12], [2, 11]];
      for (const [px, py] of pts) {
        g.fillStyle(0xc8b890, 0.6);
        g.fillRect(px, py, 1, 1);
      }
    });

    // Potion shop door — wooden with flask icon
    this._genTexture('classic_tile_door_potion', T, T, (g) => {
      g.fillStyle(0x5c3a1e);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x7a5030);
      g.fillRect(2, 1, T - 4, T - 2);
      g.fillStyle(0x4a2a10, 0.7);
      g.fillRect(3, 5, T - 6, 1);
      g.fillRect(3, T - 6, T - 6, 1);
      g.fillStyle(0xcc4466);
      g.fillEllipse(T / 2, 9, 5, 5);
      g.fillStyle(0x884422);
      g.fillRect(T / 2 - 1, 4, 2, 3);
      g.fillStyle(0xddaa66);
      g.fillRect(T / 2 - 1, 3, 2, 2);
      g.fillStyle(0xff88aa, 0.6);
      g.fillRect(T / 2 - 2, 8, 1, 2);
    });

    // Weapon shop door — wooden with sword icon
    this._genTexture('classic_tile_door_weapon', T, T, (g) => {
      g.fillStyle(0x5c3a1e);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x7a5030);
      g.fillRect(2, 1, T - 4, T - 2);
      g.fillStyle(0x4a2a10, 0.7);
      g.fillRect(3, 5, T - 6, 1);
      g.fillRect(3, T - 6, T - 6, 1);
      g.fillStyle(0xdddddd);
      g.fillRect(T / 2 - 1, 3, 2, 7);
      g.fillStyle(0xddaa44);
      g.fillRect(T / 2 - 3, 10, 6, 2);
      g.fillStyle(0x885533);
      g.fillRect(T / 2 - 1, 12, 2, 3);
    });

    // Armour shop door — wooden with shield icon
    this._genTexture('classic_tile_door_armour', T, T, (g) => {
      g.fillStyle(0x5c3a1e);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x7a5030);
      g.fillRect(2, 1, T - 4, T - 2);
      g.fillStyle(0x4a2a10, 0.7);
      g.fillRect(3, 5, T - 6, 1);
      g.fillRect(3, T - 6, T - 6, 1);
      g.fillStyle(0x6688aa);
      g.fillRect(T / 2 - 3, 3, 6, 5);
      g.fillTriangle(T / 2 - 3, 8, T / 2 + 3, 8, T / 2, 12);
      g.fillStyle(0xddaa44);
      g.fillRect(T / 2 - 1, 4, 2, 4);
      g.fillRect(T / 2 - 2, 6, 4, 2);
    });

    // Home door — warm golden door with house icon
    this._genTexture('classic_tile_home_door', T, T, (g) => {
      g.fillStyle(0x4a2e10);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x8b5e2a);
      g.fillRect(2, 1, T - 4, T - 2);
      g.fillStyle(0x6a4218, 0.8);
      g.fillRect(3, 5, T - 6, 1);
      g.fillRect(3, T - 6, T - 6, 1);
      g.fillStyle(0xffcc44);
      g.fillTriangle(T / 2, 3, T / 2 - 4, 7, T / 2 + 4, 7);
      g.fillRect(T / 2 - 3, 7, 6, 5);
      g.fillStyle(0xffeebb);
      g.fillRect(T - 4, T / 2 + 1, 2, 2);
    });
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
  // Entity textures (shared between tilesets — no prefix)
  // ---------------------------------------------------------------------------

  /** Generates entity sprite textures (player, enemies, NPCs). */
  _createEntityTextures() {
    // Player — blue diamond
    this._genTexture('entity_player', T, T, (g) => {
      g.fillStyle(0x4488ff);
      g.fillTriangle(T/2, 1, T-2, T/2, T/2, T-1);
      g.fillTriangle(T/2, 1, 2, T/2, T/2, T-1);
      g.fillStyle(0x88bbff, 0.7);
      g.fillTriangle(T/2, 3, T-4, T/2, T/2, T-3);
      g.fillTriangle(T/2, 3, 4, T/2, T/2, T-3);
      g.fillStyle(0xffffff);
      g.fillRect(T/2 - 1, T/2 - 2, 2, 2);
    });

    // Cockroach — small brown oval with antennae
    this._genTexture('entity_cockroach', T, T, (g) => {
      g.fillStyle(0x442211);
      g.fillEllipse(T/2, T/2 + 1, 7, 10);
      g.fillStyle(0x664422, 0.8);
      g.fillEllipse(T/2, T/2, 5, 7);
      g.fillStyle(0x442211);
      g.fillRect(T/2 - 3, T/2 - 5, 1, 3);
      g.fillRect(T/2 + 2, T/2 - 5, 1, 3);
    });

    // Sprite — small glowing fairy shape
    this._genTexture('entity_sprite', T, T, (g) => {
      g.fillStyle(0xaaccff, 0.6);
      g.fillEllipse(T/2 - 4, T/2, 5, 8);
      g.fillEllipse(T/2 + 4, T/2, 5, 8);
      g.fillStyle(0x88aadd);
      g.fillEllipse(T/2, T/2 + 1, 5, 7);
      g.fillStyle(0xaaccff);
      g.fillEllipse(T/2, T/2 - 3, 5, 5);
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(T/2 - 1, T/2 - 4, 2, 2);
    });

    // Goblin — small green blob
    this._genTexture('entity_goblin', T, T, (g) => {
      g.fillStyle(0x338833);
      g.fillEllipse(T/2, T/2 + 1, 10, 12);
      g.fillStyle(0x44aa44);
      g.fillEllipse(T/2, T/2 - 2, 8, 8);
      g.fillStyle(0xff4444);
      g.fillRect(T/2 - 3, T/2 - 4, 2, 2);
      g.fillRect(T/2 + 1, T/2 - 4, 2, 2);
    });

    // Orc — red/brown shape
    this._genTexture('entity_orc', T, T, (g) => {
      g.fillStyle(0x882222);
      g.fillRect(3, 4, 10, 10);
      g.fillStyle(0xaa3333);
      g.fillRect(4, 2, 8, 8);
      g.fillStyle(0xffff00);
      g.fillRect(5, 4, 2, 2);
      g.fillRect(9, 4, 2, 2);
      g.fillStyle(0xeeeecc);
      g.fillRect(5, 8, 2, 3);
      g.fillRect(9, 8, 2, 3);
    });

    // Troll — large dark figure
    this._genTexture('entity_troll', T, T, (g) => {
      g.fillStyle(0x2a1a1a);
      g.fillRect(2, 3, 12, 11);
      g.fillStyle(0x3a2a2a);
      g.fillRect(3, 1, 10, 9);
      g.fillStyle(0xff6600);
      g.fillRect(5, 3, 2, 2);
      g.fillRect(9, 3, 2, 2);
      g.fillStyle(0x553333);
      g.fillRect(4, 0, 2, 3);
      g.fillRect(10, 0, 2, 3);
    });

    // Skeleton — thin grey-white minion
    this._genTexture('entity_skeleton', T, T, (g) => {
      g.fillStyle(0xbbbbbb);
      g.fillRect(6, 6, 4, 7);
      g.fillStyle(0x555555);
      g.fillRect(6, 7, 4, 1);
      g.fillRect(6, 9, 4, 1);
      g.fillRect(6, 11, 4, 1);
      g.fillStyle(0xcccccc);
      g.fillRect(5, 1, 6, 5);
      g.fillStyle(0xdd2222);
      g.fillRect(6, 2, 1, 2);
      g.fillRect(9, 2, 1, 2);
      g.fillStyle(0xaaaaaa);
      g.fillRect(6, 13, 2, 3);
      g.fillRect(10, 13, 2, 3);
    });

    // Old Bones — imposing ivory skeleton boss
    this._genTexture('entity_old_bones', T, T, (g) => {
      g.fillStyle(0xeeeecc);
      g.fillRect(3, 5, 10, 9);
      g.fillStyle(0xccccaa);
      g.fillRect(4, 6, 2, 2);
      g.fillRect(4, 9, 2, 2);
      g.fillRect(10, 6, 2, 2);
      g.fillRect(10, 9, 2, 2);
      g.fillStyle(0xf0f0dd);
      g.fillRect(3, 0, 10, 6);
      g.fillStyle(0xff9900);
      g.fillRect(5, 1, 2, 2);
      g.fillRect(9, 1, 2, 2);
      g.fillStyle(0xddddcc);
      g.fillRect(4, 0, 1, 2);
      g.fillRect(7, 0, 2, 2);
      g.fillRect(11, 0, 1, 2);
      g.fillRect(4, 14, 3, 2);
      g.fillRect(9, 14, 3, 2);
    });

    // Creeping Mass — amorphous blob of dark green ooze
    this._genTexture('entity_creeping_mass', T, T, (g) => {
      g.fillStyle(0x1a3a1a);
      g.fillRect(2, 2, 12, 12);
      g.fillStyle(0x2a5a2a);
      g.fillRect(4, 4, 8, 8);
      g.fillStyle(0x44aa44);
      g.fillRect(6, 6, 4, 4);
      g.fillStyle(0x0a1a0a);
      g.fillRect(5, 5, 2, 2);
      g.fillRect(9, 9, 2, 2);
    });

    // Elder — white-robed sage with brown staff
    this._genTexture('entity_npc_elder', T, T, (g) => {
      g.fillStyle(0xddddcc);
      g.fillTriangle(T/2, T - 2, 2, T - 2, T/2 - 2, T/2);
      g.fillTriangle(T/2, T - 2, T - 2, T - 2, T/2 + 2, T/2);
      g.fillStyle(0xccccbb);
      g.fillRect(T/2 - 3, T/2 - 1, 6, 7);
      g.fillStyle(0xffddbf);
      g.fillEllipse(T/2, T/2 - 3, 7, 7);
      g.fillStyle(0xeeeeee);
      g.fillTriangle(T/2 - 2, T/2, T/2 + 2, T/2, T/2, T/2 + 4);
      g.fillStyle(0x885533);
      g.fillRect(T/2 + 4, 1, 2, T - 2);
    });

    // Guard — armoured soldier with blue visor
    this._genTexture('entity_npc_guard', T, T, (g) => {
      g.fillStyle(0x556677);
      g.fillRect(3, T/2, 10, 7);
      g.fillStyle(0x445566);
      g.fillRect(3, T/2 - 7, 10, 8);
      g.fillStyle(0x44ccff);
      g.fillRect(4, T/2 - 4, 8, 2);
      g.fillStyle(0x8899aa);
      g.fillRect(3, T/2, 10, 2);
      g.fillStyle(0x885533);
      g.fillRect(T - 3, 1, 2, T - 2);
      g.fillStyle(0xaabbcc);
      g.fillTriangle(T - 2, 0, T, 0, T - 1, 4);
    });

    // Merchant — green-cloaked figure with gold coin bag
    this._genTexture('entity_npc_merchant', T, T, (g) => {
      g.fillStyle(0x336633);
      g.fillRect(3, T/2 - 1, 10, 8);
      g.fillStyle(0x225522);
      g.fillRect(3, T/2 - 7, 10, 7);
      g.fillStyle(0xffddbf);
      g.fillEllipse(T/2, T/2 - 3, 6, 6);
      g.fillStyle(0xddaa00);
      g.fillEllipse(T/2 + 4, T - 3, 6, 6);
      g.fillStyle(0xffcc44);
      g.fillEllipse(T/2 + 4, T - 4, 4, 4);
    });
  }

  // ---------------------------------------------------------------------------
  // Item textures (shared between tilesets — no prefix)
  // ---------------------------------------------------------------------------

  /** Generates item sprite textures. */
  _createItemTextures() {
    // Health potion — red vial
    this._genTexture('item_potion_health', T, T, (g) => {
      g.fillStyle(0xcc2244);
      g.fillEllipse(T/2, T/2 + 2, 8, 9);
      g.fillStyle(0x884422);
      g.fillRect(T/2 - 2, T/2 - 5, 4, 4);
      g.fillStyle(0xddaa66);
      g.fillRect(T/2 - 1, T/2 - 7, 2, 3);
      g.fillStyle(0xff6688, 0.6);
      g.fillRect(T/2 - 3, T/2, 2, 3);
    });

    // Weapon — sword
    this._genTexture('item_weapon', T, T, (g) => {
      g.fillStyle(0xcccccc);
      g.fillRect(T/2 - 1, 2, 2, 10);
      g.fillStyle(0xddaa44);
      g.fillRect(T/2 - 4, 10, 8, 2);
      g.fillStyle(0x885533);
      g.fillRect(T/2 - 1, 12, 2, 4);
    });

    // Armor — shield shape
    this._genTexture('item_armor', T, T, (g) => {
      g.fillStyle(0x6688aa);
      g.fillRect(3, 2, 10, 8);
      g.fillTriangle(3, 10, 13, 10, T/2, 15);
      g.fillStyle(0xddaa44);
      g.fillRect(T/2 - 1, 4, 2, 5);
      g.fillRect(T/2 - 3, 6, 6, 2);
    });

    // Bone Blade — serrated ivory weapon
    this._genTexture('item_bone_blade', T, T, (g) => {
      g.fillStyle(0xeeeecc);
      g.fillRect(T/2 - 1, 1, 2, 10);
      g.fillStyle(0xccccaa);
      g.fillRect(T/2 + 1, 2, 1, 1);
      g.fillRect(T/2 + 1, 5, 1, 1);
      g.fillRect(T/2 + 1, 8, 1, 1);
      g.fillStyle(0xddaa44);
      g.fillRect(T/2 - 4, 11, 8, 2);
      g.fillStyle(0xbbbbaa);
      g.fillRect(T/2 - 1, 13, 2, 3);
    });

    // Skeleton Shield — interlocked bone segments
    this._genTexture('item_skeleton_shield', T, T, (g) => {
      g.fillStyle(0xddddcc);
      g.fillRect(3, 2, 10, 9);
      g.fillTriangle(3, 11, 13, 11, T/2, 15);
      g.fillStyle(0xccccaa);
      g.fillRect(5, 4, 6, 6);
      g.fillStyle(0xeeeecc);
      g.fillRect(4, 7, 8, 2);
      g.fillRect(T/2 - 1, 3, 2, 9);
    });

    // Teleport potion — purple vial
    this._genTexture('item_potion_teleport', T, T, (g) => {
      g.fillStyle(0x8833cc);
      g.fillEllipse(T/2, T/2 + 2, 8, 9);
      g.fillStyle(0x551188);
      g.fillRect(T/2 - 2, T/2 - 5, 4, 4);
      g.fillStyle(0xddaa66);
      g.fillRect(T/2 - 1, T/2 - 7, 2, 3);
      g.fillStyle(0xddaaff, 0.9);
      g.fillRect(T/2 - 2, T/2 + 1, 1, 1);
      g.fillRect(T/2 + 1, T/2 - 1, 1, 1);
      g.fillRect(T/2 - 3, T/2 + 3, 1, 1);
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
}
