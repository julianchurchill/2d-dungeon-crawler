/**
 * @module NpcDefinitions
 * @description Fixed NPC definitions for the town. Each entry describes one NPC:
 * their tile position, display name, sprite key, cycling dialogue lines, and
 * optional contextual line generators that fire based on the player's state.
 * Positions must be on walkable floor tiles within the town layout (26×20).
 */

/**
 * @typedef {object} NpcDefinition
 * @property {string}   name             - Display name shown in the dialogue panel.
 * @property {number}   x                - Tile x position in the town map.
 * @property {number}   y                - Tile y position in the town map.
 * @property {string}   spriteKey        - Phaser texture key for the NPC sprite.
 * @property {string[]} lines            - Dialogue lines, cycled on each interaction.
 * @property {Array<function(import('./Player.js').Player): string|null>} [contextualLines]
 *   Functions that receive the player and return a contextual line (or null when
 *   the condition is not met).  A random applicable line replaces the cycling
 *   line with {@link CONTEXTUAL_CHANCE} probability per interaction.
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
    contextualLines: [
      // Comment on character level
      (p) => p.stats.level >= 5
        ? `Level ${p.stats.level} already! You may yet survive where others have not.`
        : null,
      (p) => p.stats.level === 1
        ? 'Still fresh, I see. Do not rush down those stairs unprepared.'
        : null,
      // Comment on equipped weapon
      (p) => p.equippedWeapon
        ? `That ${p.equippedWeapon.name} — a fine choice for the darkness below.`
        : 'You should arm yourself at the weapon shop before you descend.',
      // Comment on gold
      (p) => p.gold >= 100
        ? `${p.gold} gold? Wisely saved. Spend it before you go — you can't take it to your grave.`
        : null,
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
    contextualLines: [
      // Comment on equipped weapon
      (p) => p.equippedWeapon
        ? `That's a fancy looking ${p.equippedWeapon.name} you've got — do you know where I can get one?`
        : "You're going into the dungeon unarmed? You're braver than you look.",
      // Comment on equipped armour
      (p) => p.equippedArmor
        ? `Nice ${p.equippedArmor.name}. You'll need it down there.`
        : null,
      // Comment on level
      (p) => p.stats.level >= 3
        ? `Level ${p.stats.level}? I've seen veterans with less experience. Impressive.`
        : null,
      // Comment on low HP
      (p) => p.stats.hp < Math.ceil(p.stats.maxHp * 0.4)
        ? "You look wounded. The shop sells healing potions — use one before you go back down."
        : null,
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
    contextualLines: [
      // Comment on gold
      (p) => p.gold === 0
        ? 'Broke already? My sympathies. Try selling some dungeon loot.'
        : null,
      (p) => p.gold > 0 && p.gold < 20
        ? `Only ${p.gold} gold? Barely enough for a potion. Hope you're lucky down there.`
        : null,
      (p) => p.gold >= 50
        ? `${p.gold} gold! You're doing better than me. Don't tell the shop owners I said that.`
        : null,
      // Comment on full inventory
      (p) => p.inventory.length >= p.maxInventory
        ? 'Your pack looks full. Sell something — you might find better down below.'
        : null,
      // Comment on a specific item type in inventory
      (p) => {
        const potions = p.inventory.filter(i => i.itemType === 'consumable');
        return potions.length >= 3
          ? `${potions.length} potions? You're either very cautious or very unlucky. Maybe both.`
          : null;
      },
    ],
  },
];
