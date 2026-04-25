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
  /** Stairs leading up — present on every dungeon floor; leads to town from floor 1, or to the previous floor otherwise. */
  STAIRS_UP: 7,
  /** The door to the player's home in the town. Triggers the display case panel. */
  HOME_DOOR: 8,
  /** Weapon mount — a wall-mounted weapon rack used in unique dungeon rooms (e.g. The Dark Armoury). Non-walkable and opaque. */
  WEAPON_MOUNT: 9,
  /** Bookcase — a shelf of books used in unique dungeon rooms (e.g. The Necropolis Library). Non-walkable and opaque. */
  BOOKCASE: 10,
  /** Locked door — blocks passage until opened with the matching key item. Non-walkable and opaque. */
  LOCKED_DOOR: 11,
  /** Recall portal — placed in town after the player uses a Home Seeking Scroll. Walkable. */
  RECALL_PORTAL: 12,
});

export const FOV_STATE = Object.freeze({
  UNEXPLORED: 0,
  EXPLORED: 1,
  VISIBLE: 2,
});

