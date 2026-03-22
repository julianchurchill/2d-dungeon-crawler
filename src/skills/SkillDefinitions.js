/**
 * @module SkillDefinitions
 * @description Static definitions for all character skills.
 * Each entry describes a skill's identity, trigger conditions, and effect parameters.
 */

export const SKILLS = Object.freeze({
  LUCKY_STRIKE: {
    id: 'lucky_strike',
    name: 'Lucky Strike',
    description: '1% chance to deal 50% bonus damage on a hit.',
    baseCritChance: 0.01,
    damageMultiplier: 1.5,
    triggerMessage: 'Lucky Strike!',
  },
});
