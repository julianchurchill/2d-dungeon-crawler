/**
 * @module HuntingSkill
 * @description Generic permanent skill that grants +10% bonus damage against a
 * specific enemy type.  Instances are configured by passing a key from SKILLS
 * (e.g. 'ORC_HUNTING').  Cannot be upgraded or downgraded.
 *
 * Used for all kill-achievement hunting skills except GoblinHuntingSkill, which
 * predates this generic implementation and is kept unchanged for compatibility.
 */

import { SKILLS } from './SkillDefinitions.js';

export class HuntingSkill {
  /**
   * @param {string} skillKey - Key of the SKILLS entry (e.g. 'ORC_HUNTING').
   */
  constructor(skillKey) {
    const def  = SKILLS[skillKey];
    this._def  = def;
    this.id    = def.id;
    this.name  = def.name;
  }

  /** Permanent skills cannot be upgraded. @returns {false} */
  canUpgrade()   { return false; }
  /** @returns {false} */
  upgrade()      { return false; }

  /** Permanent skills cannot be downgraded. @returns {false} */
  canDowngrade() { return false; }
  /** @returns {false} */
  downgrade()    { return false; }

  /**
   * Applies the hunting bonus when the defender matches the skill's target type.
   *
   * @param {number}      baseDamage   - Incoming damage value.
   * @param {*}           _rng         - Unused; hunting skills have no RNG component.
   * @param {string|null} defenderType - The type string of the defender entity.
   * @returns {{ damage: number, messages: string[] }}
   */
  applyOnHit(baseDamage, _rng, defenderType = null) {
    if (defenderType !== this._def.targetType) {
      return { damage: baseDamage, messages: [] };
    }
    const bonus = Math.floor(baseDamage * this._def.bonusMultiplier);
    return { damage: baseDamage + bonus, messages: [] };
  }

  /**
   * Returns a plain-object snapshot for UI rendering.
   * @returns {{ id: string, name: string, description: string, canUpgrade: boolean, canDowngrade: boolean }}
   */
  toData() {
    const pct = Math.round(this._def.bonusMultiplier * 100);
    return {
      id:           this.id,
      name:         this.name,
      description:  `+${pct}% damage against ${this._def.targetType}s. (Permanent)`,
      canUpgrade:   false,
      canDowngrade: false,
    };
  }
}
