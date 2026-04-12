/**
 * @module OldBones
 * @description Unique boss enemy encountered on floors 10–15.
 * Extends Enemy with boss-specific properties: drops unique loot and gold,
 * and spawns skeleton minions on its first hit.
 */

import { Enemy } from './Enemy.js';
import { ITEM_TYPES } from '../items/ItemTypes.js';

export class OldBones extends Enemy {
  /**
   * @param {number} x   - Tile X position.
   * @param {number} y   - Tile Y position.
   * @param {object} rng - RNG with a `nextBool(p)` method.
   */
  constructor(x, y, rng) {
    super(x, y, 'old_bones');
    this.isBoss = true;
    this.shouldSpawnMinions = true;
    this.minionsSpawned = false;
    this.minionType = 'skeleton';
    this.maxMinions = 2;
    this.minionSpawnMessage = `${this.name} stirs, summoning skeletal minions!`;
    this.dropGold = 25;
    // Randomly drop one of the two unique boss items.
    this.dropItem = rng.nextBool(0.5) ? ITEM_TYPES.BONE_BLADE : ITEM_TYPES.SKELETON_SHIELD;
  }
}
