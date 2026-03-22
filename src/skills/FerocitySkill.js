/**
 * @module FerocitySkill
 * @description Encapsulates all state and behaviour for the Ferocity character skill.
 * Ferocity adds a flat damage bonus to every attack.  The bonus starts at 1,
 * increases by 1 per upgrade with no maximum, and cannot be downgraded below 1.
 */

import { SKILLS } from './SkillDefinitions.js';

/** The base (minimum) bonus — also the initial value. */
const BASE_BONUS = SKILLS.FEROCITY.baseBonus;

export class FerocitySkill {
  /**
   * Creates a FerocitySkill at its initial bonus value.
   */
  constructor() {
    this.id     = SKILLS.FEROCITY.id;
    this.name   = SKILLS.FEROCITY.name;
    this._bonus = BASE_BONUS;
  }

  /**
   * Ferocity can always be upgraded — there is no maximum.
   * @returns {boolean}
   */
  canUpgrade() {
    return true;
  }

  /**
   * Ferocity cannot be downgraded when already at the base value (bonus === 1).
   * @returns {boolean}
   */
  canDowngrade() {
    return this._bonus > BASE_BONUS;
  }

  /**
   * Increases the flat damage bonus by 1.
   * @returns {boolean} Always true — no cap.
   */
  upgrade() {
    this._bonus += 1;
    return true;
  }

  /**
   * Decreases the flat damage bonus by 1, down to the base.
   * @returns {boolean} true if downgraded, false if already at base.
   */
  downgrade() {
    if (!this.canDowngrade()) return false;
    this._bonus -= 1;
    return true;
  }

  /**
   * Applies the Ferocity flat damage bonus.  Never triggers a message.
   *
   * @param {number} baseDamage - The base damage before skill modifications.
   * @param {object} _rng       - Unused; present for interface consistency.
   * @returns {{ damage: number, messages: string[] }}
   */
  applyOnHit(baseDamage, _rng) {
    return { damage: baseDamage + this._bonus, messages: [] };
  }

  /**
   * Returns a plain-object snapshot of the skill suitable for passing to UI code.
   * @returns {{ id: string, name: string, description: string, bonus: number, canUpgrade: boolean, canDowngrade: boolean }}
   */
  toData() {
    return {
      id:          this.id,
      name:        this.name,
      description: `+${this._bonus} flat damage on each attack.`,
      bonus:       this._bonus,
      canUpgrade:  this.canUpgrade(),
      canDowngrade: this.canDowngrade(),
    };
  }
}
