/**
 * @module DungeonSnapshot
 * @description Captures all state needed to restore a dungeon floor after the
 * player teleports away and later returns via a RECALL_PORTAL.
 */

export class DungeonSnapshot {
  /**
   * @param {number} floor - The floor number that was captured.
   * @param {number} returnX - The player's x tile position when they left.
   * @param {number} returnY - The player's y tile position when they left.
   * @param {object} dungeonMap - The DungeonMap instance at the time of capture.
   * @param {object[]} enemies - Live enemy array at the time of capture.
   * @param {object[]} items - Floor item array at the time of capture.
   */
  constructor(floor, returnX, returnY, dungeonMap, enemies, items) {
    this.floor = floor;
    this.returnX = returnX;
    this.returnY = returnY;
    this.dungeonMap = dungeonMap;
    this.enemies = enemies;
    this.items = items;
  }

  /**
   * Creates a DungeonSnapshot from the current floor state.
   *
   * @param {number} floor
   * @param {number} returnX
   * @param {number} returnY
   * @param {object} dungeonMap
   * @param {object[]} enemies
   * @param {object[]} items
   * @returns {DungeonSnapshot}
   */
  static create(floor, returnX, returnY, dungeonMap, enemies, items) {
    return new DungeonSnapshot(floor, returnX, returnY, dungeonMap, [...enemies], [...items]);
  }
}
