import Phaser from 'phaser';

const T = 16; // tile size

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this._createTileTextures();
    this._createEntityTextures();
    this._createItemTextures();
    this._createUITextures();
    this.scene.start('MainMenuScene');
  }

  _gfx() {
    return this.make.graphics({ x: 0, y: 0, add: false });
  }

  _genTexture(key, w, h, drawFn) {
    const g = this._gfx();
    drawFn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  _createTileTextures() {
    // Floor tile — dark stone
    this._genTexture('tile_floor', T, T, (g) => {
      g.fillStyle(0x1a1a2e);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x16213e, 0.8);
      g.fillRect(0, 0, T - 1, T - 1);
      // Subtle noise dots
      const pts = [[3,3],[7,11],[12,5],[5,13],[11,9],[14,2],[2,8]];
      for (const [px, py] of pts) {
        g.fillStyle(0x222244, 0.6);
        g.fillRect(px, py, 1, 1);
      }
    });

    // Wall tile — stone
    this._genTexture('tile_wall', T, T, (g) => {
      g.fillStyle(0x4a4a5a);
      g.fillRect(0, 0, T, T);
      // Bevel effect
      g.fillStyle(0x6a6a7a);
      g.fillRect(0, 0, T, 1);   // top
      g.fillRect(0, 0, 1, T);   // left
      g.fillStyle(0x2a2a3a);
      g.fillRect(0, T - 1, T, 1); // bottom
      g.fillRect(T - 1, 0, 1, T); // right
      // Stone cracks
      g.fillStyle(0x333344, 0.7);
      g.fillRect(3, 4, 4, 1);
      g.fillRect(9, 10, 5, 1);
      g.fillRect(6, 7, 1, 3);
    });

    // Wall (top-face variant for top-of-wall look) — slightly lighter
    this._genTexture('tile_wall_top', T, T, (g) => {
      g.fillStyle(0x5a5a6a);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x7a7a8a);
      g.fillRect(0, 0, T, 2);
      g.fillStyle(0x3a3a4a);
      g.fillRect(0, T - 1, T, 1);
    });

    // Door tile — wooden brown
    this._genTexture('tile_door', T, T, (g) => {
      g.fillStyle(0x5c3a1e);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x7a5030);
      g.fillRect(2, 1, T - 4, T - 2);
      // Door handle
      g.fillStyle(0xddaa44);
      g.fillRect(T - 4, T / 2 - 1, 2, 2);
      // Panel lines
      g.fillStyle(0x4a2a10, 0.7);
      g.fillRect(3, 5, T - 6, 1);
      g.fillRect(3, T - 6, T - 6, 1);
    });

    // Stairs down — descending pattern
    this._genTexture('tile_stairs', T, T, (g) => {
      g.fillStyle(0x1a1a2e);
      g.fillRect(0, 0, T, T);
      // Draw step lines
      g.fillStyle(0xddaa44);
      for (let i = 0; i < 4; i++) {
        g.fillRect(2 + i * 2, 3 + i * 3, T - 4 - i * 4, 2);
      }
      // Arrow down
      g.fillStyle(0xffcc44);
      g.fillRect(7, 13, 2, 2);
    });

    // Shadow/fog tile — pure black for overlay
    this._genTexture('tile_shadow', T, T, (g) => {
      g.fillStyle(0x000000);
      g.fillRect(0, 0, T, T);
    });
  }

  _createEntityTextures() {
    // Player — blue diamond
    this._genTexture('entity_player', T, T, (g) => {
      g.fillStyle(0x4488ff);
      // Diamond shape
      g.fillTriangle(T/2, 1, T-2, T/2, T/2, T-1);
      g.fillTriangle(T/2, 1, 2, T/2, T/2, T-1);
      // Inner highlight
      g.fillStyle(0x88bbff, 0.7);
      g.fillTriangle(T/2, 3, T-4, T/2, T/2, T-3);
      g.fillTriangle(T/2, 3, 4, T/2, T/2, T-3);
      // Eye dot
      g.fillStyle(0xffffff);
      g.fillRect(T/2 - 1, T/2 - 2, 2, 2);
    });

    // Goblin — small green blob
    this._genTexture('entity_goblin', T, T, (g) => {
      g.fillStyle(0x338833);
      g.fillEllipse(T/2, T/2 + 1, 10, 12);
      // Head
      g.fillStyle(0x44aa44);
      g.fillEllipse(T/2, T/2 - 2, 8, 8);
      // Eyes
      g.fillStyle(0xff4444);
      g.fillRect(T/2 - 3, T/2 - 4, 2, 2);
      g.fillRect(T/2 + 1, T/2 - 4, 2, 2);
    });

    // Orc — red/brown shape
    this._genTexture('entity_orc', T, T, (g) => {
      g.fillStyle(0x882222);
      g.fillRect(3, 4, 10, 10);
      // Head
      g.fillStyle(0xaa3333);
      g.fillRect(4, 2, 8, 8);
      // Eyes
      g.fillStyle(0xffff00);
      g.fillRect(5, 4, 2, 2);
      g.fillRect(9, 4, 2, 2);
      // Tusks
      g.fillStyle(0xeeeecc);
      g.fillRect(5, 8, 2, 3);
      g.fillRect(9, 8, 2, 3);
    });

    // Troll — large dark figure
    this._genTexture('entity_troll', T, T, (g) => {
      g.fillStyle(0x2a1a1a);
      g.fillRect(2, 3, 12, 11);
      // Head
      g.fillStyle(0x3a2a2a);
      g.fillRect(3, 1, 10, 9);
      // Eyes
      g.fillStyle(0xff6600);
      g.fillRect(5, 3, 2, 2);
      g.fillRect(9, 3, 2, 2);
      // Horns
      g.fillStyle(0x553333);
      g.fillRect(4, 0, 2, 3);
      g.fillRect(10, 0, 2, 3);
    });
  }

  _createItemTextures() {
    // Health potion — red vial
    this._genTexture('item_potion_health', T, T, (g) => {
      g.fillStyle(0xcc2244);
      g.fillEllipse(T/2, T/2 + 2, 8, 9);
      g.fillStyle(0x884422);
      g.fillRect(T/2 - 2, T/2 - 5, 4, 4);
      // Cork
      g.fillStyle(0xddaa66);
      g.fillRect(T/2 - 1, T/2 - 7, 2, 3);
      // Shine
      g.fillStyle(0xff6688, 0.6);
      g.fillRect(T/2 - 3, T/2, 2, 3);
    });

    // Weapon — sword slash
    this._genTexture('item_weapon', T, T, (g) => {
      g.fillStyle(0xcccccc);
      g.fillRect(T/2 - 1, 2, 2, 10);
      // Guard
      g.fillStyle(0xddaa44);
      g.fillRect(T/2 - 4, 10, 8, 2);
      // Handle
      g.fillStyle(0x885533);
      g.fillRect(T/2 - 1, 12, 2, 4);
    });

    // Armor — shield shape
    this._genTexture('item_armor', T, T, (g) => {
      g.fillStyle(0x6688aa);
      g.fillRect(3, 2, 10, 8);
      g.fillTriangle(3, 10, 13, 10, T/2, 15);
      // Emblem
      g.fillStyle(0xddaa44);
      g.fillRect(T/2 - 1, 4, 2, 5);
      g.fillRect(T/2 - 3, 6, 6, 2);
    });
  }

  _createUITextures() {
    // Heart icon for HP
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
