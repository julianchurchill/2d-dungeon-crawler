/**
 * @module SkillFactory
 * @description Reconstructs skill objects from plain-object save data.
 */
import { LuckyStrikeSkill } from '../skills/LuckyStrikeSkill.js';
import { DodgeSkill }        from '../skills/DodgeSkill.js';
import { FerocitySkill }     from '../skills/FerocitySkill.js';
import { NightVisionSkill }  from '../skills/NightVisionSkill.js';
import { HuntingSkill }      from '../skills/HuntingSkill.js';
import { SKILLS }            from '../skills/SkillDefinitions.js';

/**
 * Creates the appropriate skill class instance from saved data and
 * restores any upgradeable state (crit chance, bonus, etc.).
 *
 * @param {object} data - Plain object produced by SaveGame.skillToSaveData().
 * @returns {object|null} Reconstructed skill instance, or null if unknown id.
 */
export function createSkillFromData(data) {
  switch (data.id) {
    case SKILLS.LUCKY_STRIKE.id: {
      const s = new LuckyStrikeSkill();
      if (data.critChance       !== undefined) s._baseCritChance   = data.critChance;
      if (data.damageMultiplier !== undefined) s._damageMultiplier = data.damageMultiplier;
      return s;
    }
    case SKILLS.DODGE.id: {
      const s = new DodgeSkill();
      if (data.dodgeChance !== undefined) s._dodgeChance = data.dodgeChance;
      return s;
    }
    case SKILLS.FEROCITY.id: {
      const s = new FerocitySkill();
      if (data.bonus !== undefined) s._bonus = data.bonus;
      return s;
    }
    case SKILLS.NIGHT_VISION.id: {
      const s = new NightVisionSkill();
      if (data.level !== undefined) s._level = data.level;
      return s;
    }
    default: {
      // Hunting skills and other permanent skills — no upgrade state
      const key = Object.keys(SKILLS).find(k => SKILLS[k].id === data.id);
      if (key) return new HuntingSkill(key);
      return null;
    }
  }
}
