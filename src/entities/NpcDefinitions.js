/**
 * @module NpcDefinitions
 * @description Fixed NPC definitions for the town. Each entry describes one NPC:
 * their tile position, display name, sprite key, and cycling dialogue lines.
 * Positions must be on walkable floor tiles within the town layout (20×20).
 */

/**
 * @typedef {object} NpcDefinition
 * @property {string} name       - Display name shown in the dialogue panel.
 * @property {number} x          - Tile x position in the town map.
 * @property {number} y          - Tile y position in the town map.
 * @property {string} spriteKey  - Phaser texture key for the NPC sprite.
 * @property {string[]} lines    - Dialogue lines, cycled on each interaction.
 */

/** @type {NpcDefinition[]} */
export const TOWN_NPCS = [
  {
    name: 'Elder',
    x: 5,
    y: 15,
    spriteKey: 'entity_npc_elder',
    lines: [
      'Welcome, adventurer. The dungeon below grows darker with each passing day.',
      'Many brave souls have descended those stairs. Few return unchanged.',
      'Seek strength in the shops before you venture below.',
    ],
  },
  {
    name: 'Guard',
    x: 15,
    y: 15,
    spriteKey: 'entity_npc_guard',
    lines: [
      'Move along, citizen. Keep away from the dungeon entrance.',
      "I've heard strange noises coming from below. Stay vigilant.",
    ],
  },
  {
    name: 'Merchant',
    x: 10,
    y: 14,
    spriteKey: 'entity_npc_merchant',
    lines: [
      'Pssst! The shops charge too much. But what choice do we have, eh?',
      'Tip: sell anything you find in the dungeon — gold is hard to come by down there.',
      'I once found a sword worth 200 gold. The weapon shop gave me 25. Life is cruel.',
    ],
  },
];
