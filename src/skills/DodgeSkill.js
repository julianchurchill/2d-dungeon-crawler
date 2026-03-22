/**
 * @module DodgeSkill
 * @description Encapsulates all state and behaviour for the Dodge character skill.
 * Dodge gives the player a percentage chance to completely negate incoming damage.
 * The dodge chance starts at 1%, increases by 1% per upgrade up to a maximum of 50%,
 * and cannot be downgraded below 1%.
 */

import { SKILLS } from './SkillDefinitions.js';

/** Minimum dodge chance — initial base value (1%). */
const MIN_DODGE = SKILLS.DODGE.baseDodgeChance;
/** Maximum dodge chance cap (50%). */
const MAX_DODGE = SKILLS.DODGE.maxDodgeChance;
/** Increment/decrement per upgrade step (1 percentage point). */
const DODGE_STEP = SKILLS.DODGE.dodgeStep;

export class DodgeSkill {
  /**
   * Creates a DodgeSkill at its initial dodge chance.
   */
  constructor() {
    this.id           = SKILLS.DODGE.id;
    this.name         = SKILLS.DODGE.name;
    this._dodgeChance = MIN_DODGE;
    this._triggerMessage = SKILLS.DODGE.triggerMessage;
  }

  /**
   * Dodge can be upgraded when below the 50% cap.
   * @returns {boolean}
   */
  canUpgrade() {
    return this._dodgeChance < MAX_DODGE;
  }

  /**
   * Dodge cannot be downgraded when already at the base value (1%).
   * @returns {boolean}
   */
  canDowngrade() {
    return this._dodgeChance > MIN_DODGE;
  }

  /**
   * Increases the dodge chance by 1%, up to the cap.
   * @returns {boolean} true if upgraded, false if already at cap.
   */
  upgrade() {
    if (!this.canUpgrade()) return false;
    // Round to 2 decimal places to avoid floating-point drift over many upgrades.
    this._dodgeChance = Math.round((this._dodgeChance + DODGE_STEP) * 100) / 100;
    return true;
  }

  /**
   * Decreases the dodge chance by 1%, down to the minimum.
   * @returns {boolean} true if downgraded, false if already at minimum.
   */
  downgrade() {
    if (!this.canDowngrade()) return false;
    // Round to 2 decimal places to avoid floating-point drift.
    this._dodgeChance = Math.round((this._dodgeChance - DODGE_STEP) * 100) / 100;
    return true;
  }

  /**
   * Applies the Dodge effect to incoming damage.  If the roll succeeds, damage
   * becomes 0 and a 'Dodged!' message is returned.  Otherwise the damage passes through.
   *
   * @param {number} incomingDamage - The incoming damage value.
   * @param {object} rng            - RNG instance; must expose `nextBool(chance)`.
   * @returns {{ damage: number, messages: string[] }}
   */
  applyOnDefend(incomingDamage, rng) {
    if (rng.nextBool(this._dodgeChance)) {
      return { damage: 0, messages: [this._triggerMessage] };
    }
    return { damage: incomingDamage, messages: [] };
  }

  /**
   * Returns a plain-object snapshot of the skill suitable for passing to UI code.
   * @returns {{ id: string, name: string, description: string, dodgeChance: number, canUpgrade: boolean, canDowngrade: boolean }}
   */
  toData() {
    const pct = Math.round(this._dodgeChance * 100);
    return {
      id:          this.id,
      name:        this.name,
      description: `${pct}% chance to completely dodge an attack.`,
      dodgeChance: this._dodgeChance,
      canUpgrade:  this.canUpgrade(),
      canDowngrade: this.canDowngrade(),
    };
  }
}
