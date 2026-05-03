/**
 * @module HiddenPassagePlacer
 * Places hidden rooms behind BREAKABLE_WALL tiles during dungeon generation,
 * and provides a utility for checking player proximity to those walls.
 */

import { TILE } from '../utils/TileTypes.js';

/** Probability that a given BREAKABLE_WALL conceals a hidden room. */
const PASSAGE_CHANCE = 0.4;

/** Side length of the square hidden room carved beyond the passage wall. */
const ROOM_SIZE = 3;

/** Maximum Manhattan distance at which the "draft" hint is triggered. */
const DRAFT_RADIUS = 8;

/** Cardinal directions for adjacency checks. */
const DIRS = [
  { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
  { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
];

/**
 * Returns true for tile types that count as walkable/occupied — used to
 * detect collisions when testing the proposed hidden room area.
 *
 * @param {number} t
 * @returns {boolean}
 */
function _isWalkableTile(t) {
  return (
    t === TILE.FLOOR ||
    t === TILE.DOOR ||
    t === TILE.STAIRS_DOWN ||
    t === TILE.STAIRS_UP ||
    t === TILE.TOWN_ACCENT ||
    t === TILE.RECALL_PORTAL
  );
}

export class HiddenPassagePlacer {
  /**
   * Scans the map for BREAKABLE_WALL tiles and, with a random chance per wall,
   * carves a 3×3 hidden room beyond it in the outward direction (away from the
   * adjacent dungeon room).  Eligible walls that get a room are promoted to
   * HIDDEN_PASSAGE_WALL so the game can distinguish them from regular breakable
   * walls.
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {{ next: () => number }} rng
   * @param {boolean} [force=false] - When true, skips the per-wall chance roll.
   * @returns {Array<{wallX:number, wallY:number, room:{x:number,y:number,w:number,h:number}}>}
   */
  place(map, rng, force = false) {
    const passages = [];

    // Collect all current BREAKABLE_WALL positions.
    const candidates = [];
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.getTile(x, y) === TILE.BREAKABLE_WALL) {
          candidates.push({ x, y });
        }
      }
    }

    // Shuffle so selection order is random.
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    for (const { x: wx, y: wy } of candidates) {
      if (!force && rng.next() >= PASSAGE_CHANCE) continue;

      const inDir = this._findInwardDir(map, wx, wy);
      if (!inDir) continue;

      // Outward direction is opposite to the inward (room-facing) direction.
      const dx = -inDir.dx;
      const dy = -inDir.dy;

      const room = this._tryCarveRoom(map, wx, wy, dx, dy);
      if (!room) continue;

      map.setTile(wx, wy, TILE.HIDDEN_PASSAGE_WALL);
      passages.push({ wallX: wx, wallY: wy, room });
    }

    return passages;
  }

  /**
   * Returns the cardinal direction from the wall toward the adjacent room floor,
   * or null if no adjacent floor tile is found.
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {number} wx
   * @param {number} wy
   * @returns {{ dx:number, dy:number }|null}
   */
  _findInwardDir(map, wx, wy) {
    for (const { dx, dy } of DIRS) {
      const nx = wx + dx;
      const ny = wy + dy;
      if (map.inBounds(nx, ny) && map.getTile(nx, ny) === TILE.FLOOR) {
        return { dx, dy };
      }
    }
    return null;
  }

  /**
   * Attempts to carve a ROOM_SIZE × ROOM_SIZE hidden room starting one tile
   * beyond the wall in the outward direction.  Returns the room bounds on
   * success, or null if the area is occupied or out of bounds.
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {number} wx - Wall x.
   * @param {number} wy - Wall y.
   * @param {number} dx - Outward x direction component.
   * @param {number} dy - Outward y direction component.
   * @returns {{ x:number, y:number, w:number, h:number }|null}
   */
  _tryCarveRoom(map, wx, wy, dx, dy) {
    let rx, ry;
    if (dx !== 0) {
      // Horizontal outward direction — room extends in x, centred on wy.
      rx = dx > 0 ? wx + 1 : wx - ROOM_SIZE;
      ry = wy - Math.floor(ROOM_SIZE / 2);
    } else {
      // Vertical outward direction — room extends in y, centred on wx.
      rx = wx - Math.floor(ROOM_SIZE / 2);
      ry = dy > 0 ? wy + 1 : wy - ROOM_SIZE;
    }
    const rw = ROOM_SIZE;
    const rh = ROOM_SIZE;

    // Check the room plus its 1-tile border fits within the map and contains
    // no occupied tiles that would indicate a collision with another room.
    for (let y = ry - 1; y <= ry + rh; y++) {
      for (let x = rx - 1; x <= rx + rw; x++) {
        if (!map.inBounds(x, y)) return null;
        if (_isWalkableTile(map.getTile(x, y))) return null;
      }
    }

    // Carve floor tiles.
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        map.setTile(x, y, TILE.FLOOR);
      }
    }

    // Seal border: convert EMPTY tiles around the new floor to WALL.
    for (let x = rx - 1; x <= rx + rw; x++) {
      if (map.getTile(x, ry - 1) === TILE.EMPTY) map.setTile(x, ry - 1, TILE.WALL);
      if (map.getTile(x, ry + rh) === TILE.EMPTY) map.setTile(x, ry + rh, TILE.WALL);
    }
    for (let y = ry; y < ry + rh; y++) {
      if (map.getTile(rx - 1, y) === TILE.EMPTY) map.setTile(rx - 1, y, TILE.WALL);
      if (map.getTile(rx + rw, y) === TILE.EMPTY) map.setTile(rx + rw, y, TILE.WALL);
    }

    return { x: rx, y: ry, w: rw, h: rh };
  }
}

/**
 * Scans the map for HIDDEN_PASSAGE_WALL tiles and returns those within
 * DRAFT_RADIUS Manhattan distance of the player that have not yet triggered
 * the hint this floor.  Side-effect: adds triggered walls to `shownSet`.
 *
 * @param {import('./DungeonMap.js').DungeonMap} map
 * @param {number} playerX
 * @param {number} playerY
 * @param {Set<string>} shownSet - Keys of walls that have already fired; mutated.
 * @returns {Array<{x:number, y:number}>}
 */
export function checkDraftProximity(map, playerX, playerY, shownSet) {
  const triggered = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.getTile(x, y) !== TILE.HIDDEN_PASSAGE_WALL) continue;
      const key = `${x},${y}`;
      if (shownSet.has(key)) continue;
      const dist = Math.abs(x - playerX) + Math.abs(y - playerY);
      if (dist <= DRAFT_RADIUS) {
        shownSet.add(key);
        triggered.push({ x, y });
      }
    }
  }
  return triggered;
}
