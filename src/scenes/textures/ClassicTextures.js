import Phaser from 'phaser';

const T = 16; // tile size in pixels

/**
 * Texture generation functions for the Classic tile set.
 */

// ---------------------------------------------------------------------------
// Classic tileset  (prefix: 'classic_')
//
// Dark, minimal palette — nostalgic old-school dungeon crawler feel.
// ---------------------------------------------------------------------------

/** Generates all classic_ prefixed tile textures.
 * @param {function(string, number, number, function(Phaser.GameObjects.Graphics)):void} generateTextureFn
 */
export function createClassicTileTextures(generateTextureFn) {
  // Dungeon floor — dark stone with subtle noise
  generateTextureFn('classic_tile_floor', T, T, (g) => {
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
  generateTextureFn('classic_tile_wall', T, T, (g) => {
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
  generateTextureFn('classic_tile_door', T, T, (g) => {
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
  generateTextureFn('classic_tile_stairs', T, T, (g) => {
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
  generateTextureFn('classic_tile_stairs_up', T, T, (g) => {
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
  generateTextureFn('classic_tile_town_floor', T, T, (g) => {
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
  generateTextureFn('classic_tile_town_wall', T, T, (g) => {
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
  generateTextureFn('classic_tile_town_stairs', T, T, (g) => {
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
  generateTextureFn('classic_tile_shop_roof', T, T, (g) => {
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
  generateTextureFn('classic_tile_town_accent', T, T, (g) => {
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
  generateTextureFn('classic_tile_door_potion', T, T, (g) => {
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
  generateTextureFn('classic_tile_door_weapon', T, T, (g) => {
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
  generateTextureFn('classic_tile_door_armour', T, T, (g) => {
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
  generateTextureFn('classic_tile_home_door', T, T, (g) => {
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
// Classic entity textures  (prefix: 'classic_')
// ---------------------------------------------------------------------------

/** Generates classic_ prefixed entity sprite textures (player, enemies, NPCs).
 * @param {function(string, number, number, function(Phaser.GameObjects.Graphics)):void} generateTextureFn
 */
export function createClassicEntityTextures(generateTextureFn) {
  // Player — blue diamond
  generateTextureFn('classic_entity_player', T, T, (g) => {
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
  generateTextureFn('classic_entity_cockroach', T, T, (g) => {
    g.fillStyle(0x442211);
    g.fillEllipse(T/2, T/2 + 1, 7, 10);
    g.fillStyle(0x664422, 0.8);
    g.fillEllipse(T/2, T/2, 5, 7);
    g.fillStyle(0x442211);
    g.fillRect(T/2 - 3, T/2 - 5, 1, 3);
    g.fillRect(T/2 + 2, T/2 - 5, 1, 3);
  });

  // Sprite — small glowing fairy shape
  generateTextureFn('classic_entity_sprite', T, T, (g) => {
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
  generateTextureFn('classic_entity_goblin', T, T, (g) => {
    g.fillStyle(0x338833);
    g.fillEllipse(T/2, T/2 + 1, 10, 12);
    g.fillStyle(0x44aa44);
    g.fillEllipse(T/2, T/2 - 2, 8, 8);
    g.fillStyle(0xff4444);
    g.fillRect(T/2 - 3, T/2 - 4, 2, 2);
    g.fillRect(T/2 + 1, T/2 - 4, 2, 2);
  });

  // Orc — red/brown shape
  generateTextureFn('classic_entity_orc', T, T, (g) => {
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
  generateTextureFn('classic_entity_troll', T, T, (g) => {
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
  generateTextureFn('classic_entity_skeleton', T, T, (g) => {
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

  // Skeleton Warrior — armoured skeleton with a visible chest-plate and shield arm
  generateTextureFn('classic_entity_skeleton_warrior', T, T, (g) => {
    // Torso / armour plate
    g.fillStyle(0xaaaaaa);
    g.fillRect(5, 6, 6, 7);
    // Armour highlight
    g.fillStyle(0xcccccc);
    g.fillRect(6, 7, 4, 2);
    // Skull
    g.fillStyle(0xcccccc);
    g.fillRect(5, 1, 6, 5);
    // Helmet top
    g.fillStyle(0x888888);
    g.fillRect(4, 1, 8, 2);
    // Eyes — red
    g.fillStyle(0xdd2222);
    g.fillRect(6, 2, 1, 2);
    g.fillRect(9, 2, 1, 2);
    // Legs
    g.fillStyle(0x999999);
    g.fillRect(5, 13, 2, 3);
    g.fillRect(9, 13, 2, 3);
  });

  // Skeleton Mage — robed skeleton with a glowing purple aura
  generateTextureFn('classic_entity_skeleton_mage', T, T, (g) => {
    // Robe body
    g.fillStyle(0x7755aa);
    g.fillRect(4, 6, 8, 8);
    // Robe shadow
    g.fillStyle(0x553388);
    g.fillRect(5, 10, 6, 4);
    // Skull
    g.fillStyle(0xcccccc);
    g.fillRect(5, 1, 6, 5);
    // Eyes — pale purple glow
    g.fillStyle(0xcc88ff);
    g.fillRect(6, 2, 1, 2);
    g.fillRect(9, 2, 1, 2);
    // Staff
    g.fillStyle(0x885533);
    g.fillRect(13, 2, 1, 10);
    g.fillStyle(0xcc88ff);
    g.fillRect(12, 1, 3, 2);
  });

  // Old Bones — imposing ivory skeleton boss
  generateTextureFn('classic_entity_old_bones', T, T, (g) => {
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
  generateTextureFn('classic_entity_creeping_mass', T, T, (g) => {
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

  // Spitter — acid-green blob with a bulging spit gland
  generateTextureFn('classic_entity_spitter', T, T, (g) => {
    // Body — dark olive base
    g.fillStyle(0x2a5500);
    g.fillRect(3, 4, 10, 9);
    // Mid body — bright acid green
    g.fillStyle(0x88cc22);
    g.fillRect(4, 5, 8, 7);
    // Spit gland — glowing yellow-green protrusion at front
    g.fillStyle(0xccee00);
    g.fillRect(10, 6, 3, 4);
    // Eyes — dark with toxic glow
    g.fillStyle(0x004400);
    g.fillRect(5, 5, 2, 2);
    g.fillRect(9, 5, 2, 2);
    // Acid drip below
    g.fillStyle(0x88cc22);
    g.fillRect(5, 12, 2, 2);
    g.fillRect(9, 12, 2, 2);
  });

  // Elder — white-robed sage with brown staff
  generateTextureFn('classic_entity_npc_elder', T, T, (g) => {
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
  generateTextureFn('classic_entity_npc_guard', T, T, (g) => {
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
  generateTextureFn('classic_entity_npc_merchant', T, T, (g) => {
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

  // Warrior — Martel the Varangian: horned iron helm, mail shirt, broad axe
  generateTextureFn('classic_entity_npc_warrior', T, T, (g) => {
    // Tunic — worn amber leather
    g.fillStyle(0x7a5c30);
    g.fillRect(3, T/2, 10, 7);
    // Mail shirt — dark iron links over tunic
    g.fillStyle(0x4a4a5a);
    g.fillRect(4, T/2, 8, 3);
    // Face — weathered skin
    g.fillStyle(0xddaa88);
    g.fillEllipse(T/2, T/2 - 2, 8, 7);
    // Beard — grey from years underground
    g.fillStyle(0x998877);
    g.fillTriangle(T/2 - 3, T/2, T/2 + 3, T/2, T/2, T/2 + 4);
    // Helmet — dark iron nasal helm
    g.fillStyle(0x445566);
    g.fillRect(3, T/2 - 7, 10, 4);
    // Horns — pale yellowed bone
    g.fillStyle(0xccbb99);
    g.fillRect(1, T/2 - 8, 3, 3);
    g.fillRect(T - 4, T/2 - 8, 3, 3);
    // Axe handle — darkened wood
    g.fillStyle(0x774422);
    g.fillRect(T - 3, 2, 2, T - 3);
    // Axe blade — old iron
    g.fillStyle(0x8899aa);
    g.fillTriangle(T - 5, 2, T, 2, T - 2, 7);
  });
}

// ---------------------------------------------------------------------------
// Classic item textures  (prefix: 'classic_')
// ---------------------------------------------------------------------------

/** Generates classic_ prefixed item sprite textures.
 * @param {function(string, number, number, function(Phaser.GameObjects.Graphics)):void} generateTextureFn
 */
export function createClassicItemTextures(generateTextureFn) {
  // Health potion — red vial
  generateTextureFn('classic_item_potion_health', T, T, (g) => {
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
  generateTextureFn('classic_item_weapon', T, T, (g) => {
    g.fillStyle(0xcccccc);
    g.fillRect(T/2 - 1, 2, 2, 10);
    g.fillStyle(0xddaa44);
    g.fillRect(T/2 - 4, 10, 8, 2);
    g.fillStyle(0x885533);
    g.fillRect(T/2 - 1, 12, 2, 4);
  });

  // Armor — shield shape
  generateTextureFn('classic_item_armor', T, T, (g) => {
    g.fillStyle(0x6688aa);
    g.fillRect(3, 2, 10, 8);
    g.fillTriangle(3, 10, 13, 10, T/2, 15);
    g.fillStyle(0xddaa44);
    g.fillRect(T/2 - 1, 4, 2, 5);
    g.fillRect(T/2 - 3, 6, 6, 2);
  });

  // Ranged weapon — bow shape (arc + arrow)
  generateTextureFn('classic_item_ranged_weapon', T, T, (g) => {
    // Bow stave — curved brown arc drawn as a rotated rectangle
    g.fillStyle(0x885533);
    g.fillRect(T/2 - 1, 2, 2, 12);      // stave
    g.fillStyle(0xaaaaaa);
    g.fillRect(T/2 - 1, 7, 1, 1);       // string centre
    g.fillRect(T/2 - 3, 3, 1, 1);       // top string
    g.fillRect(T/2 - 3, 13, 1, 1);      // bottom string
    // Arrow — thin horizontal line
    g.fillStyle(0xcccccc);
    g.fillRect(4, 7, 8, 1);             // arrow shaft
    g.fillStyle(0xddaa44);
    g.fillRect(3, 6, 2, 3);             // arrowhead
  });

  // Bone Blade — serrated ivory weapon
  generateTextureFn('classic_item_bone_blade', T, T, (g) => {
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

  // Night Cloak — dark hooded cloak with shadow shimmer
  generateTextureFn('classic_item_night_cloak', T, T, (g) => {
    g.fillStyle(0x111122);
    g.fillRect(3, 2, 10, 12);
    g.fillTriangle(3, 14, 13, 14, T/2, T - 1);
    g.fillStyle(0x2233aa, 0.5);
    g.fillRect(4, 3, 8, 10);
    g.fillStyle(0x4455cc, 0.4);
    g.fillRect(5, 4, 2, 2);
    g.fillRect(9, 7, 2, 2);
  });

  // Null Scimitar — void-energy curved blade
  generateTextureFn('classic_item_null_scimitar', T, T, (g) => {
    g.fillStyle(0x220033);
    g.fillRect(T/2 - 1, 1, 3, 11);
    g.fillRect(T/2 + 1, 2, 3, 5);
    g.fillStyle(0x9900cc);
    g.fillRect(T/2, 2, 2, 9);
    g.fillRect(T/2 + 1, 3, 2, 4);
    g.fillStyle(0xdd44ff, 0.7);
    g.fillRect(T/2, 3, 1, 6);
    g.fillStyle(0xaaaaaa);
    g.fillRect(T/2 - 3, 11, 7, 2);
    g.fillRect(T/2 - 1, 13, 3, 3);
  });

  // Key to Elsewhere — ornate key with arcane glow
  generateTextureFn('classic_item_key_to_elsewhere', T, T, (g) => {
    // Shaft
    g.fillStyle(0xccaa44);
    g.fillRect(T/2 - 1, 2, 2, 10);
    // Head (bow)
    g.fillStyle(0xddbb55);
    g.fillRect(T/2 - 3, 2, 6, 4);
    g.fillStyle(0x111122);
    g.fillRect(T/2 - 1, 3, 2, 2);
    // Bit (teeth)
    g.fillStyle(0xddbb55);
    g.fillRect(T/2 + 1, 8, 2, 2);
    g.fillRect(T/2 + 1, 11, 2, 2);
    // Arcane glow
    g.fillStyle(0x88aaff, 0.5);
    g.fillRect(T/2 - 1, 3, 2, 1);
  });

  // Eclipse Blade — void-dark sword that drinks light
  generateTextureFn('classic_item_eclipse_blade', T, T, (g) => {
    // Blade — deep black with dim void shimmer
    g.fillStyle(0x080808);
    g.fillRect(T/2 - 1, 1, 3, 10);
    g.fillStyle(0x222244, 0.6);
    g.fillRect(T/2, 2, 1, 8);
    // Guard — dark iron bar
    g.fillStyle(0x1a1a1a);
    g.fillRect(T/2 - 4, 11, 9, 2);
    // Handle — wrapped grip
    g.fillStyle(0x111111);
    g.fillRect(T/2 - 1, 13, 3, 3);
  });

  // Key to Beyond — heavy iron key with indecipherable runes
  generateTextureFn('classic_item_key_to_beyond', T, T, (g) => {
    // Shaft — dark iron
    g.fillStyle(0x333333);
    g.fillRect(T/2 - 1, 2, 2, 11);
    // Head (bow) — chunky ring
    g.fillStyle(0x444444);
    g.fillRect(T/2 - 3, 2, 7, 5);
    g.fillStyle(0x111111);
    g.fillRect(T/2 - 1, 3, 3, 3);
    // Bit (teeth) — heavy notches
    g.fillStyle(0x444444);
    g.fillRect(T/2 + 1, 8, 2, 2);
    g.fillRect(T/2 + 1, 11, 3, 2);
    // Rune marks — faint reddish
    g.fillStyle(0x550000, 0.6);
    g.fillRect(T/2 - 1, 5, 1, 1);
    g.fillRect(T/2,     8, 1, 1);
  });

  // Skeleton Shield — interlocked bone segments
  generateTextureFn('classic_item_skeleton_shield', T, T, (g) => {
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
  generateTextureFn('classic_item_potion_teleport', T, T, (g) => {
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

  // Home Seeking Scroll — rolled parchment with a glowing portal rune
  generateTextureFn('classic_item_home_seeking_scroll', T, T, (g) => {
    // Parchment body
    g.fillStyle(0xddcc88);
    g.fillRect(3, 4, 10, 8);
    // Rolled ends
    g.fillStyle(0xbbaa66);
    g.fillRect(3, 3, 10, 2);
    g.fillRect(3, 11, 10, 2);
    // Portal rune — cyan glyph
    g.fillStyle(0x44ddff);
    g.fillRect(T/2 - 1, 5, 2, 2);
    g.fillRect(T/2 - 2, 7, 5, 1);
    g.fillRect(T/2 - 1, 9, 2, 2);
  });

  // Helmet — rounded cap shape
  generateTextureFn('classic_item_helmet', T, T, (g) => {
    g.fillStyle(0x8899aa);
    g.fillRect(3, 5, 10, 7);
    g.fillRect(4, 3, 8, 3);
    g.fillRect(6, 2, 4, 2);
    g.fillRect(2, 12, 12, 2);
  });

  // Chest — breastplate shape
  generateTextureFn('classic_item_chest', T, T, (g) => {
    g.fillStyle(0x8899aa);
    g.fillRect(3, 2, 10, 12);
    g.fillStyle(0x667788);
    g.fillRect(4, 4, 8, 2);
    g.fillRect(4, 8, 8, 2);
  });

  // Legs — greaves shape
  generateTextureFn('classic_item_legs', T, T, (g) => {
    g.fillStyle(0x8899aa);
    g.fillRect(3, 1, 10, 6);
    g.fillRect(3, 9, 4, 6);
    g.fillRect(9, 9, 4, 6);
  });

  // Arms — gauntlet shape
  generateTextureFn('classic_item_arms', T, T, (g) => {
    g.fillStyle(0x8899aa);
    g.fillRect(4, 2, 8, 5);
    g.fillRect(3, 7, 10, 7);
    g.fillStyle(0x667788);
    g.fillRect(4, 9, 8, 2);
  });

  // Boots — boot silhouette
  generateTextureFn('classic_item_boots', T, T, (g) => {
    g.fillStyle(0x8899aa);
    g.fillRect(4, 1, 6, 10);
    g.fillRect(3, 11, 9, 4);
    g.fillRect(3, 14, 11, 2);
  });

  // Ring — circle outline
  generateTextureFn('classic_item_ring', T, T, (g) => {
    g.fillStyle(0xddaa44);
    g.fillEllipse(T/2, T/2, 12, 12);
    g.fillStyle(0x111122);
    g.fillEllipse(T/2, T/2, 7, 7);
    g.fillStyle(0xff4444);
    g.fillEllipse(T/2, T/2 - 4, 4, 4);
  });

  // Amulet — teardrop with chain
  generateTextureFn('classic_item_amulet', T, T, (g) => {
    g.fillStyle(0xddaa44);
    g.fillRect(T/2 - 1, 1, 2, 6);
    g.fillRect(T/2 - 4, 3, 8, 2);
    g.fillEllipse(T/2, T/2 + 3, 9, 10);
    g.fillStyle(0x44aadd);
    g.fillEllipse(T/2, T/2 + 3, 5, 6);
  });
}

/**
 * Generates themed tile textures for unique named rooms.  Each unique room
 * definition has a `floorKey` and `wallKey`.
 *
 * The Dark Armoury uses a blackened-iron / rust palette.
 * The Necropolis Library uses an obsidian / arcane-blue palette.
 * @param {function(string, number, number, function(Phaser.GameObjects.Graphics)):void} generateTextureFn
 */
export function createClassicUniqueRoomTileTextures(generateTextureFn) {
  // ── Decoration tile textures ─────────────────────────────
  // Weapon mount — dark iron bracket with two crossed blades (steel gray)
  generateTextureFn('classic_tile_weapon_mount', T, T, (g) => {
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
  generateTextureFn('classic_tile_bookcase', T, T, (g) => {
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
  generateTextureFn('classic_tile_floor_dark_armoury', T, T, (g) => {
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
  generateTextureFn('classic_tile_wall_dark_armoury', T, T, (g) => {
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
  generateTextureFn('classic_tile_floor_necropolis_library', T, T, (g) => {
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
  generateTextureFn('classic_tile_wall_necropolis_library', T, T, (g) => {
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
  generateTextureFn('classic_tile_locked_door', T, T, (g) => {
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
  generateTextureFn('classic_tile_recall_portal', T, T, (g) => {
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
  generateTextureFn('classic_tile_floor_darker_way', T, T, (g) => {
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
  generateTextureFn('classic_tile_wall_darker_way', T, T, (g) => {
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
  generateTextureFn('classic_tile_trash_pile_1', T, T, (g) => {
    drawClassicFloor(g);
    g.fillStyle(0x0c0c20); g.fillRect(5, 10, 7, 3);  // cast shadow on floor
    g.fillStyle(0x32324e); g.fillRect(5, 8, 6, 4);   // pile body
    g.fillStyle(0x3e3e5c); g.fillRect(6, 8, 4, 1);   // top-face highlight
    g.fillStyle(0x3e3e5c); g.fillRect(5, 9, 1, 1);
    g.fillStyle(0x26263e); g.fillRect(9, 10, 2, 2);  // right-side shadow
  });

  // ── Variant 2: two separate angular stone chips ───────────────────────────
  generateTextureFn('classic_tile_trash_pile_2', T, T, (g) => {
    drawClassicFloor(g);
    g.fillStyle(0x0c0c20); g.fillRect(3, 11, 4, 2);  // shadow left chip
    g.fillStyle(0x0c0c20); g.fillRect(9, 11, 4, 2);  // shadow right chip
    g.fillStyle(0x32324e); g.fillRect(3, 9, 4, 3);   // left chip body
    g.fillStyle(0x32324e); g.fillRect(9, 9, 4, 3);   // right chip body
    g.fillStyle(0x3e3e5c); g.fillRect(3, 9, 4, 1);   // left top-face
    g.fillStyle(0x3e3e5c); g.fillRect(9, 9, 4, 1);   // right top-face
  });

  // ── Variant 3: flat elongated grit strip ─────────────────────────────────
  generateTextureFn('classic_tile_trash_pile_3', T, T, (g) => {
    drawClassicFloor(g);
    g.fillStyle(0x0c0c20); g.fillRect(2, 11, 12, 2); // cast shadow
    g.fillStyle(0x32324e); g.fillRect(2, 9, 12, 3);  // grit body (low and wide)
    g.fillStyle(0x3e3e5c); g.fillRect(3, 9, 10, 1);  // top highlight
    g.fillStyle(0x26263e); g.fillRect(2, 11, 12, 1); // base edge shadow
  });
}