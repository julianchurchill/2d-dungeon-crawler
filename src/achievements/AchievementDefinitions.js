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
  {
    id: 'goblin_killer',
    name: 'Goblin Killer',
    description: 'Kill 10 goblins',
    condition: { type: 'kill_type', enemyType: 'goblin', target: 10 },
    progressUnit: 'killed',
  },
  {
    id: 'burrower',
    name: 'Burrower',
    description: 'Reach dungeon floor 10',
    condition: { type: 'floor_reached', target: 10 },
    progressUnit: 'reached',
  },
];
