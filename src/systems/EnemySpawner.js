/**
 * @module EnemySpawner
 * @description Handles placing enemies into dungeon rooms at the start of each
 * floor.  All configuration is injectable (RNG, dev options) so the class can
 * be exercised in unit tests without a Phaser scene.
 *
 * Depends on:
 *   - `getSpawnTable(floor, spawnWeights)` for the weighted enemy-type array.
 *   - `getEnemiesPerRoom(floor)` for the floor-scaled enemy count cap.
 *   - A caller-supplied `getEntityAt` function to avoid overlapping spawns.
 *   - A caller-supplied `spawnEnemy` callback to actually create each enemy.
 */

import { getSpawnTable, getEnemiesPerRoom } from '../entities/EnemyTypes.js';
import { devOptions } from '../systems/DevOptions.js';

export class EnemySpawner {
  /**
   * @param {import('../utils/RNG.js').RNG}  rng  - Seeded RNG for positions and type picks.
   * @param {typeof devOptions}              opts - Dev-option overrides (defaults to singleton).
   */
  constructor(rng, opts = devOptions) {
    this.rng  = rng;
    this.opts = opts;
  }

  /**
   * Spawns enemies into every room except the start room (index 0).
   *
   * @param {Array<{x:number,y:number,w:number,h:number}>} rooms
   * @param {number}   floor       - Current dungeon floor (used for floor-scaled defaults).
   * @param {Function} getEntityAt - `(x, y) => entity|null` — returns truthy if occupied.
   * @param {Function} spawnEnemy  - `(x, y, type) => void` — creates one enemy on the map.
   */
  spawnForRooms(rooms, floor, getEntityAt, spawnEnemy) {
    const spawnTable  = getSpawnTable(floor, this.opts.spawnWeights);
    const minPerRoom  = this.opts.minEnemiesPerRoom ?? 0;
    const maxPerRoom  = this.opts.maxEnemiesPerRoom ?? getEnemiesPerRoom(floor);

    // Room 0 is always the player's start room — skip it.
    for (let i = 1; i < rooms.length; i++) {
      const room  = rooms[i];
      const count = this.rng.nextInt(minPerRoom, maxPerRoom);

      for (let j = 0; j < count; j++) {
        const type = this.rng.pick(spawnTable);
        const ex   = this.rng.nextInt(room.x + 1, room.x + room.w - 2);
        const ey   = this.rng.nextInt(room.y + 1, room.y + room.h - 2);
        if (!getEntityAt(ex, ey)) {
          spawnEnemy(ex, ey, type);
        }
      }
    }
  }
}
