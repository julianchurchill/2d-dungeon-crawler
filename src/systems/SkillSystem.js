/**
 * @module SkillSystem
 * @description Manages the character's active and inactive skills and applies their
 * effects during combat.  All state is pure JS — no Phaser dependency.
 *
 * Skills are stored as class instances that each implement:
 *   - canUpgrade()  → boolean
 *   - upgrade()     → boolean
 *   - canDowngrade() → boolean
 *   - downgrade()   → boolean
 *   - applyOnHit(baseDamage, rng)     → { damage, messages }   (optional)
 *   - applyOnDefend(incomingDamage, rng) → { damage, messages } (optional)
 *   - toData()      → plain-object snapshot for UI
 *
 * Skill instances are injected at construction time — SkillSystem has no
 * dependency on any specific skill class.
 */

export class SkillSystem {
  /**
   * Creates a SkillSystem with the given active and inactive skill instances.
   *
   * @param {object}   rng            - RNG instance used for chance rolls.
   * @param {object[]} activeSkills   - Skill instances that are immediately active.
   * @param {object[]} inactiveSkills - Skill instances available to activate later.
   */
  constructor(rng, activeSkills = [], inactiveSkills = []) {
    this.rng = rng;
    this._activeSkills = activeSkills;
    this._inactiveSkills = inactiveSkills;
  }

  /**
   * Returns plain-object snapshots of all active skills, suitable for UI rendering.
   * @returns {Array<object>}
   */
  getSkills() {
    return this._activeSkills.map(s => s.toData());
  }

  /**
   * Returns true if the named active skill exists and can be upgraded further.
   * @param {string} skillId
   * @returns {boolean}
   */
  canUpgrade(skillId) {
    const skill = this._activeSkills.find(s => s.id === skillId);
    return skill ? skill.canUpgrade() : false;
  }

  /**
   * Upgrades the named active skill by one step.
   * @param {string} skillId
   * @returns {boolean} true if upgraded, false if at cap or not found.
   */
  upgradeSkill(skillId) {
    const skill = this._activeSkills.find(s => s.id === skillId);
    return skill ? skill.upgrade() : false;
  }

  /**
   * Returns true if the named active skill exists and can be downgraded.
   * @param {string} skillId
   * @returns {boolean}
   */
  canDowngrade(skillId) {
    const skill = this._activeSkills.find(s => s.id === skillId);
    return skill ? skill.canDowngrade() : false;
  }

  /**
   * Downgrades the named active skill by one step.
   * @param {string} skillId
   * @returns {boolean} true if downgraded, false if at minimum or not found.
   */
  downgradeSkill(skillId) {
    const skill = this._activeSkills.find(s => s.id === skillId);
    return skill ? skill.downgrade() : false;
  }

  /**
   * Returns plain-object snapshots of all inactive skills, suitable for UI rendering.
   * @returns {Array<object>}
   */
  getInactiveSkills() {
    return this._inactiveSkills.map(s => s.toData());
  }

  /**
   * Moves the named skill from inactive to active.
   * @param {string} skillId
   * @returns {boolean} true if the skill was found and activated, false otherwise.
   */
  activateSkill(skillId) {
    const idx = this._inactiveSkills.findIndex(s => s.id === skillId);
    if (idx === -1) return false;
    const [skill] = this._inactiveSkills.splice(idx, 1);
    this._activeSkills.push(skill);
    return true;
  }

  /**
   * Applies on-defend skill effects to an incoming damage value, delegating to
   * each active skill that exposes `applyOnDefend`, accumulating damage and messages.
   *
   * Returns `affected: true` when at least one skill modified the damage, signalling
   * to the caller that the returned `damage` should be used directly (bypassing any
   * entity-level damage floor such as `takeDamage`).
   *
   * @param {number} incomingDamage - The incoming damage before skill modifications.
   * @returns {{ affected: boolean, damage: number, messages: string[] }}
   */
  applyOnDefendSkills(incomingDamage) {
    let damage = incomingDamage;
    const messages = [];

    for (const skill of this._activeSkills) {
      if (typeof skill.applyOnDefend === 'function') {
        const result = skill.applyOnDefend(damage, this.rng);
        damage = result.damage;
        messages.push(...result.messages);
      }
    }

    return { affected: damage !== incomingDamage, damage, messages };
  }

  /**
   * Applies on-hit skill effects to a damage value, delegating to each active skill
   * in turn and accumulating any triggered effects and messages.
   *
   * @param {number} baseDamage - The base damage before skill modifications.
   * @returns {{ damage: number, messages: string[] }}
   */
  applyOnHitSkills(baseDamage) {
    let damage = baseDamage;
    const messages = [];

    for (const skill of this._activeSkills) {
      if (typeof skill.applyOnHit === 'function') {
        const result = skill.applyOnHit(damage, this.rng);
        damage = result.damage;
        messages.push(...result.messages);
      }
    }

    return { damage, messages };
  }
}
