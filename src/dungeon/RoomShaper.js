/**
 * @module RoomShaper
 * @description Carves varied room shapes into a DungeonMap.
 * Supports rectangular (with optional pillars), cross, L-shaped, and
 * chamfered room shapes to increase dungeon layout variety.
 *
 * All shapes guarantee that the room's centre point (cx, cy) is a floor tile
 * so that BSP corridor connections always reach walkable ground.
 */

import { TILE } from '../utils/TileTypes.js';

/** Enum of available room shape identifiers. */
export const ROOM_SHAPES = {
  /** Plain filled rectangle — the default shape. */
  RECT: 'rect',
  /** Plus/cross shape — two bars intersecting at the room centre. */
  CROSS: 'cross',
  /** L-shape — two overlapping rectangles leaving one corner open. */
  L_SHAPE: 'l_shape',
  /** Chamfered rectangle — corners clipped to give an octagonal feel. */
  CHAMFERED: 'chamfered',
};

/**
 * Minimum room dimension (both width and height) required for non-rectangular
 * shapes.  Rooms smaller than this threshold are always rectangular so that
 * the non-rect shapes have enough space to look meaningful.
 */
const MIN_SHAPED_SIZE = 7;

/**
 * Probability thresholds for shape selection when a room is large enough.
 * [0, RECT_THRESHOLD)      → rect
 * [RECT_THRESHOLD, CROSS_THRESHOLD) → cross
 * [CROSS_THRESHOLD, L_THRESHOLD)    → L-shape
 * [L_THRESHOLD, 1)                  → chamfered
 */
const RECT_THRESHOLD     = 0.40;
const CROSS_THRESHOLD    = 0.60;
const L_SHAPE_THRESHOLD  = 0.80;

export class RoomShaper {
  /**
   * Assigns a random shape to the given room object by setting a `shape`
   * property (and `lOrientation` for L-shaped rooms).  Mutates the room
   * in-place.
   *
   * Small rooms (either dimension < MIN_SHAPED_SIZE) are always rectangular.
   * Larger rooms are distributed: 40% rect, 20% cross, 20% L-shape, 20%
   * chamfered.
   *
   * @param {{ w:number, h:number }} room - Room to annotate.
   * @param {object} rng - RNG with a `next()` method returning [0, 1).
   */
  static assignShape(room, rng) {
    if (room.w < MIN_SHAPED_SIZE || room.h < MIN_SHAPED_SIZE) {
      room.shape = ROOM_SHAPES.RECT;
      return;
    }
    const r = rng.next();
    if (r < RECT_THRESHOLD) {
      room.shape = ROOM_SHAPES.RECT;
    } else if (r < CROSS_THRESHOLD) {
      room.shape = ROOM_SHAPES.CROSS;
    } else if (r < L_SHAPE_THRESHOLD) {
      room.shape = ROOM_SHAPES.L_SHAPE;
      // Pick one of four L orientations: which corner is the notch.
      room.lOrientation = Math.floor(rng.next() * 4);
    } else {
      room.shape = ROOM_SHAPES.CHAMFERED;
    }
  }

  /**
   * Carves the given room into the map using its assigned `shape`.
   * Also adds pillars to large rectangular rooms (width ≥ 9 and height ≥ 9).
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {{ x:number, y:number, w:number, h:number, shape?:string, lOrientation?:number }} room
   */
  static carve(map, room) {
    switch (room.shape) {
      case ROOM_SHAPES.CROSS:
        RoomShaper.carveCross(map, room);
        break;
      case ROOM_SHAPES.L_SHAPE:
        RoomShaper.carveL(map, room);
        break;
      case ROOM_SHAPES.CHAMFERED:
        RoomShaper.carveChamfered(map, room);
        break;
      default:
        // RECT — plain rectangle, possibly with pillars in large rooms.
        map.carveRoom(room.x, room.y, room.w, room.h);
        if (room.w >= 9 && room.h >= 9) {
          RoomShaper.addPillars(map, room);
        }
        break;
    }
  }

  /**
   * Carves a cross/plus-shaped room.  Two bars intersect at the room centre:
   *   - Horizontal bar: full width, ⅓ of the height, centred vertically.
   *   - Vertical bar:   full height, ⅓ of the width, centred horizontally.
   *
   * The centre tile (cx, cy) is always floor.
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {{ x:number, y:number, w:number, h:number }} room
   */
  static carveCross(map, room) {
    const { x, y, w, h } = room;
    const barW = Math.max(3, Math.floor(w / 3));
    const barH = Math.max(3, Math.floor(h / 3));
    const cx   = Math.floor(x + w / 2);
    const cy   = Math.floor(y + h / 2);
    // Horizontal bar: spans full width, vertically centred on cy
    map.carveRoom(x, cy - Math.floor(barH / 2), w, barH);
    // Vertical bar: spans full height, horizontally centred on cx
    map.carveRoom(cx - Math.floor(barW / 2), y, barW, h);
  }

  /**
   * Carves an L-shaped room in one of four orientations determined by
   * `room.lOrientation` (0–3, defaulting to 0).  Each orientation leaves
   * a different corner as the notch:
   *   0 — notch top-right   1 — notch top-left
   *   2 — notch bottom-right  3 — notch bottom-left
   *
   * The main strips use 60% of the dimension so the notch is clearly visible.
   * The centre tile (cx, cy) is always floor in all orientations.
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {{ x:number, y:number, w:number, h:number, lOrientation?:number }} room
   */
  static carveL(map, room) {
    const { x, y, w, h, lOrientation = 0 } = room;
    // Use ceil so the strips always extend at least one tile past the room
    // centre — floor would place the boundary exactly on cy when h % 5 === 3
    // (e.g. h=8), leaving the centre in the uncarved notch corner.
    const halfW = Math.ceil(w * 0.6);
    const halfH = Math.ceil(h * 0.6);
    switch (lOrientation) {
      case 0: // notch top-right: bottom strip + left strip
        map.carveRoom(x, y + h - halfH, w, halfH);
        map.carveRoom(x, y, halfW, h);
        break;
      case 1: // notch top-left: bottom strip + right strip
        map.carveRoom(x, y + h - halfH, w, halfH);
        map.carveRoom(x + w - halfW, y, halfW, h);
        break;
      case 2: // notch bottom-right: top strip + left strip
        map.carveRoom(x, y, w, halfH);
        map.carveRoom(x, y, halfW, h);
        break;
      case 3: // notch bottom-left: top strip + right strip
        map.carveRoom(x, y, w, halfH);
        map.carveRoom(x + w - halfW, y, halfW, h);
        break;
    }
  }

  /**
   * Carves a chamfered (octagon-like) room by combining two overlapping
   * rectangles, clipping 2 tiles from each corner:
   *   - Horizontal band: full height, width reduced by 2*clip on each side.
   *   - Vertical band:   full width, height reduced by 2*clip on each side.
   *
   * The clip size is capped at 2 tiles to keep the room recognisably room-like.
   * The centre tile (cx, cy) is always floor.
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {{ x:number, y:number, w:number, h:number }} room
   */
  static carveChamfered(map, room) {
    const { x, y, w, h } = room;
    const clip = Math.min(2, Math.floor(Math.min(w, h) / 4));
    // Horizontal band: narrowed left and right
    map.carveRoom(x + clip, y, w - clip * 2, h);
    // Vertical band: narrowed top and bottom
    map.carveRoom(x, y + clip, w, h - clip * 2);
  }

  /**
   * Adds symmetric single-tile wall pillars inside a large rectangular room.
   * Pillars are placed 2 tiles from each interior corner so they do not
   * block the room's centre or the corridor entry points.
   *
   * Implemented by setting the pillar tiles back to TILE.EMPTY after the
   * room rectangle has been carved; `buildWalls()` will then wall them in
   * because they are surrounded by floor tiles.
   *
   * Only meaningful on rooms where both dimensions are ≥ 9.
   *
   * @param {import('./DungeonMap.js').DungeonMap} map
   * @param {{ x:number, y:number, w:number, h:number }} room
   */
  static addPillars(map, room) {
    const { x, y, w, h } = room;
    const positions = [
      { px: x + 2,     py: y + 2     },
      { px: x + w - 3, py: y + 2     },
      { px: x + 2,     py: y + h - 3 },
      { px: x + w - 3, py: y + h - 3 },
    ];
    for (const { px, py } of positions) {
      // Only un-carve tiles that are currently floor (guard against overlap
      // with corridors that may have already been carved into this spot).
      if (map.getTile(px, py) === TILE.FLOOR) {
        // Setting back to EMPTY is intentional: buildWalls() will then turn
        // this tile into a WALL because it is surrounded by floor tiles,
        // creating a visible 1×1 pillar obstacle.
        map.setTile(px, py, TILE.EMPTY);
      }
    }
  }
}
