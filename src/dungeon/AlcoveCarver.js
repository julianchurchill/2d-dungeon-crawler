/**
 * @module AlcoveCarver
 * @description Carves a small cave alcove beyond a freshly broken wall.
 * Called after a pick axe destroys a BREAKABLE_WALL tile; produces 1–3 new
 * FLOOR tiles in the direction of movement, seals the surrounding void with
 * WALL tiles (mirroring buildWalls), and gives each bordering WALL a small
 * chance of becoming a BREAKABLE_WALL.
 */
import { TILE } from '../utils/TileTypes.js';

/** Probability the tile directly ahead of the break becomes floor. */
const FORWARD_CHANCE = 0.75;

/** Probability each diagonal alcove tile becomes floor. */
const DIAGONAL_CHANCE = 0.4;

/** Probability each wall bordering the new alcove becomes breakable. */
const BREAKABLE_CHANCE = 0.25;

/** Cardinal direction offsets used for wall-neighbour checks. */
const DIRS = [
  { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
  { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
];

/** All 8 directions used for sealing empty tiles (mirrors buildWalls). */
const ALL_DIRS = [
  { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
  { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
  { dx: 1, dy: 1 }, { dx: -1, dy: 1 },
  { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
];

export class AlcoveCarver {
  /**
   * Carves an alcove beyond the broken wall, seals surrounding empty space
   * with wall tiles, and marks some bordering walls as breakable.
   * Modifies `map` in-place and returns the list of changes.
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {number} wallX - X of the wall that was just broken.
   * @param {number} wallY - Y of the wall that was just broken.
   * @param {number} dx - Horizontal component of the player's movement direction.
   * @param {number} dy - Vertical component of the player's movement direction.
   * @param {{ next: () => number }} rng
   * @returns {Array<{x:number, y:number, tile:number}>} Tiles that changed.
   */
  carve(map, wallX, wallY, dx, dy, rng) {
    const changes = [];
    const newFloors = [];

    // Phase 1 — carve floor tiles: directly ahead and the two forward diagonals.
    // Perpendicular vectors: left = (-dy, dx), right = (dy, -dx).
    const candidates = [
      { x: wallX + dx,          y: wallY + dy,          chance: FORWARD_CHANCE  },
      { x: wallX + dx + (-dy),  y: wallY + dy + dx,     chance: DIAGONAL_CHANCE },
      { x: wallX + dx + dy,     y: wallY + dy + (-dx),  chance: DIAGONAL_CHANCE },
    ];

    for (const { x, y, chance } of candidates) {
      if (!map.inBounds(x, y)) continue;
      const t = map.getTile(x, y);
      // Carve WALL tiles (room perimeter) and EMPTY tiles (void beyond walls).
      if (t !== TILE.WALL && t !== TILE.EMPTY) continue;
      if (rng.next() < chance) {
        map.setTile(x, y, TILE.FLOOR);
        newFloors.push({ x, y });
        changes.push({ x, y, tile: TILE.FLOOR });
      }
    }

    // Phase 2 — breakable chance: give each cardinal WALL neighbour of a new
    // floor tile (original room-perimeter walls only) a small chance to become
    // a BREAKABLE_WALL. This runs before sealing so newly sealed tiles don't
    // inherit the breakable chance.
    for (const { x, y } of newFloors) {
      for (const { dx: ddx, dy: ddy } of DIRS) {
        const nx = x + ddx;
        const ny = y + ddy;
        if (!map.inBounds(nx, ny)) continue;
        if (map.getTile(nx, ny) !== TILE.WALL) continue;
        if (rng.next() < BREAKABLE_CHANCE) {
          map.setTile(nx, ny, TILE.BREAKABLE_WALL);
          changes.push({ x: nx, y: ny, tile: TILE.BREAKABLE_WALL });
        }
      }
    }

    // Phase 3 — seal: convert EMPTY tiles around new floor tiles to WALL,
    // mirroring how buildWalls() creates the room perimeter. Uses 8-directional
    // adjacency so corners are also covered.
    for (const { x, y } of newFloors) {
      for (const { dx: ddx, dy: ddy } of ALL_DIRS) {
        const nx = x + ddx;
        const ny = y + ddy;
        if (!map.inBounds(nx, ny)) continue;
        if (map.getTile(nx, ny) !== TILE.EMPTY) continue;
        map.setTile(nx, ny, TILE.WALL);
        changes.push({ x: nx, y: ny, tile: TILE.WALL });
      }
    }

    return changes;
  }
}
