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

import { getSpawnTable, getEnemiesPerRoom, ENEMY_DEFS } from '../entities/EnemyTypes.js';
import { devOptions } from '../systems/DevOptions.js';
import { difficultyManager as defaultDifficultyManager } from '../systems/DifficultyManager.js';

/** Base probability that any eligible enemy spawn becomes a champion (10%). */
export const DEFAULT_CHAMPION_CHANCE = 0.1;

export class EnemySpawner {
  /**
   * @param {import('../utils/RNG.js').RNG}      rng               - Seeded RNG for positions and type picks.
   * @param {typeof devOptions}                  opts              - Dev-option overrides (defaults to singleton).
   * @param {import('./DifficultyManager.js').DifficultyManager} [diffMgr] - Difficulty manager (injectable for tests).
   */
  constructor(rng, opts = devOptions, diffMgr = defaultDifficultyManager) {
    this.rng     = rng;
    this.opts    = opts;
    this._diffMgr = diffMgr;
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
    const spawnTable       = getSpawnTable(floor, this.opts.spawnWeights);
    const countMultiplier  = this._diffMgr.getConfig().enemyCount;
    const minPerRoom = Math.max(0, Math.round(
      (this.opts.minEnemiesPerRoom ?? 0) * countMultiplier,
    ));
    const maxPerRoom = Math.max(minPerRoom, Math.round(
      (this.opts.maxEnemiesPerRoom ?? getEnemiesPerRoom(floor)) * countMultiplier,
    ));

    // Room 0 is always the player's start room — skip it.
    for (let i = 1; i < rooms.length; i++) {
      const room  = rooms[i];
      const count = this.rng.nextInt(minPerRoom, maxPerRoom);

      // Track solitary types already placed in this room so they are never
      // duplicated (e.g. Creeping Mass — one per room).
      const placedSolitaryTypes = new Set();

      for (let j = 0; j < count; j++) {
        const type = this.rng.pick(spawnTable);
        const def  = ENEMY_DEFS[type];

        // Solitary enemies may appear at most once per room
        if (def.solitary && placedSolitaryTypes.has(type)) continue;

        const ex   = this.rng.nextInt(room.x + 1, room.x + room.w - 2);
        const ey   = this.rng.nextInt(room.y + 1, room.y + room.h - 2);
        if (def.clusterMin !== undefined) {
          const size = this.rng.nextInt(def.clusterMin, def.clusterMax);
          this._spawnCluster(type, ex, ey, size, room, getEntityAt, spawnEnemy);
        } else if (!getEntityAt(ex, ey)) {
          if (def.solitary) placedSolitaryTypes.add(type);
          // Champions may only arise from non-solitary, non-boss enemy types.
          const championChance = this.opts.championChance ?? DEFAULT_CHAMPION_CHANCE;
          const isChampion = !def.solitary && !def.isBoss && this.rng.next() < championChance;
          spawnEnemy(ex, ey, type, { isChampion });
        }
      }
    }
  }

  /**
   * Spawns a connected cluster of `size` enemies of `type` starting at the
   * anchor tile and expanding to adjacent room tiles.  Each additional enemy
   * is placed next to an already-placed one, guaranteeing adjacency.
   * Stops early if no further expansion is possible.
   *
   * @param {string}   type         - Enemy type key.
   * @param {number}   anchorX      - Starting tile X.
   * @param {number}   anchorY      - Starting tile Y.
   * @param {number}   size         - Target cluster size.
   * @param {{x:number,y:number,w:number,h:number}} room
   * @param {Function} getEntityAt  - `(x, y) => entity|null`
   * @param {Function} spawnEnemy   - `(x, y, type) => void`
   */
  _spawnCluster(type, anchorX, anchorY, size, room, getEntityAt, spawnEnemy) {
    /** Returns true when (x, y) is inside the room interior. */
    const inRoom = (x, y) =>
      x >= room.x + 1 && x <= room.x + room.w - 2 &&
      y >= room.y + 1 && y <= room.y + room.h - 2;

    const placed = [];

    if (inRoom(anchorX, anchorY) && !getEntityAt(anchorX, anchorY)) {
      spawnEnemy(anchorX, anchorY, type);
      placed.push({ x: anchorX, y: anchorY });
    }

    if (placed.length === 0) return;

    // N / E / S / W — fixed order; parent is picked randomly via rng.pick.
    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

    for (let i = placed.length; i < size; i++) {
      const parent = this.rng.pick(placed);
      let expanded = false;
      for (const { dx, dy } of dirs) {
        const nx = parent.x + dx;
        const ny = parent.y + dy;
        if (inRoom(nx, ny) && !getEntityAt(nx, ny)) {
          spawnEnemy(nx, ny, type);
          placed.push({ x: nx, y: ny });
          expanded = true;
          break;
        }
      }
      // Stop if no adjacent tile is free.
      if (!expanded) break;
    }
  }
}
