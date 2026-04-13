import Phaser from 'phaser';

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
    this._createClassicTileTextures();
    this._createModernTileTextures();
    this._createClassicEntityTextures();
    this._createModernEntityTextures();
    this._createClassicItemTextures();
    this._createModernItemTextures();
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
  // Classic entity textures  (prefix: 'classic_')
  // ---------------------------------------------------------------------------

  /** Generates classic_ prefixed entity sprite textures (player, enemies, NPCs). */
  _createClassicEntityTextures() {
    // Player — blue diamond
    this._genTexture('classic_entity_player', T, T, (g) => {
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
    this._genTexture('classic_entity_cockroach', T, T, (g) => {
      g.fillStyle(0x442211);
      g.fillEllipse(T/2, T/2 + 1, 7, 10);
      g.fillStyle(0x664422, 0.8);
      g.fillEllipse(T/2, T/2, 5, 7);
      g.fillStyle(0x442211);
      g.fillRect(T/2 - 3, T/2 - 5, 1, 3);
      g.fillRect(T/2 + 2, T/2 - 5, 1, 3);
    });

    // Sprite — small glowing fairy shape
    this._genTexture('classic_entity_sprite', T, T, (g) => {
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
    this._genTexture('classic_entity_goblin', T, T, (g) => {
      g.fillStyle(0x338833);
      g.fillEllipse(T/2, T/2 + 1, 10, 12);
      g.fillStyle(0x44aa44);
      g.fillEllipse(T/2, T/2 - 2, 8, 8);
      g.fillStyle(0xff4444);
      g.fillRect(T/2 - 3, T/2 - 4, 2, 2);
      g.fillRect(T/2 + 1, T/2 - 4, 2, 2);
    });

    // Orc — red/brown shape
    this._genTexture('classic_entity_orc', T, T, (g) => {
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
    this._genTexture('classic_entity_troll', T, T, (g) => {
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
    this._genTexture('classic_entity_skeleton', T, T, (g) => {
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
    this._genTexture('classic_entity_old_bones', T, T, (g) => {
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
    this._genTexture('classic_entity_creeping_mass', T, T, (g) => {
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
    this._genTexture('classic_entity_npc_elder', T, T, (g) => {
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
    this._genTexture('classic_entity_npc_guard', T, T, (g) => {
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
    this._genTexture('classic_entity_npc_merchant', T, T, (g) => {
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
  }

  // ---------------------------------------------------------------------------
  // Classic item textures  (prefix: 'classic_')
  // ---------------------------------------------------------------------------

  /** Generates classic_ prefixed item sprite textures. */
  _createClassicItemTextures() {
    // Health potion — red vial
    this._genTexture('classic_item_potion_health', T, T, (g) => {
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
    this._genTexture('classic_item_weapon', T, T, (g) => {
      g.fillStyle(0xcccccc);
      g.fillRect(T/2 - 1, 2, 2, 10);
      g.fillStyle(0xddaa44);
      g.fillRect(T/2 - 4, 10, 8, 2);
      g.fillStyle(0x885533);
      g.fillRect(T/2 - 1, 12, 2, 4);
    });

    // Armor — shield shape
    this._genTexture('classic_item_armor', T, T, (g) => {
      g.fillStyle(0x6688aa);
      g.fillRect(3, 2, 10, 8);
      g.fillTriangle(3, 10, 13, 10, T/2, 15);
      g.fillStyle(0xddaa44);
      g.fillRect(T/2 - 1, 4, 2, 5);
      g.fillRect(T/2 - 3, 6, 6, 2);
    });

    // Bone Blade — serrated ivory weapon
    this._genTexture('classic_item_bone_blade', T, T, (g) => {
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
    this._genTexture('classic_item_skeleton_shield', T, T, (g) => {
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
    this._genTexture('classic_item_potion_teleport', T, T, (g) => {
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
