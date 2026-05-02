/**
 * @module BreakableWallPlacer
 * @description Places BREAKABLE_WALL tiles on the perimeter walls surrounding
 * dungeon rooms. Breakable walls look like regular walls but can be destroyed
 * by a player equipped with a pick axe.
 *
 * Placement rules:
 *  - 25% chance a given room receives any breakable walls.
 *  - 1–2 breakable walls per selected room.
 *  - Only WALL tiles directly adjacent (4-directional) to a room FLOOR tile
 *    are eligible — inner perimeter walls only.
 *  - Tiles adjacent to corridor entries are excluded to avoid blocking
 *    passage (reuses the isTooCloseToEntry guard from TrashPilePlacer).
 */
import { TILE } from '../utils/TileTypes.js';

/** Probability that any given room gets at least one breakable wall. */
const ROOM_CHANCE = 0.25;
const MIN_WALLS = 1;
const MAX_WALLS = 2;

/** Cardinal direction offsets. */
const DIRS = [
  { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
  { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
];

/**
 * Returns true if any of the four neighbours of (wx, wy) is a FLOOR tile
 * that belongs to a corridor rather than the room interior.
 * A corridor entry is detected as a FLOOR tile outside the room bounds.
 *
 * @param {import('./DungeonMap.js').DungeonMap} map
 * @param {number} wx - Wall tile x.
 * @param {number} wy - Wall tile y.
 * @param {{ x:number, y:number, w:number, h:number }} room
 * @returns {boolean}
 */
function isAdjacentToCorridor(map, wx, wy, room) {
  for (const { dx, dy } of DIRS) {
    const nx = wx + dx;
    const ny = wy + dy;
    if (!map.inBounds(nx, ny)) continue;
    if (map.getTile(nx, ny) !== TILE.FLOOR) continue;
    // If the adjacent floor tile is outside the room bounds it's a corridor.
    if (nx < room.x || nx >= room.x + room.w || ny < room.y || ny >= room.y + room.h) {
      return true;
    }
  }
  return false;
}

export class BreakableWallPlacer {
  /**
   * Iterates over `rooms` and places 1–2 BREAKABLE_WALL tiles on eligible
   * perimeter walls for rooms that pass a random chance check.
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {Array<{x:number, y:number, w:number, h:number}>} rooms
   * @param {{ next: () => number }} rng
   */
  placeWalls(map, rooms, rng) {
    for (const room of rooms) {
      if (rng.next() >= ROOM_CHANCE) continue;
      const count = MIN_WALLS + Math.floor(rng.next() * (MAX_WALLS - MIN_WALLS + 1));
      this._placeInRoom(map, room, count, rng);
    }
  }

  /**
   * Collects eligible perimeter wall tiles for `room` and converts up to
   * `count` of them to BREAKABLE_WALL.
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {{ x:number, y:number, w:number, h:number }} room
   * @param {number} count
   * @param {{ next: () => number }} rng
   */
  _placeInRoom(map, room, count, rng) {
    const candidates = [];

    // Scan one tile beyond each edge of the room to find perimeter WALL tiles.
    const x0 = room.x - 1;
    const y0 = room.y - 1;
    const x1 = room.x + room.w;
    const y1 = room.y + room.h;

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!map.inBounds(x, y)) continue;
        if (map.getTile(x, y) !== TILE.WALL) continue;
        if (isAdjacentToCorridor(map, x, y, room)) continue;

        // Must be adjacent to a room FLOOR tile (directly borders the room).
        const nextToRoom = DIRS.some(({ dx, dy }) => {
          const nx = x + dx;
          const ny = y + dy;
          return (
            map.inBounds(nx, ny) &&
            map.getTile(nx, ny) === TILE.FLOOR &&
            nx >= room.x && nx < room.x + room.w &&
            ny >= room.y && ny < room.y + room.h
          );
        });
        if (nextToRoom) candidates.push({ x, y });
      }
    }

    // Fisher-Yates shuffle for random selection without replacement.
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    for (let i = 0; i < Math.min(count, candidates.length); i++) {
      map.setTile(candidates[i].x, candidates[i].y, TILE.BREAKABLE_WALL);
    }
  }
}
