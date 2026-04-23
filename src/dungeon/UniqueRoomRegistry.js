/**
 * @module UniqueRoomRegistry
 * @description Tracks which unique rooms have already appeared in the current
 * game run so that each unique room can only appear once per game.
 *
 * The module-level singleton `uniqueRoomRegistry` should be reset at the start
 * of every new game (call `uniqueRoomRegistry.reset()` in GameScene.create()).
 */

export class UniqueRoomRegistry {
  constructor() {
    /** @type {Set<string>} IDs of unique rooms that have already spawned this run. */
    this._seen = new Set();
  }

  /**
   * Returns true if the room with the given id has already appeared this game.
   *
   * @param {string} id - Room id from UniqueRoomDefinitions.
   * @returns {boolean}
   */
  hasBeenSeen(id) {
    return this._seen.has(id);
  }

  /**
   * Records the given room as having appeared.  Call this when the room is
   * chosen so it cannot appear again on a later floor.
   *
   * @param {string} id - Room id from UniqueRoomDefinitions.
   */
  markSeen(id) {
    this._seen.add(id);
  }

  /**
   * Clears all seen-room records.  Call at the start of each new game so
   * unique rooms can appear again in the new run.
   */
  reset() {
    this._seen.clear();
  }

  /**
   * Returns the subset of `defs` that are eligible to spawn on the given floor.
   *
   * A definition is eligible when ALL of the following are true:
   *   1. `floor >= def.minFloor` — the floor is deep enough.
   *   2. `!hasBeenSeen(def.id)` — the room has not appeared yet this game.
   *
   * Both conditions are bypassed when `force === def.id`, which allows the dev
   * option to force a specific room regardless of floor or seen state.
   *
   * @param {number}       floor  - Current dungeon floor number.
   * @param {UniqueRoomDef[]} defs - Full list of unique room definitions.
   * @param {string|null}  [force] - Room id to force-include, or null for normal logic.
   * @returns {UniqueRoomDef[]}
   */
  getEligible(floor, defs, force = null) {
    return defs.filter(def => {
      if (force === def.id) return true;
      return floor >= def.minFloor && !this._seen.has(def.id);
    });
  }
}

/** Module-level singleton — reset at the start of every new game. */
export const uniqueRoomRegistry = new UniqueRoomRegistry();
