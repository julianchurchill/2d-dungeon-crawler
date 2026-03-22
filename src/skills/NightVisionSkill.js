/**
 * @module NightVisionSkill
 * @description Upgradeable skill that extends the player's field-of-view radius.
 * Unlocked by completing the 'Burrower' achievement (reach dungeon floor 10).
 * Starts at FOV_RADIUS + 1 and can be upgraded by 1 tile per upgrade with no cap.
 */

import { SKILLS } from './SkillDefinitions.js';

export class NightVisionSkill {
  constructor() {
    /** @type {string} */
    this.id = SKILLS.NIGHT_VISION.id;
    /** @type {string} */
    this.name = SKILLS.NIGHT_VISION.name;
    /** Current FOV bonus; starts at 1. @type {number} */
    this._level = 1;
  }

  /** @returns {boolean} Always true — Night Vision has no upgrade cap. */
  canUpgrade() { return true; }

  /**
   * Increases the FOV bonus by one step.
   * @returns {boolean} Always true.
   */
  upgrade() {
    this._level += SKILLS.NIGHT_VISION.fovStep;
    return true;
  }

  /** @returns {boolean} Always false — Night Vision cannot be downgraded. */
  canDowngrade() { return false; }

  /** @returns {boolean} Always false. */
  downgrade() { return false; }

  /**
   * Returns the number of extra FOV tiles granted at the current level.
   * @returns {number}
   */
  getFovBonus() { return this._level; }

  /**
   * Returns a plain-object snapshot for UI rendering.
   * @returns {{ id: string, name: string, description: string, canUpgrade: boolean, canDowngrade: boolean }}
   */
  toData() {
    return {
      id: this.id,
      name: this.name,
      description: `${SKILLS.NIGHT_VISION.description} (current bonus: +${this._level})`,
      canUpgrade: this.canUpgrade(),
      canDowngrade: this.canDowngrade(),
    };
  }
}
