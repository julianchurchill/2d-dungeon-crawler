/**
 * @module LuckyStrikeSkill
 * @description Encapsulates all state and behaviour for the Lucky Strike character skill.
 * Lucky Strike has a configurable crit chance (starting at 1%, upgradeable to 50% in 1%
 * steps) that triggers a 50% bonus damage multiplier on a hit.
 */

import { SKILLS } from './SkillDefinitions.js';

/** Maximum crit chance allowed (50%). */
const MAX_CRIT = 0.50;
/** Minimum crit chance — the initial base value (1%). */
const MIN_CRIT = SKILLS.LUCKY_STRIKE.baseCritChance;
/** Crit chance increment/decrement per upgrade step (1 percentage point). */
const CRIT_STEP = 0.01;

export class LuckyStrikeSkill {
  /**
   * Creates a LuckyStrikeSkill at its initial crit chance.
   */
  constructor() {
    this.id                = SKILLS.LUCKY_STRIKE.id;
    this.name              = SKILLS.LUCKY_STRIKE.name;
    this._baseCritChance   = SKILLS.LUCKY_STRIKE.baseCritChance;
    this._damageMultiplier = SKILLS.LUCKY_STRIKE.damageMultiplier;
    this._triggerMessage   = SKILLS.LUCKY_STRIKE.triggerMessage;
  }

  /**
   * Returns true if the skill can be upgraded (crit chance is below the cap).
   * @returns {boolean}
   */
  canUpgrade() {
    return this._baseCritChance < MAX_CRIT;
  }

  /**
   * Increments the crit chance by one step, up to the cap.
   * @returns {boolean} true if upgraded, false if already at cap.
   */
  upgrade() {
    if (!this.canUpgrade()) return false;
    // Round to 2 decimal places to avoid floating-point drift over many upgrades.
    this._baseCritChance = Math.round((this._baseCritChance + CRIT_STEP) * 100) / 100;
    return true;
  }

  /**
   * Returns true if the skill can be downgraded (crit chance is above the minimum).
   * @returns {boolean}
   */
  canDowngrade() {
    return this._baseCritChance > MIN_CRIT;
  }

  /**
   * Decrements the crit chance by one step, down to the minimum.
   * @returns {boolean} true if downgraded, false if already at minimum.
   */
  downgrade() {
    if (!this.canDowngrade()) return false;
    // Round to 2 decimal places to avoid floating-point drift over many steps.
    this._baseCritChance = Math.round((this._baseCritChance - CRIT_STEP) * 100) / 100;
    return true;
  }

  /**
   * Applies the Lucky Strike effect to a damage value, rolling the crit chance.
   * Returns the (possibly boosted) damage and a trigger message if the crit fires.
   *
   * @param {number} baseDamage - The base damage before skill modifications.
   * @param {object} rng        - RNG instance; must expose `nextBool(chance)`.
   * @returns {{ damage: number, messages: string[] }}
   */
  applyOnHit(baseDamage, rng) {
    if (rng.nextBool(this._baseCritChance)) {
      const boosted = Math.floor(baseDamage * this._damageMultiplier);
      const extra = boosted - baseDamage;
      return {
        damage: boosted,
        messages: [`${this._triggerMessage} (+${extra} damage)`],
      };
    }
    return { damage: baseDamage, messages: [] };
  }

  /**
   * Returns a plain-object snapshot of the skill suitable for passing to UI code.
   * The description is derived from current state so it never drifts from the crit chance.
   * @returns {{ id: string, name: string, description: string, canUpgrade: boolean, canDowngrade: boolean }}
   */
  toData() {
    const pct = Math.round(this._baseCritChance * 100);
    return {
      id:           this.id,
      name:         this.name,
      description:  `${pct}% chance to deal 50% bonus damage on a hit.`,
      critChance:      this._baseCritChance,
      damageMultiplier: this._damageMultiplier,
      canUpgrade:      this.canUpgrade(),
      canDowngrade:    this.canDowngrade(),
    };
  }
}
