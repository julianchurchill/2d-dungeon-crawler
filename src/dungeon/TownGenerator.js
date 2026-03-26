/**
 * TownGenerator — produces the fixed, non-random town layout for floor 0.
 * The town is the starting area for every new game; its layout never changes.
 *
 * Layout (20×20):
 *   - Outer wall border
 *   - Open floor interior
 *   - Stairs down at (18, 18)
 *   - Player start at (1, 1)
 */
import { DungeonMap } from './DungeonMap.js';
import { TILE } from '../utils/TileTypes.js';

/** Width of the fixed town map in tiles. */
const TOWN_WIDTH = 20;
/** Height of the fixed town map in tiles. */
const TOWN_HEIGHT = 20;
/** Player start position in the town. */
const START_POS = { x: 1, y: 1 };
/** Stairs-down position in the town. */
const STAIRS_POS = { x: 18, y: 18 };

export class TownGenerator {
  /**
   * Generate the town map.
   * The layout is always identical — no RNG is involved.
   * @returns {{ map: DungeonMap, rooms: Array, startPos: {x,y}, stairsPos: {x,y} }}
   */
  generate() {
    const map = new DungeonMap(TOWN_WIDTH, TOWN_HEIGHT);

    // Carve the entire interior as floor (walls are on the 0-index border)
    map.carveRoom(1, 1, TOWN_WIDTH - 2, TOWN_HEIGHT - 2);

    // Place stairs down
    map.setTile(STAIRS_POS.x, STAIRS_POS.y, TILE.STAIRS_DOWN);

    // Surround floor tiles with walls
    map.buildWalls();

    return {
      map,
      rooms: [],
      startPos: { ...START_POS },
      stairsPos: { ...STAIRS_POS },
    };
  }
}
