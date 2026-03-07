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

/**
 * Mutable singleton that holds the current developer option values.
 * All fields reset to these defaults when `resetDevOptions()` is called.
 *
 * @property {number}   startFloor - Dungeon floor to begin on (1-indexed).
 * @property {number}   startLevel - Player character level at game start.
 * @property {string[]} startItems - Array of ITEM_TYPES keys to place in the
 *                                   player's inventory at game start.
 */
export const devOptions = {
  startFloor: 1,
  startLevel: 1,
  startItems: [],
};

/**
 * Resets all developer options to their default (vanilla) values.
 */
export function resetDevOptions() {
  devOptions.startFloor = 1;
  devOptions.startLevel = 1;
  devOptions.startItems = [];
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
