/**
 * @module SkillSystem
 * @description Manages the character's active skills and applies their
 * on-hit effects during combat.  All state is pure JS — no Phaser dependency.
 */

import { SKILLS } from '../skills/SkillDefinitions.js';

/** Maximum crit chance for Lucky Strike (50%). */
const LUCKY_STRIKE_MAX_CRIT = 0.50;
/** Crit chance increment per upgrade for Lucky Strike (1 percentage point). */
const LUCKY_STRIKE_CRIT_STEP = 0.01;

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
   * Returns true if the named active skill exists and is below its upgrade cap.
   * @param {string} skillId
   * @returns {boolean}
   */
  canUpgrade(skillId) {
    const skill = this._activeSkills.find(s => s.id === skillId);
    if (!skill) return false;
    if (skill.id === SKILLS.LUCKY_STRIKE.id) {
      return skill.baseCritChance < LUCKY_STRIKE_MAX_CRIT;
    }
    return false;
  }

  /**
   * Upgrades the named active skill by one step, updating its stats and description.
   * For Lucky Strike: increments baseCritChance by 1%, capped at 50%.
   *
   * @param {string} skillId
   * @returns {boolean} true if upgraded, false if at cap or not found.
   */
  upgradeSkill(skillId) {
    if (!this.canUpgrade(skillId)) return false;
    const skill = this._activeSkills.find(s => s.id === skillId);
    if (skill.id === SKILLS.LUCKY_STRIKE.id) {
      // Round to 2 decimal places to avoid floating-point drift over many upgrades.
      skill.baseCritChance = Math.round((skill.baseCritChance + LUCKY_STRIKE_CRIT_STEP) * 100) / 100;
      const pct = Math.round(skill.baseCritChance * 100);
      skill.description = `${pct}% chance to deal 50% bonus damage on a hit.`;
    }
    return true;
  }

  /**
   * Returns the list of inactive (not yet activated) skills available to the character.
   * @returns {Array<object>}
   */
  getInactiveSkills() {
    return [];
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
          const boosted = Math.floor(damage * skill.damageMultiplier);
          const extra = boosted - damage;
          damage = boosted;
          messages.push(`${skill.triggerMessage} (+${extra} damage)`);
        }
      }
    }

    return { damage, messages };
  }
}
