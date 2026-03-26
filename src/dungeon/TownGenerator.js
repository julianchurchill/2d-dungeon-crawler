/**
 * TownGenerator — produces the fixed, non-random town layout for floor 0.
 * The town is the starting area for every new game; its layout never changes.
 *
 * Layout (20×20):
 *   - Outer wall border
 *   - Open floor interior
 *   - Three shops along the north wall (potions, weapons, armour),
 *     each 5 tiles wide with a door on the south face
 *   - Stairs down at (18, 18)
 *   - Player start at (9, 10) — centre of the open town square
 */
import { DungeonMap } from './DungeonMap.js';
import { TILE } from '../utils/TileTypes.js';

/** Width of the fixed town map in tiles. */
const TOWN_WIDTH = 20;
/** Height of the fixed town map in tiles. */
const TOWN_HEIGHT = 20;
/** Player start position in the town (centre of the open square). */
const START_POS = { x: 9, y: 10 };
/** Stairs-down position in the town. */
const STAIRS_POS = { x: 18, y: 18 };

/**
 * Fixed shop definitions. Each shop occupies a 5-tile-wide alcove against
 * the north border wall (y=0).  The west/east walls run from y=1 to y=3;
 * the south wall has a door in the centre (y=3).
 */
const SHOPS = [
  { type: 'potion', left: 2,  right: 6,  doorX: 4,  doorY: 3 },
  { type: 'weapon', left: 8,  right: 12, doorX: 10, doorY: 3 },
  { type: 'armour', left: 14, right: 18, doorX: 16, doorY: 3 },
];

export class TownGenerator {
  /**
   * Generate the town map.
   * The layout is always identical — no RNG is involved.
   * @returns {{ map: DungeonMap, rooms: Array, startPos: {x,y}, stairsPos: {x,y}, shops: Array }}
   */
  generate() {
    const map = new DungeonMap(TOWN_WIDTH, TOWN_HEIGHT);

    // Carve the entire interior as floor (border at 0 and TOWN_WIDTH/HEIGHT-1)
    map.carveRoom(1, 1, TOWN_WIDTH - 2, TOWN_HEIGHT - 2);

    // Carve shop alcoves into the north interior area
    for (const shop of SHOPS) {
      this._carveShop(map, shop);
    }

    // Place stairs down
    map.setTile(STAIRS_POS.x, STAIRS_POS.y, TILE.STAIRS_DOWN);

    // Surround empty tiles with walls (builds the outer border)
    map.buildWalls();

    return {
      map,
      rooms: [],
      startPos: { ...START_POS },
      stairsPos: { ...STAIRS_POS },
      shops: SHOPS.map(s => ({ type: s.type, doorX: s.doorX, doorY: s.doorY })),
    };
  }

  /**
   * Carve a shop alcove with west/east walls and a south wall with a centre door.
   * The shop interior (already floor from carveRoom) is left intact.
   * @param {DungeonMap} map
   * @param {{ left: number, right: number, doorX: number, doorY: number }} shop
   */
  _carveShop(map, shop) {
    const { left, right, doorX, doorY } = shop;

    // West and east walls (rows y=1 to doorY)
    for (let y = 1; y <= doorY; y++) {
      map.setTile(left,  y, TILE.WALL);
      map.setTile(right, y, TILE.WALL);
    }

    // South wall with door in centre
    for (let x = left + 1; x < right; x++) {
      map.setTile(x, doorY, x === doorX ? TILE.DOOR : TILE.WALL);
    }
  }
}
