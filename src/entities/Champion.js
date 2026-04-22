/**
 * @module Champion
 * @description A champion is an enhanced variant of a normal enemy type.
 * Champions have boosted HP, attack, defense, and XP relative to their base
 * type, and always drop a random item from the floor loot pool when killed.
 */

import { Enemy } from './Enemy.js';
import { getFloorLoot } from '../items/ItemTypes.js';

/** HP multiplier applied to the base enemy HP when creating a champion. */
export const CHAMPION_HP_MULT   = 1.5;
/** Attack multiplier applied to the base enemy attack for a champion. */
export const CHAMPION_ATK_MULT  = 1.3;
/** Defense multiplier applied to the base enemy defense for a champion. */
export const CHAMPION_DEF_MULT  = 1.2;
/** XP multiplier applied to the base enemy XP for a champion. */
export const CHAMPION_XP_MULT   = 2.0;
/** Maximum number of additional floors deeper than the current floor to draw loot from. */
export const CHAMPION_DROP_FLOOR_BONUS = 5;

export class Champion extends Enemy {
  /**
   * Creates a champion variant of the given enemy type.
   * Stats are scaled by the champion multipliers and rounded to integers.
   * A drop item is picked from the floor loot pool of the current floor plus
   * up to {@link CHAMPION_DROP_FLOOR_BONUS} additional floors.
   *
   * @param {number} x     - Tile X position.
   * @param {number} y     - Tile Y position.
   * @param {string} type  - Enemy type key (must exist in ENEMY_DEFS).
   * @param {number} floor - Current dungeon floor, used to determine loot range.
   * @param {object} rng   - RNG with `nextInt(min, max)` and `pick(array)` methods.
   */
  constructor(x, y, type, floor, rng) {
    super(x, y, type);

    this.isChampion = true;
    this.name = `${this.name} Champion`;

    // Scale stats — guarantee each value increases by at least 1 point so that
    // even low-stat enemies (e.g. a goblin with DEF 1) are visibly stronger.
    this.stats.hp      = Math.max(this.stats.hp      + 1, Math.round(this.stats.hp      * CHAMPION_HP_MULT));
    this.stats.maxHp   = this.stats.hp;
    this.stats.attack  = Math.max(this.stats.attack  + 1, Math.round(this.stats.attack  * CHAMPION_ATK_MULT));
    this.stats.defense = Math.max(this.stats.defense + 1, Math.round(this.stats.defense * CHAMPION_DEF_MULT));

    // Scale XP reward
    this.xp = Math.round(this.xp * CHAMPION_XP_MULT);

    // Pick a drop item from the floor loot pool (current floor + 0..5 bonus floors)
    const dropFloor = floor + rng.nextInt(0, CHAMPION_DROP_FLOOR_BONUS);
    this.dropItem = getFloorLoot(dropFloor, rng);
  }
}
