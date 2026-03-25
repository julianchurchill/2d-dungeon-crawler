export const ITEM_TYPES = {
  HEALTH_POTION: {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 15 HP',
    textureKey: 'item_potion_health',
    type: 'consumable',
    effect: { heal: 15 },
  },
  MEGA_POTION: {
    id: 'mega_potion',
    name: 'Mega Potion',
    description: 'Restores 30 HP',
    textureKey: 'item_potion_health',
    type: 'consumable',
    effect: { heal: 30 },
  },
  SWORD: {
    id: 'sword',
    name: 'Short Sword',
    description: '+3 Attack',
    textureKey: 'item_weapon',
    type: 'weapon',
    attackBonus: 3,
  },
  LONG_SWORD: {
    id: 'long_sword',
    name: 'Long Sword',
    description: '+5 Attack',
    textureKey: 'item_weapon',
    type: 'weapon',
    attackBonus: 5,
  },
  LEATHER_ARMOR: {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: '+2 Defense',
    textureKey: 'item_armor',
    type: 'armor',
    defenseBonus: 2,
  },
  CHAIN_MAIL: {
    id: 'chain_mail',
    name: 'Chain Mail',
    description: '+4 Defense',
    textureKey: 'item_armor',
    type: 'armor',
    defenseBonus: 4,
  },
  POTION_OF_MINOR_TELEPORTATION: {
    id: 'potion_of_minor_teleportation',
    name: 'Potion of Minor Teleportation',
    description: 'Teleports you to a random nearby space',
    textureKey: 'item_potion_teleport',
    type: 'consumable',
    effect: { type: 'teleport_near', minDist: 3, maxDist: 8 },
  },
};

/**
 * Returns a random item type for the given floor, optionally including
 * achievement-unlocked items.
 *
 * @param {number} floor
 * @param {object} rng          - RNG with a `pick(array)` method.
 * @param {Set<string>} [unlockedItems] - Set of item ids that have been unlocked.
 * @returns {object} An ITEM_TYPES entry.
 */
export function getFloorLoot(floor, rng, unlockedItems = new Set()) {
  // Common items are added multiple times to increase their spawn weight.
  // Rare/unlocked items are added once for a lower chance of appearing.
  const pool = [
    ITEM_TYPES.HEALTH_POTION, ITEM_TYPES.HEALTH_POTION, ITEM_TYPES.HEALTH_POTION,
  ];
  if (floor >= 1) pool.push(ITEM_TYPES.SWORD, ITEM_TYPES.LEATHER_ARMOR);
  if (floor >= 2) {
    pool.push(
      ITEM_TYPES.MEGA_POTION, ITEM_TYPES.MEGA_POTION, ITEM_TYPES.MEGA_POTION,
      ITEM_TYPES.LONG_SWORD,
    );
  }
  if (floor >= 3) pool.push(ITEM_TYPES.CHAIN_MAIL);
  if (unlockedItems.has(ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION.id)) {
    pool.push(ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION);
  }
  return rng.pick(pool);
}
