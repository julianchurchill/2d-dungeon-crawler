export const TILE = Object.freeze({
  EMPTY: 0,
  FLOOR: 1,
  WALL: 2,
  DOOR: 3,
  STAIRS_DOWN: 4,
  /** Accent floor tile — distinct cobblestone used around the town stairs. Walkable. */
  TOWN_ACCENT: 5,
  /** Shop roof tile — fills the interior of town shop alcoves. Non-walkable. */
  SHOP_ROOF: 6,
  /** Stairs leading up — present on floor 1 only, returns the player to the town. */
  STAIRS_UP: 7,
});

export const FOV_STATE = Object.freeze({
  UNEXPLORED: 0,
  EXPLORED: 1,
  VISIBLE: 2,
});

export const TILE_KEYS = {
  [TILE.FLOOR]: 'tile_floor',
  [TILE.WALL]: 'tile_wall',
  [TILE.DOOR]: 'tile_door',
  [TILE.STAIRS_DOWN]: 'tile_stairs',
};
