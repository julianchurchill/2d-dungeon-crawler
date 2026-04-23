/**
 * @module ChallengeFloorGenerator
 * @description Generates the fixed, non-random layout for challenge floors
 * (every 5th dungeon floor).  The layout consists of two rooms:
 *
 *   - Entry room (small) — where the player spawns.  Contains the up-staircase
 *     so the player can retreat to the previous floor.
 *   - Arena room (large) — filled with enemies the player must defeat before the
 *     down-staircase becomes usable.  Connected to the entry room by a short
 *     horizontal corridor.
 *
 * Layout overview (not to scale):
 *
 *   [Entry] ──corridor── [          Arena          ]
 *    ↑ up-stairs                   down-stairs ↑
 *    ↑ player spawn
 */

import { DungeonMap } from './DungeonMap.js';
import { TILE } from '../utils/TileTypes.js';

/** Full map dimensions in tiles. */
const MAP_WIDTH  = 60;
const MAP_HEIGHT = 35;

/** Small entry room: top-left corner and dimensions. */
const ENTRY = { x: 3, y: 13, w: 10, h: 8 };

/** Large arena room: top-left corner and dimensions. */
const ARENA = { x: 18, y: 4, w: 32, h: 22 };

/**
 * Y coordinate of the horizontal corridor that joins the two rooms.
 * Chosen to pass through the vertical centre of the entry room.
 */
const CORRIDOR_Y = Math.floor(ENTRY.y + ENTRY.h / 2); // 17

/** Player spawn — centre of the entry room. */
const START_POS = {
  x: Math.floor(ENTRY.x + ENTRY.w / 2),  // 8
  y: CORRIDOR_Y,                          // 17
};

/** Up-staircase — left side of the entry room. */
const STAIRS_UP_POS = {
  x: ENTRY.x + 1,  // 4
  y: CORRIDOR_Y,   // 17
};

/** Down-staircase — right-centre of the arena room. */
const STAIRS_DOWN_POS = {
  x: ARENA.x + ARENA.w - 4,                        // 46
  y: Math.floor(ARENA.y + ARENA.h / 2),             // 15
};

export class ChallengeFloorGenerator {
  /**
   * Generates the challenge floor map.
   * The layout is always identical — no RNG is involved.
   *
   * @returns {{
   *   map: DungeonMap,
   *   rooms: Array<{x:number,y:number,w:number,h:number}>,
   *   startPos: {x:number,y:number},
   *   stairsPos: {x:number,y:number},
   *   stairsUpPos: {x:number,y:number},
   *   isChallenge: boolean
   * }}
   */
  generate() {
    const map = new DungeonMap(MAP_WIDTH, MAP_HEIGHT);

    // Carve entry room and place up-stairs
    map.carveRoom(ENTRY.x, ENTRY.y, ENTRY.w, ENTRY.h);
    map.setTile(STAIRS_UP_POS.x, STAIRS_UP_POS.y, TILE.STAIRS_UP);

    // Carve arena room and place down-stairs
    map.carveRoom(ARENA.x, ARENA.y, ARENA.w, ARENA.h);
    map.setTile(STAIRS_DOWN_POS.x, STAIRS_DOWN_POS.y, TILE.STAIRS_DOWN);

    // Connect the two rooms with a horizontal corridor at CORRIDOR_Y.
    // carveHCorridor(x1, x2, y) fills tiles from x1 to x2 inclusive.
    map.carveHCorridor(ENTRY.x + ENTRY.w - 1, ARENA.x, CORRIDOR_Y);

    // Surround all floor/stair tiles with walls
    map.buildWalls();

    return {
      map,
      rooms: [
        { x: ENTRY.x, y: ENTRY.y, w: ENTRY.w, h: ENTRY.h },
        { x: ARENA.x, y: ARENA.y, w: ARENA.w, h: ARENA.h },
      ],
      startPos:    { ...START_POS },
      stairsPos:   { ...STAIRS_DOWN_POS },
      stairsUpPos: { ...STAIRS_UP_POS },
      isChallenge: true,
    };
  }
}
