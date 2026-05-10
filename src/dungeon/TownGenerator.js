/**
 * TownGenerator — produces the fixed, non-random town layout for floor 0.
 * The town is the starting area for every new game; its layout never changes.
 *
 * Layout (26×20):
 *   - Outer wall border
 *   - Open floor interior
 *   - Three shops along the north wall (potions, weapons, armour),
 *     each 5 tiles wide with a typed door on the south face and a roof interior
 *   - Accent floor tiles in the 3×3 area around the centre stairs
 *   - Player start in the south-west open area
 */
import { DungeonMap } from './DungeonMap.js';
import { TILE } from '../utils/TileTypes.js';
import { TOWN_NPCS } from '../entities/NpcDefinitions.js';

/** Width of the fixed town map in tiles. */
const TOWN_WIDTH = 26;
/** Height of the fixed town map in tiles. */
const TOWN_HEIGHT = 20;
/** Player start position — south-west open area, away from shops and the well. */
const START_POS = { x: 5, y: 10 };
/** Stairs-down position — centre of the town square. */
const STAIRS_POS = { x: 10, y: 10 };
/**
 * Home structure definition — a 5-wide alcove against the south border wall,
 * door facing north into the town square.
 *
 * left/right are the outer wall columns (both inclusive).
 * doorX is the centre of the north face; doorY is the y of that face.
 * The interior roof tiles fill doorY+1 to TOWN_HEIGHT-2 between the side walls.
 */
const HOME = { left: 14, right: 18, doorX: 16, doorY: 16 };

/** Home door position — derived from the HOME constant so both stay in sync. */
const HOME_DOOR_POS = { x: HOME.doorX, y: HOME.doorY };

/**
 * Fixed shop definitions. Each shop occupies a 5-tile-wide alcove against
 * the north border wall (y=0).  The west/east walls run from y=1 to y=3;
 * the south wall has a typed door in the centre (y=3);
 * the interior (y=1–2) is rendered as a shop roof.
 */
const SHOPS = [
  { type: 'potion',  left: 2,  right: 6,  doorX: 4,  doorY: 3 },
  { type: 'weapon',  left: 8,  right: 12, doorX: 10, doorY: 3 },
  { type: 'armour',  left: 14, right: 18, doorX: 16, doorY: 3 },
  { type: 'general', left: 20, right: 24, doorX: 22, doorY: 3 },
];

/**
 * 3×3 offsets covering all tiles adjacent to STAIRS_POS (including diagonals).
 * The centre offset (0,0) maps to the stairs tile itself; it is set last so the
 * stairs tile overwrites the accent floor at that position.
 */
const ACCENT_OFFSETS = [
  [-1,-1],[0,-1],[1,-1],
  [-1, 0],[0, 0],[1, 0],
  [-1, 1],[0, 1],[1, 1],
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

    // Carve shop alcoves (sets walls, typed doors, and roof tiles)
    for (const shop of SHOPS) {
      this._carveShop(map, shop);
    }

    // Mark the 3×3 block around the stairs with accent floor, then place stairs
    // (stairs overwrites the centre accent tile so it still renders correctly)
    this._carveStairsAccent(map);
    map.setTile(STAIRS_POS.x, STAIRS_POS.y, TILE.STAIRS_DOWN);

    // Carve the player's home — a multi-tile structure against the south wall
    this._carveHome(map);

    // Surround empty tiles with walls (builds the outer border)
    map.buildWalls();

    return {
      map,
      rooms: [],
      startPos: { ...START_POS },
      stairsPos: { ...STAIRS_POS },
      shops: SHOPS.map(s => ({ type: s.type, doorX: s.doorX, doorY: s.doorY })),
      npcs: TOWN_NPCS.map(n => ({ name: n.name, x: n.x, y: n.y, spriteKey: n.spriteKey, lines: n.lines, contextualLines: n.contextualLines })),
      homeDoorPos: { x: HOME_DOOR_POS.x, y: HOME_DOOR_POS.y },
    };
  }

  /**
   * Carve a shop alcove: west/east walls, south wall with a typed centre door,
   * and shop-roof tiles filling the interior ceiling (y=1 up to doorY-1).
   *
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

    // South wall with typed door in centre
    for (let x = left + 1; x < right; x++) {
      map.setTile(x, doorY, x === doorX ? TILE.DOOR : TILE.WALL);
    }

    // Shop roof interior (between the north border wall and the south wall)
    for (let y = 1; y < doorY; y++) {
      for (let x = left + 1; x < right; x++) {
        map.setTile(x, y, TILE.SHOP_ROOF);
      }
    }
  }

  /**
   * Carve the player's home — a multi-tile alcove against the south border wall,
   * mirroring the shop alcove pattern but oriented to face north (into the town).
   *
   * Structure for HOME = { left:14, right:18, doorX:16, doorY:16 }:
   *   y=16  W  W  D  W  W   ← door row (door at doorX, walls either side)
   *   y=17  W  R  R  R  W   ← home interior (SHOP_ROOF)
   *   y=18  W  R  R  R  W   ← home interior (SHOP_ROOF)
   *   y=19  (south border wall — auto-generated by buildWalls)
   *
   * @param {DungeonMap} map
   */
  _carveHome(map) {
    const { left, right, doorX, doorY } = HOME;

    // Side walls (west and east columns) from the door row to the inner south edge
    for (let y = doorY; y <= TOWN_HEIGHT - 2; y++) {
      map.setTile(left,  y, TILE.WALL);
      map.setTile(right, y, TILE.WALL);
    }

    // Door row — walls across the north face with the home door in the centre
    for (let x = left + 1; x < right; x++) {
      map.setTile(x, doorY, x === doorX ? TILE.HOME_DOOR : TILE.WALL);
    }

    // Interior — roof tiles filling the space between side walls and south border
    for (let y = doorY + 1; y <= TOWN_HEIGHT - 2; y++) {
      for (let x = left + 1; x < right; x++) {
        map.setTile(x, y, TILE.SHOP_ROOF);
      }
    }
  }

  /**
   * Fill the 3×3 block centred on STAIRS_POS with TILE.TOWN_ACCENT so the
   * stairs area is visually distinct from the surrounding town floor.
   * The stairs tile itself is placed afterwards and overwrites the centre.
   *
   * @param {DungeonMap} map
   */
  _carveStairsAccent(map) {
    for (const [dx, dy] of ACCENT_OFFSETS) {
      map.setTile(STAIRS_POS.x + dx, STAIRS_POS.y + dy, TILE.TOWN_ACCENT);
    }
  }
}
