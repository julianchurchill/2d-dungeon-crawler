/**
 * @module AchievementDefinitions
 * @description Defines all achievements available in the game.
 *
 * Each definition describes what must happen for the achievement to unlock,
 * how progress is measured, and how to display that progress to the player.
 * All achievements are count-based: a numeric counter is compared against a
 * target value to determine completion.
 *
 * Condition types:
 *   - kill_type     : count kills of a specific enemy type (increments by 1)
 *   - floor_reached : track the highest floor reached (count = floor number)
 *   - player_level  : track the highest level reached (count = level number)
 */

/**
 * @typedef {object} AchievementCondition
 * @property {'kill_type'|'floor_reached'|'player_level'} type
 * @property {number} target - The value that must be reached.
 * @property {string} [enemyType] - Required when type is 'kill_type'.
 */

/**
 * @typedef {object} AchievementDefinition
 * @property {string} id              - Unique identifier.
 * @property {string} name            - Display name shown to the player.
 * @property {string} description     - Short description of the unlock condition.
 * @property {AchievementCondition} condition
 * @property {string} progressUnit    - Unit label for the progress counter
 *   (e.g. 'killed', 'reached').  Always required — all achievements are count-based.
 */

/** @type {AchievementDefinition[]} */
export const ACHIEVEMENTS = [
  // ── Kill achievements ────────────────────────────────────────────────────
  {
    id: 'goblin_killer',
    name: 'Goblin Killer',
    description: 'Kill 10 goblins',
    condition: { type: 'kill_type', enemyType: 'goblin', target: 10 },
    progressUnit: 'killed',
  },
  {
    id: 'orc_killer',
    name: 'Orc Killer',
    description: 'Kill 10 orcs',
    condition: { type: 'kill_type', enemyType: 'orc', target: 10 },
    progressUnit: 'killed',
  },
  {
    id: 'troll_killer',
    name: 'Troll Killer',
    description: 'Kill 10 trolls',
    condition: { type: 'kill_type', enemyType: 'troll', target: 10 },
    progressUnit: 'killed',
  },

  // ── Floor achievements ───────────────────────────────────────────────────
  {
    id: 'burrower',
    name: 'Burrower',
    description: 'Reach dungeon floor 10',
    condition: { type: 'floor_reached', target: 10 },
    progressUnit: 'reached',
  },
  {
    id: 'deep_diver',
    name: 'Deep Diver',
    description: 'Reach dungeon floor 20',
    condition: { type: 'floor_reached', target: 20 },
    progressUnit: 'reached',
  },
  {
    id: 'spelunker',
    name: 'Spelunker',
    description: 'Reach dungeon floor 30',
    condition: { type: 'floor_reached', target: 30 },
    progressUnit: 'reached',
  },
  {
    id: 'dungeon_delver',
    name: 'Dungeon Delver',
    description: 'Reach dungeon floor 40',
    condition: { type: 'floor_reached', target: 40 },
    progressUnit: 'reached',
  },
  {
    id: 'abyssal_explorer',
    name: 'Abyssal Explorer',
    description: 'Reach dungeon floor 50',
    condition: { type: 'floor_reached', target: 50 },
    progressUnit: 'reached',
  },
  {
    id: 'underworld_wanderer',
    name: 'Underworld Wanderer',
    description: 'Reach dungeon floor 60',
    condition: { type: 'floor_reached', target: 60 },
    progressUnit: 'reached',
  },
  {
    id: 'shadow_walker',
    name: 'Shadow Walker',
    description: 'Reach dungeon floor 70',
    condition: { type: 'floor_reached', target: 70 },
    progressUnit: 'reached',
  },
  {
    id: 'void_traveller',
    name: 'Void Traveller',
    description: 'Reach dungeon floor 80',
    condition: { type: 'floor_reached', target: 80 },
    progressUnit: 'reached',
  },
  {
    id: 'abyss_dweller',
    name: 'Abyss Dweller',
    description: 'Reach dungeon floor 90',
    condition: { type: 'floor_reached', target: 90 },
    progressUnit: 'reached',
  },
  {
    id: 'dungeon_master',
    name: 'Dungeon Master',
    description: 'Reach dungeon floor 100',
    condition: { type: 'floor_reached', target: 100 },
    progressUnit: 'reached',
  },

  // ── Level achievements ───────────────────────────────────────────────────
  {
    id: 'apprentice',
    name: 'Apprentice',
    description: 'Reach level 10',
    condition: { type: 'player_level', target: 10 },
    progressUnit: 'reached',
  },
  {
    id: 'journeyman',
    name: 'Journeyman',
    description: 'Reach level 20',
    condition: { type: 'player_level', target: 20 },
    progressUnit: 'reached',
  },
  {
    id: 'adept',
    name: 'Adept',
    description: 'Reach level 30',
    condition: { type: 'player_level', target: 30 },
    progressUnit: 'reached',
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Reach level 40',
    condition: { type: 'player_level', target: 40 },
    progressUnit: 'reached',
  },
  {
    id: 'master',
    name: 'Master',
    description: 'Reach level 50',
    condition: { type: 'player_level', target: 50 },
    progressUnit: 'reached',
  },
  {
    id: 'grandmaster',
    name: 'Grandmaster',
    description: 'Reach level 60',
    condition: { type: 'player_level', target: 60 },
    progressUnit: 'reached',
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Reach level 70',
    condition: { type: 'player_level', target: 70 },
    progressUnit: 'reached',
  },
  {
    id: 'mythic',
    name: 'Mythic',
    description: 'Reach level 80',
    condition: { type: 'player_level', target: 80 },
    progressUnit: 'reached',
  },
  {
    id: 'transcendent',
    name: 'Transcendent',
    description: 'Reach level 90',
    condition: { type: 'player_level', target: 90 },
    progressUnit: 'reached',
  },
  {
    id: 'immortal',
    name: 'Immortal',
    description: 'Reach level 100',
    condition: { type: 'player_level', target: 100 },
    progressUnit: 'reached',
  },
];
