/**
 * @module LockedRoomPlacer
 * Utilities for determining whether and how a locked alcove can be safely
 * carved inside a unique room without exposing the alcove to existing BSP
 * corridor entries.
 */

import { TILE } from '../utils/TileTypes.js';

/**
 * Determines the safe orientation for a locked alcove inside a room by
 * scanning all four room edges for BSP corridor entry points.
 *
 * An entry in the upper half of the room (y ≤ midY) means the player arrives
 * from that side — so the accessible zone is the top and the alcove must go to
 * the bottom ('bottom').  An entry in the lower half (y > midY) requires the
 * alcove at the top ('top').  If entries exist in both halves no orientation is
 * safe and null is returned.
 *
 * @param {import('../dungeon/DungeonMap.js').DungeonMap} dungeonMap
 * @param {{ x:number, y:number, w:number, h:number }} room
 * @returns {'bottom'|'top'|null}
 */
export function getLockedRoomOrientation(dungeonMap, room) {
  const midY = room.y + Math.floor(room.h / 2);
  let upperEntry = false;
  let lowerEntry = false;

  // Top edge — vertical corridor arriving from above.
  for (let x = room.x; x < room.x + room.w && !upperEntry; x++) {
    if (dungeonMap.getTile(x, room.y - 1) === TILE.FLOOR) upperEntry = true;
  }
  // Bottom edge — vertical corridor arriving from below.
  for (let x = room.x; x < room.x + room.w && !lowerEntry; x++) {
    if (dungeonMap.getTile(x, room.y + room.h) === TILE.FLOOR) lowerEntry = true;
  }
  // Left and right sides — split at midY.
  for (let y = room.y; y < room.y + room.h; y++) {
    if (
      dungeonMap.getTile(room.x - 1, y) === TILE.FLOOR ||
      dungeonMap.getTile(room.x + room.w, y) === TILE.FLOOR
    ) {
      if (y <= midY) upperEntry = true;
      else lowerEntry = true;
    }
  }

  if (upperEntry && lowerEntry) return null; // entries on both sides — no safe orientation
  return lowerEntry ? 'top' : 'bottom';      // default alcove-at-bottom when no lower entry
}
