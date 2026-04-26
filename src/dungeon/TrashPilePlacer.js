/**
 * @module TrashPilePlacer
 * @description Places random trash pile tiles inside dungeon rooms.
 * Three visual variants (TRASH_PILE_1/2/3) are chosen at random.
 * Trash piles are placed only on plain FLOOR tiles and never adjacent
 * to corridor entry points so that room access is never blocked.
 */
import { TILE } from '../utils/TileTypes.js';

const TRASH_TILES = [TILE.TRASH_PILE_1, TILE.TRASH_PILE_2, TILE.TRASH_PILE_3];

/** Chance (0–1) that any given room receives trash piles. */
const ROOM_CHANCE = 0.4;
const MIN_PILES = 1;
const MAX_PILES = 3;

/**
 * Returns true if (x, y) is at or immediately adjacent to a corridor
 * doorway — the same two-level check used by RoomDecorationPlacer.
 *
 * @param {import('./DungeonMap.js').DungeonMap} map
 * @param {number} x
 * @param {number} y
 * @param {{ x:number, y:number, w:number, h:number }} room
 * @returns {boolean}
 */
function isTooCloseToEntry(map, x, y, room) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const outsideRoom = (nx, ny) =>
    nx < room.x || nx >= room.x + room.w ||
    ny < room.y || ny >= room.y + room.h;

  for (const [dx, dy] of dirs) {
    const nx = x + dx, ny = y + dy;
    if (outsideRoom(nx, ny)) {
      if (map.getTile(nx, ny) === TILE.FLOOR) return true;
    } else {
      for (const [dx2, dy2] of dirs) {
        const nnx = nx + dx2, nny = ny + dy2;
        if (outsideRoom(nnx, nny) && map.getTile(nnx, nny) === TILE.FLOOR) return true;
      }
    }
  }
  return false;
}

export class TrashPilePlacer {
  /**
   * Iterates over `rooms` and places 1–3 trash pile tiles in each room
   * that passes a random chance check.
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {Array<{x:number,y:number,w:number,h:number}>} rooms
   * @param {{ next: () => number }} rng  - RNG with .next() returning [0, 1)
   */
  placeTrash(map, rooms, rng) {
    for (const room of rooms) {
      if (rng.next() >= ROOM_CHANCE) continue;
      const count = MIN_PILES + Math.floor(rng.next() * (MAX_PILES - MIN_PILES + 1));
      this._placeInRoom(map, room, count, rng);
    }
  }

  /**
   * Places up to `count` trash piles at random valid positions inside `room`.
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {{ x:number, y:number, w:number, h:number }} room
   * @param {number} count
   * @param {{ next: () => number }} rng
   */
  _placeInRoom(map, room, count, rng) {
    // Collect all valid candidate positions (plain FLOOR, not near entry).
    const candidates = [];
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        if (map.getTile(x, y) === TILE.FLOOR && !isTooCloseToEntry(map, x, y, room)) {
          candidates.push({ x, y });
        }
      }
    }

    // Fisher-Yates shuffle so we pick random positions without replacement.
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    for (let i = 0; i < Math.min(count, candidates.length); i++) {
      const { x, y } = candidates[i];
      const variant = TRASH_TILES[Math.floor(rng.next() * TRASH_TILES.length)];
      map.setTile(x, y, variant);
    }
  }
}
