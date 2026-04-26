import Phaser from 'phaser';
import { createClassicEntityTextures, createClassicItemTextures, createClassicTileTextures } from './ClassicTextures.js';
import { createModernEntityTextures, createModernItemTextures, createModernTileTextures } from './ModernTextures.js';
import { createHdEntityTextures, createHdItemTextures, createHdTileTextures } from './HdTextures.js';

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
    const genTextureFn = (key, w, h, drawFn) => { this._genTextureWithGfx(key, w, h, drawFn, this._gfx()) };
    createClassicTileTextures(genTextureFn);
    createModernTileTextures(genTextureFn);
    createHdTileTextures(genTextureFn);
    this._createClassicUniqueRoomTileTextures();
    this._createModernUniqueRoomTileTextures();
    this._createHdUniqueRoomTileTextures();
    createClassicEntityTextures(genTextureFn);
    createModernTileTextures(genTextureFn);
    createHdEntityTextures(genTextureFn);
    createClassicItemTextures(genTextureFn);
    createModernTileTextures(genTextureFn);
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

  /**
   * Generates themed tile textures for unique named rooms.  Each unique room
   * definition has a `floorKey` and `wallKey`.
   *
   * The Dark Armoury uses a blackened-iron / rust palette.
   * The Necropolis Library uses an obsidian / arcane-blue palette.
   */
  _createClassicUniqueRoomTileTextures() {
    // ── Decoration tile textures ─────────────────────────────
    // Weapon mount — dark iron bracket with two crossed blades (steel gray)
    this._genTexture('classic_tile_weapon_mount', T, T, (g) => {
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
    // Bookcase — (dark wood shelves with coloured book spines)
    this._genTexture('classic_tile_bookcase', T, T, (g) => {
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

    // ── Trash pile textures ──────────────────────────────────
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

    // ── Variant 1: compact rounded cluster of stone chips ────────────────────
    this._genTexture('classic_tile_trash_pile_1', T, T, (g) => {
      drawClassicFloor(g);
      g.fillStyle(0x0c0c20); g.fillRect(5, 10, 7, 3);  // cast shadow on floor
      g.fillStyle(0x32324e); g.fillRect(5, 8, 6, 4);   // pile body
      g.fillStyle(0x3e3e5c); g.fillRect(6, 8, 4, 1);   // top-face highlight
      g.fillStyle(0x3e3e5c); g.fillRect(5, 9, 1, 1);
      g.fillStyle(0x26263e); g.fillRect(9, 10, 2, 2);  // right-side shadow
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

    // ── Variant 3: flat elongated grit strip ─────────────────────────────────
    this._genTexture('classic_tile_trash_pile_3', T, T, (g) => {
      drawClassicFloor(g);
      g.fillStyle(0x0c0c20); g.fillRect(2, 11, 12, 2); // cast shadow
      g.fillStyle(0x32324e); g.fillRect(2, 9, 12, 3);  // grit body (low and wide)
      g.fillStyle(0x3e3e5c); g.fillRect(3, 9, 10, 1);  // top highlight
      g.fillStyle(0x26263e); g.fillRect(2, 11, 12, 1); // base edge shadow
    });
  }

  /**
   * Generates themed tile textures for unique named rooms.  Each unique room
   * definition has a `floorKey` and `wallKey`.
   *
   * The Dark Armoury uses a blackened-iron / rust palette.
   * The Necropolis Library uses an obsidian / arcane-blue palette.
   */
  _createModernUniqueRoomTileTextures() {
    // ── Decoration tile textures ─────────────────────────────
    // Weapon mount — dark iron bracket with two crossed blades (steel gray)
    this._genTexture('modern_tile_weapon_mount', T, T, (g) => {
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
    // Bookcase — 16px classic/modern (dark wood shelves with coloured book spines)
    this._genTexture('modern_tile_bookcase', T, T, (g) => {
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

    // ── The Darker Way tiles ─────────────────────────────────────────────────

    // Locked door — iron-bound door with glowing keyhole
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

    // Recall Portal tile — a shimmering floor tile that returns the player to their last floor
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

    // The Darker Way floor — deep void-stone, darker than the armoury
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

    // The Darker Way wall — shadow-cracked stone, almost lightless
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

    // ── Trash pile textures ──────────────────────────────────
    // Each texture opens with an exact copy of the floor drawing code so the
    // pile appears to rest ON the stone.  A cast shadow darkens the floor just
    // beneath the pile, then the debris pieces are painted on top with a lighter
    // top-face highlight to suggest raised, three-dimensional objects.

    // Helper: draw the modern floor pattern onto g (16×16)
    const drawModernFloor = (g) => {
      g.fillStyle(0x141820); g.fillRect(0, 0, T, T);
      g.fillStyle(0x252a38);
      g.fillRect(1, 1, 6, 6); g.fillRect(9, 1, 6, 6);
      g.fillRect(5, 9, 6, 6); g.fillRect(0, 9, 4, 6); g.fillRect(12, 9, 3, 6);
      g.fillStyle(0x303545);
      g.fillRect(1, 1, 6, 1); g.fillRect(9, 1, 6, 1); g.fillRect(5, 9, 6, 1);
    };

    // ── Variant 1: compact rounded cluster of stone chips ────────────────────
    this._genTexture('modern_tile_trash_pile_1', T, T, (g) => {
      drawModernFloor(g);
      g.fillStyle(0x0c0e18); g.fillRect(5, 10, 7, 3);
      g.fillStyle(0x303548); g.fillRect(5, 8, 6, 4);
      g.fillStyle(0x3c4058); g.fillRect(6, 8, 4, 1);
      g.fillStyle(0x3c4058); g.fillRect(5, 9, 1, 1);
      g.fillStyle(0x242838); g.fillRect(9, 10, 2, 2);
    });

    // ── Variant 2: two separate angular stone chips ───────────────────────────
    this._genTexture('modern_tile_trash_pile_2', T, T, (g) => {
      drawModernFloor(g);
      g.fillStyle(0x0c0e18); g.fillRect(3, 11, 4, 2);
      g.fillStyle(0x0c0e18); g.fillRect(9, 11, 4, 2);
      g.fillStyle(0x303548); g.fillRect(3, 9, 4, 3);
      g.fillStyle(0x303548); g.fillRect(9, 9, 4, 3);
      g.fillStyle(0x3c4058); g.fillRect(3, 9, 4, 1);
      g.fillStyle(0x3c4058); g.fillRect(9, 9, 4, 1);
    });

    // ── Variant 3: flat elongated grit strip ─────────────────────────────────
    this._genTexture('modern_tile_trash_pile_3', T, T, (g) => {
      drawModernFloor(g);
      g.fillStyle(0x0c0e18); g.fillRect(2, 11, 12, 2);
      g.fillStyle(0x303548); g.fillRect(2, 9, 12, 3);
      g.fillStyle(0x3c4058); g.fillRect(3, 9, 10, 1);
      g.fillStyle(0x242838); g.fillRect(2, 11, 12, 1);
    });
  }

  /**
   * Generates themed tile textures for unique named rooms.  Each unique room
   * definition has a `floorKey` and `wallKey`.
   *
   * The Dark Armoury uses a blackened-iron / rust palette.
   * The Necropolis Library uses an obsidian / arcane-blue palette.
   */
  _createHdUniqueRoomTileTextures() {
    // ── Decoration tile textures ─────────────────────────────
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

    // ── Trash pile textures ──────────────────────────────────
    // Each texture opens with an exact copy of the floor drawing code so the
    // pile appears to rest ON the stone.  A cast shadow darkens the floor just
    // beneath the pile, then the debris pieces are painted on top with a lighter
    // top-face highlight to suggest raised, three-dimensional objects.

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