/**
 * @module LockedRoomPlacer
 * Utilities for checking whether a candidate inner room area is free of
 * existing floor tiles before carving it into the dungeon map.
 */

import { TILE } from '../utils/TileTypes.js';

/**
 * Returns true when no FLOOR tile exists within the 1-tile border surrounding
 * the proposed inner room area — i.e. the space is safe to carve.
 *
 * The check rectangle spans from (innerX-1, innerY-1) to
 * (innerX+innerW, innerY+innerH), inclusive.  WALL tiles in that range are
 * allowed (they come from adjacent BSP room borders); only FLOOR tiles indicate
 * a conflict with an existing corridor or room.
 *
 * @param {import('../dungeon/DungeonMap.js').DungeonMap} dungeonMap
 * @param {number} innerX - Left column of the proposed inner room floor.
 * @param {number} innerY - Top row of the proposed inner room floor.
 * @param {number} innerW - Width of the proposed inner room floor.
 * @param {number} innerH - Height of the proposed inner room floor.
 * @returns {boolean}
 */
export function isInnerRoomSpaceAvailable(dungeonMap, innerX, innerY, innerW, innerH) {
  const x0 = innerX - 1;
  const y0 = innerY - 1;
  const x1 = innerX + innerW;
  const y1 = innerY + innerH;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (dungeonMap.getTile(x, y) === TILE.FLOOR) return false;
    }
  }
  return true;
}
