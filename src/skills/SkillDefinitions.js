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
  FEROCITY: {
    id: 'ferocity',
    name: 'Ferocity',
    description: '+1 flat damage on each attack.',
    baseBonus: 1,
  },
  DODGE: {
    id: 'dodge',
    name: 'Dodge',
    description: '1% chance to completely dodge an attack.',
    baseDodgeChance: 0.01,
    maxDodgeChance: 0.50,
    dodgeStep: 0.01,
    triggerMessage: 'Dodged!',
  },
  GOBLIN_HUNTING: {
    id: 'goblin_hunting',
    name: 'Goblin Hunting',
    description: '+10% damage against goblins.',
    targetType: 'goblin',
    bonusMultiplier: 0.10,
  },
  ORC_HUNTING: {
    id: 'orc_hunting',
    name: 'Orc Hunting',
    description: '+10% damage against orcs.',
    targetType: 'orc',
    bonusMultiplier: 0.10,
  },
  TROLL_HUNTING: {
    id: 'troll_hunting',
    name: 'Troll Hunting',
    description: '+10% damage against trolls.',
    targetType: 'troll',
    bonusMultiplier: 0.10,
  },
  COCKROACH_HUNTING: {
    id: 'cockroach_hunting',
    name: 'Cockroach Hunting',
    description: '+10% damage against cockroaches.',
    targetType: 'cockroach',
    bonusMultiplier: 0.10,
  },
  SPRITE_HUNTING: {
    id: 'sprite_hunting',
    name: 'Sprite Hunting',
    description: '+10% damage against sprites.',
    targetType: 'sprite',
    bonusMultiplier: 0.10,
  },
  CREEPING_MASS_HUNTING: {
    id: 'creeping_mass_hunting',
    name: 'Creeping Mass Hunting',
    description: '+10% damage against creeping masses.',
    targetType: 'creeping_mass',
    bonusMultiplier: 0.10,
  },
  SKELETON_HUNTING: {
    id: 'skeleton_hunting',
    name: 'Skeleton Hunting',
    description: '+10% damage against skeletons.',
    targetType: 'skeleton',
    bonusMultiplier: 0.10,
  },
  SKELETON_WARRIOR_HUNTING: {
    id: 'skeleton_warrior_hunting',
    name: 'Skeleton Warrior Hunting',
    description: '+10% damage against skeleton warriors.',
    targetType: 'skeleton_warrior',
    bonusMultiplier: 0.10,
  },
  SKELETON_MAGE_HUNTING: {
    id: 'skeleton_mage_hunting',
    name: 'Skeleton Mage Hunting',
    description: '+10% damage against skeleton mages.',
    targetType: 'skeleton_mage',
    bonusMultiplier: 0.10,
  },
  NIGHT_VISION: {
    id: 'night_vision',
    name: 'Night Vision',
    description: 'Extends your field of view by 1 tile.',
    fovStep: 1,
  },
});
