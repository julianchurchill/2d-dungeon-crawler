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
};

export function getFloorLoot(floor, rng) {
  const pool = [ITEM_TYPES.HEALTH_POTION];
  if (floor >= 1) pool.push(ITEM_TYPES.SWORD, ITEM_TYPES.LEATHER_ARMOR);
  if (floor >= 2) pool.push(ITEM_TYPES.MEGA_POTION, ITEM_TYPES.LONG_SWORD);
  if (floor >= 3) pool.push(ITEM_TYPES.CHAIN_MAIL);
  return rng.pick(pool);
}
