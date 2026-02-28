export const TILE = Object.freeze({
  EMPTY: 0,
  FLOOR: 1,
  WALL: 2,
  DOOR: 3,
  STAIRS_DOWN: 4,
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
