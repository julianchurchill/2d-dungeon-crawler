/**
 * @module RoomDecorationPlacer
 * @description Places decoration tiles (WEAPON_MOUNT, BOOKCASE) inside a unique
 * room on a DungeonMap, avoiding positions adjacent to corridor entry points so
 * that no decoration ever blocks the entrance to the room.
 */
import { TILE } from '../utils/TileTypes.js';

/**
 * Returns true if placing a decoration at (x, y) would sit at or immediately
 * adjacent to a corridor doorway.
 *
 * Two checks are performed:
 *   1. Direct — a neighbour of (x, y) lies outside the room bounds AND is a
 *      FLOOR tile (corridor entering through the wall ring).
 *   2. Indirect — a neighbour (nx, ny) that is still inside the room itself
 *      has an outer neighbour that is a corridor FLOOR tile.  This catches
 *      inner-corner positions that sit one step back from the doorway tile.
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
      // Direct adjacency: neighbour is a corridor tile outside the room.
      if (map.getTile(nx, ny) === TILE.FLOOR) return true;
    } else {
      // Indirect adjacency: the neighbour is inside the room but is itself a
      // doorway tile (its outer neighbour is a corridor FLOOR tile).
      for (const [dx2, dy2] of dirs) {
        const nnx = nx + dx2, nny = ny + dy2;
        if (outsideRoom(nnx, nny) && map.getTile(nnx, nny) === TILE.FLOOR) return true;
      }
    }
  }
  return false;
}

/**
 * Places decoration tiles inside `room` on `map` according to `decorSpec`.
 *
 * Positions that are not plain FLOOR tiles, or that are too close to a
 * corridor entry, are silently skipped.
 *
 * Supported placement patterns:
 *   - `inner_corners` — one decoration 1 tile in from each of the four inner
 *     corners, giving at most 4 tiles.
 *   - `edge_rows` — decorations along every inner edge at `spacing` intervals,
 *     skipping the 2 outermost tiles of each edge to leave corner gaps.
 *
 * @param {import('./DungeonMap.js').DungeonMap} map
 * @param {{ x:number, y:number, w:number, h:number }} room
 * @param {{ tileType:string, placement:string, spacing?:number }} decorSpec
 */
export function placeDecorations(map, room, decorSpec) {
  const tileType = TILE[decorSpec.tileType];
  if (tileType === undefined) return;

  /** Place only on plain FLOOR tiles that are not near a corridor entry. */
  const tryPlace = (x, y) => {
    if (map.getTile(x, y) !== TILE.FLOOR) return;
    if (isTooCloseToEntry(map, x, y, room)) return;
    map.setTile(x, y, tileType);
  };

  if (decorSpec.placement === 'inner_corners') {
    tryPlace(room.x + 1,           room.y + 1);
    tryPlace(room.x + room.w - 2,  room.y + 1);
    tryPlace(room.x + 1,           room.y + room.h - 2);
    tryPlace(room.x + room.w - 2,  room.y + room.h - 2);
  } else if (decorSpec.placement === 'edge_rows') {
    const spacing = decorSpec.spacing ?? 3;
    for (let x = room.x + 2; x <= room.x + room.w - 3; x += spacing) {
      tryPlace(x, room.y);
      tryPlace(x, room.y + room.h - 1);
    }
    for (let y = room.y + 2; y <= room.y + room.h - 3; y += spacing) {
      tryPlace(room.x,              y);
      tryPlace(room.x + room.w - 1, y);
    }
  }
}
