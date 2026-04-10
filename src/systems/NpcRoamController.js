/**
 * @module NpcRoamController
 * Controls slow, randomised roaming behaviour for a single NPC within a
 * tile-based dungeon.  Every `interval` game turns it attempts to step to a
 * random adjacent cardinal tile that is walkable and unoccupied.
 */

export class NpcRoamController {
  /**
   * @param {import('../entities/Npc.js').Npc} npc - The NPC to control.
   * @param {object} [options]
   * @param {number} [options.interval=3] - Move every N turns.
   * @param {function(): number} [options.rng=Math.random] - Random number source (0–1).
   */
  constructor(npc, { interval = 3, rng = Math.random } = {}) {
    this._npc = npc;
    this._interval = interval;
    this._rng = rng;
    this._counter = 0;
  }

  /** @returns {import('../entities/Npc.js').Npc} The NPC being controlled. */
  get npc() { return this._npc; }

  /**
   * Advance the roam timer by one game turn.  Returns a move action when the
   * interval elapses and a walkable unoccupied neighbour is available,
   * otherwise returns a stay action.
   *
   * @param {import('../dungeon/DungeonMap.js').DungeonMap} map
   * @param {function(number, number): object|null} getEntityAt
   * @returns {{ action: 'stay' } | { action: 'move', dx: number, dy: number }}
   */
  tick(map, getEntityAt) {
    this._counter++;
    if (this._counter < this._interval) return { action: 'stay' };
    this._counter = 0;

    // Build shuffled list of cardinal directions to avoid bias.
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy:  1 },
      { dx: -1, dy: 0 },
      { dx:  1, dy: 0 },
    ];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(this._rng() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }

    for (const { dx, dy } of dirs) {
      const nx = this._npc.x + dx;
      const ny = this._npc.y + dy;
      if (map.isWalkable(nx, ny) && !getEntityAt(nx, ny)) {
        return { action: 'move', dx, dy };
      }
    }
    return { action: 'stay' };
  }
}
