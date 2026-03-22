/**
 * @module SkillSystem
 * @description Manages the character's active skills and applies their
 * on-hit effects during combat.  All state is pure JS — no Phaser dependency.
 */

import { SKILLS } from '../skills/SkillDefinitions.js';

export class SkillSystem {
  /**
   * Creates a SkillSystem pre-loaded with the default starting skill (Lucky Strike).
   * @param {object} rng - RNG instance used for chance rolls.
   */
  constructor(rng) {
    this.rng = rng;
    // Lucky Strike is always the character's first active skill.
    this._activeSkills = [{ ...SKILLS.LUCKY_STRIKE }];
  }

  /**
   * Returns a copy of the active skills list.
   * @returns {Array<object>}
   */
  getSkills() {
    return [...this._activeSkills];
  }

  /**
   * Applies on-hit skill effects to a damage value, rolling each active skill
   * in order and accumulating any triggered effects and messages.
   *
   * @param {number} baseDamage - The base damage before skill modifications.
   * @returns {{ damage: number, messages: string[] }}
   */
  applyOnHitSkills(baseDamage) {
    let damage = baseDamage;
    const messages = [];

    for (const skill of this._activeSkills) {
      if (skill.id === SKILLS.LUCKY_STRIKE.id) {
        // Roll against the skill's trigger chance; boost damage if it fires.
        if (this.rng.nextBool(skill.baseCritChance)) {
          damage = Math.floor(damage * skill.damageMultiplier);
          messages.push(skill.triggerMessage);
        }
      }
    }

    return { damage, messages };
  }
}
