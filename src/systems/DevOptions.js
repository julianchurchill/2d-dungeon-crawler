/**
 * @module DevOptions
 * Developer-only configuration that lets testers start a new game at a
 * specific dungeon floor and character level, and with a pre-set inventory.
 *
 * The singleton object `devOptions` is mutated directly by the
 * `DevOptionsScene` UI.  `applyToGame` is called by `GameScene.create()`
 * immediately after the `Player` and `FloorManager` are constructed so that
 * all settings take effect before the first floor is generated.
 */

import { Item } from '../items/Item.js';
import { ITEM_TYPES } from '../items/ItemTypes.js';
import { isDevEnvironment } from '../utils/Environment.js';

/**
 * Default starting inventory used in development mode.
 * Gives the developer a representative set of items to test with immediately,
 * including one of each equipment type so all slots can be tested.
 */
export const DEV_START_ITEMS = ['HEALTH_POTION', 'HEALTH_POTION', 'MEGA_POTION', 'SWORD', 'LEATHER_ARMOR', 'SHORT_BOW'];

/**
 * Mutable singleton that holds the current developer option values.
 * All fields reset to these defaults when `resetDevOptions()` is called.
 *
 * @property {number}   startFloor           - Dungeon floor to begin on (0 = town).
 * @property {number}   startLevel           - Player character level at game start.
 * @property {string[]} startItems           - Array of ITEM_TYPES keys to place in the
 *                                             player's inventory at game start.
 * @property {Object.<string,number>|null} spawnWeights - Map of enemy type → weight for
 *                                             the spawn table, or null to use floor defaults.
 * @property {number|null} minEnemiesPerRoom  - Minimum enemies spawned per room, or null
 *                                             to use the floor default (0).
 * @property {number|null} maxEnemiesPerRoom  - Maximum enemies spawned per room, or null
 *                                             to use the floor-scaled default.
 * @property {boolean} enemiesInvincible      - When true, all enemies take zero damage.
 * @property {boolean} playerInvincible       - When true, the player takes zero damage.
 * @property {Object.<string,number>|null} bossQuantities - Map of boss type → exact total
 *                                             count to place on the level, or null to use
 *                                             the normal boss-spawn logic.
 * @property {Object.<string,number>|null} championQuantities - Map of enemy type → exact total
 *                                             count of champion variants to place on the level,
 *                                             or null to use the normal 10% champion-chance logic.
 * @property {string|null} forceUniqueRoom   - When set to a unique-room id (e.g. 'dark_armoury'),
 *                                             that room is forced to spawn on the next floor,
 *                                             ignoring the probability check and the already-seen
 *                                             guard.  Null uses normal random logic.
 */
export const devOptions = {
  startFloor: 0,
  startLevel: 1,
  startItems: isDevEnvironment() ? [...DEV_START_ITEMS] : [],
  spawnWeights: null,
  minEnemiesPerRoom: null,
  maxEnemiesPerRoom: null,
  enemiesInvincible: false,
  playerInvincible: false,
  bossQuantities: null,
  championQuantities: null,
  forceUniqueRoom: null,
};

/**
 * Resets all developer options to their default (vanilla) values.
 */
export function resetDevOptions() {
  devOptions.startFloor = 0;
  devOptions.startLevel = 1;
  devOptions.startItems = isDevEnvironment() ? [...DEV_START_ITEMS] : [];
  devOptions.spawnWeights = null;
  devOptions.minEnemiesPerRoom = null;
  devOptions.maxEnemiesPerRoom = null;
  devOptions.enemiesInvincible = false;
  devOptions.playerInvincible = false;
  devOptions.bossQuantities = null;
  devOptions.championQuantities = null;
  devOptions.forceUniqueRoom = null;
}

/**
 * Returns true if the current spawn configuration is valid for starting a game.
 * The config is invalid only when `spawnWeights` is non-null and every weight
 * is zero — which would produce an empty spawn table and crash the spawner.
 *
 * @param {typeof devOptions} opts - The dev options object to validate.
 * @returns {boolean}
 */
export function isSpawnConfigValid(opts) {
  if (opts.spawnWeights === null) return true;
  return Object.values(opts.spawnWeights).some(w => w > 0);
}

/**
 * Applies the current developer options to a freshly constructed player and
 * floor manager.  Must be called before `FloorManager.generateFloor()` so
 * that `currentFloor` is already set when enemy spawn tables are evaluated.
 *
 * @param {import('../entities/Player.js').Player}           player       - The player instance to modify.
 * @param {import('../systems/FloorManager.js').FloorManager} floorManager - The floor manager to configure.
 */
export function applyToGame(player, floorManager) {
  // Level up the player from level 1 to the requested start level.
  for (let i = 1; i < devOptions.startLevel; i++) {
    player.levelUp();
  }

  // Set the floor before generateFloor() is called so spawn tables reflect
  // the correct difficulty level.
  floorManager.currentFloor = devOptions.startFloor;

  // Pre-populate the player's inventory with the configured items.
  // Items are placed at tile (0, 0) — their position is irrelevant for
  // inventory items (they have no on-map sprite).
  for (const key of devOptions.startItems) {
    const typeDef = ITEM_TYPES[key];
    if (typeDef) {
      player.addItem(new Item(0, 0, typeDef));
    }
  }
}
