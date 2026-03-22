/**
 * @module GoblinHuntingSkill
 * @description Permanent skill unlocked by completing the Goblin Killer achievement.
 * Grants +10% bonus damage on every attack against a goblin.
 * Cannot be upgraded or downgraded.
 */

import { SKILLS } from './SkillDefinitions.js';

export class GoblinHuntingSkill {
  constructor() {
    this.id   = SKILLS.GOBLIN_HUNTING.id;
    this.name = SKILLS.GOBLIN_HUNTING.name;
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
   * Applies a 10% damage bonus when attacking a goblin.
   *
   * @param {number}      baseDamage   - Incoming damage value.
   * @param {object}      _rng         - Unused; Goblin Hunting has no RNG component.
   * @param {string|null} defenderType - The type string of the defender entity.
   * @returns {{ damage: number, messages: string[] }}
   */
  applyOnHit(baseDamage, _rng, defenderType = null) {
    if (defenderType !== SKILLS.GOBLIN_HUNTING.targetType) {
      return { damage: baseDamage, messages: [] };
    }
    const bonus   = Math.floor(baseDamage * SKILLS.GOBLIN_HUNTING.bonusMultiplier);
    const boosted = baseDamage + bonus;
    return { damage: boosted, messages: [] };
  }

  /**
   * Returns a plain-object snapshot for UI rendering.
   * @returns {{ id, name, description, canUpgrade, canDowngrade }}
   */
  toData() {
    const pct = Math.round(SKILLS.GOBLIN_HUNTING.bonusMultiplier * 100);
    return {
      id:          this.id,
      name:        this.name,
      description: `+${pct}% damage against goblins. (Permanent)`,
      canUpgrade:  false,
      canDowngrade: false,
    };
  }
}
