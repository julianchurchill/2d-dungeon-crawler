/**
 * @module TileLabelMap
 * @description Maps TILE type constants to human-readable display names used
 * by the Look feature when the player inspects a map cell.
 */
import { TILE } from './TileTypes.js';

/** @type {Record<number, string>} */
const TILE_LABELS = {
  [TILE.FLOOR]:       'Stone Floor',
  [TILE.WALL]:        'Stone Wall',
  [TILE.DOOR]:        'Door',
  [TILE.STAIRS_DOWN]: 'Stairs Down',
  [TILE.STAIRS_UP]:   'Stairs Up',
  [TILE.TOWN_ACCENT]: 'Cobblestone',
  [TILE.SHOP_ROOF]:   'Shop Interior',
  [TILE.HOME_DOOR]:     'Home Door',
  [TILE.WEAPON_MOUNT]:  'Weapon Mount',
  [TILE.BOOKCASE]:      'Bookcase',
  [TILE.EMPTY]:         'Void',
};

/**
 * Returns the display name for a tile type.
 * @param {number} tileType - A TILE constant.
 * @returns {string}
 */
export function getTileLabel(tileType) {
  return TILE_LABELS[tileType] ?? 'Unknown';
}
