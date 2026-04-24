/**
 * @module UniqueRoomEntryTracker
 * @description Tracks whether the player has entered the unique room on the
 * current floor and returns entry messages exactly once — on the first move
 * that lands inside the room bounds.
 */

export class UniqueRoomEntryTracker {
  constructor() {
    this._room = null;
    this._def = null;
    this._announced = false;
  }

  /**
   * Register the unique room for the current floor.
   *
   * @param {{ x:number, y:number, w:number, h:number }} room
   * @param {{ name:string, entryMessage:string }} def
   */
  setRoom(room, def) {
    this._room = room;
    this._def = def;
    this._announced = false;
  }

  /** Clear tracked room (call when a new floor is loaded). */
  reset() {
    this._room = null;
    this._def = null;
    this._announced = false;
  }

  /**
   * Returns the id of the current floor's unique room, or null if none is set.
   *
   * @returns {string|null}
   */
  getRoomId() {
    return this._def?.id ?? null;
  }

  /**
   * Call after every player move.  Returns an array of message strings on the
   * first call where the player position is inside the room bounds; returns
   * null on every other call.
   *
   * @param {number} px  Player tile x
   * @param {number} py  Player tile y
   * @returns {string[]|null}
   */
  checkEntry(px, py) {
    if (!this._room || this._announced) return null;
    const { x, y, w, h } = this._room;
    if (px >= x && px < x + w && py >= y && py < y + h) {
      this._announced = true;
      return [`${this._def.name}: ${this._def.entryMessage}`];
    }
    return null;
  }
}
