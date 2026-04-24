export const ITEM_TYPES = {
  HEALTH_POTION: {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 15 HP',
    textureKey: 'item_potion_health',
    type: 'consumable',
    effect: { heal: 15 },
    sellPrice: 5,
    stackable: true,
  },
  MEGA_POTION: {
    id: 'mega_potion',
    name: 'Mega Potion',
    description: 'Restores 30 HP',
    textureKey: 'item_potion_health',
    type: 'consumable',
    effect: { heal: 30 },
    sellPrice: 10,
    stackable: true,
  },
  SWORD: {
    id: 'sword',
    name: 'Short Sword',
    description: '+3 Attack',
    textureKey: 'item_weapon',
    type: 'weapon',
    attackBonus: 3,
    sellPrice: 15,
  },
  LONG_SWORD: {
    id: 'long_sword',
    name: 'Long Sword',
    description: '+5 Attack',
    textureKey: 'item_weapon',
    type: 'weapon',
    attackBonus: 5,
    sellPrice: 25,
  },
  LEATHER_ARMOR: {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: '+2 Defense',
    textureKey: 'item_armor',
    type: 'armor',
    defenseBonus: 2,
    sellPrice: 12,
  },
  CHAIN_MAIL: {
    id: 'chain_mail',
    name: 'Chain Mail',
    description: '+4 Defense',
    textureKey: 'item_armor',
    type: 'armor',
    defenseBonus: 4,
    sellPrice: 20,
  },
  BONE_BLADE: {
    id: 'bone_blade',
    name: 'Bone Blade',
    description: '+7 Attack — a serrated blade carved from ancient bone',
    textureKey: 'item_bone_blade',
    type: 'weapon',
    attackBonus: 7,
    sellPrice: 40,
    unique: true,
  },
  SKELETON_SHIELD: {
    id: 'skeleton_shield',
    name: 'Skeleton Shield',
    description: '+5 Defense — a shield fashioned from interlocked bones',
    textureKey: 'item_skeleton_shield',
    type: 'armor',
    defenseBonus: 5,
    sellPrice: 35,
    unique: true,
  },
  NIGHT_CLOAK: {
    id: 'night_cloak',
    name: 'Night Cloak',
    description: '+4 Defense — a cloak woven from shadow, drinks in light and magic',
    textureKey: 'item_night_cloak',
    type: 'armor',
    defenseBonus: 4,
    sellPrice: 38,
    unique: true,
  },
  NULL_SCIMITAR: {
    id: 'null_scimitar',
    name: 'Null Scimitar',
    description: '+9 Attack — a blade of void energy that silences what it strikes',
    textureKey: 'item_null_scimitar',
    type: 'weapon',
    attackBonus: 9,
    sellPrice: 55,
    unique: true,
  },
  KEY_TO_ELSEWHERE: {
    id: 'key_to_elsewhere',
    name: 'The Key to Elsewhere',
    description: '+1 Defense — an ornate key humming with portal-magic, its purpose lies deeper in the dungeon',
    textureKey: 'item_key_to_elsewhere',
    type: 'amulet',
    defenseBonus: 1,
    sellPrice: 0,
    unique: true,
  },
  SHORT_BOW: {
    id: 'short_bow',
    name: 'Short Bow',
    description: '+2 Attack',
    textureKey: 'item_ranged_weapon',
    type: 'ranged_weapon',
    attackBonus: 2,
    sellPrice: 12,
  },
  HAND_CROSSBOW: {
    id: 'hand_crossbow',
    name: 'Hand Crossbow',
    description: '+4 Attack',
    textureKey: 'item_ranged_weapon',
    type: 'ranged_weapon',
    attackBonus: 4,
    sellPrice: 22,
  },
  POTION_OF_MINOR_TELEPORTATION: {
    id: 'potion_of_minor_teleportation',
    name: 'Potion of Minor Teleportation',
    shortName: 'Teleport Potion',
    description: 'Teleports you to a random nearby space',
    textureKey: 'item_potion_teleport',
    type: 'consumable',
    effect: { type: 'teleport_near', minDist: 3, maxDist: 8 },
    sellPrice: 8,
    stackable: true,
  },
};

// ── Additional equipment slot items ───────────────────────────────────────────

ITEM_TYPES.LEATHER_CAP       = { id: 'leather_cap',       name: 'Leather Cap',        type: 'helmet',  defenseBonus: 1, sellPrice: 10, description: '+1 Defense', textureKey: 'item_helmet' };
ITEM_TYPES.IRON_HELMET        = { id: 'iron_helmet',        name: 'Iron Helmet',         type: 'helmet',  defenseBonus: 3, sellPrice: 20, description: '+3 Defense', textureKey: 'item_helmet' };
ITEM_TYPES.LEATHER_CHESTPIECE = { id: 'leather_chestpiece', name: 'Leather Chestpiece',  type: 'chest',   defenseBonus: 2, sellPrice: 12, description: '+2 Defense', textureKey: 'item_chest'  };
ITEM_TYPES.CHAIN_HAUBERK      = { id: 'chain_hauberk',      name: 'Chain Hauberk',       type: 'chest',   defenseBonus: 4, sellPrice: 22, description: '+4 Defense', textureKey: 'item_chest'  };
ITEM_TYPES.LEATHER_LEGGINGS   = { id: 'leather_leggings',   name: 'Leather Leggings',    type: 'legs',    defenseBonus: 1, sellPrice: 8,  description: '+1 Defense', textureKey: 'item_legs'   };
ITEM_TYPES.CHAIN_LEGGINGS     = { id: 'chain_leggings',     name: 'Chain Leggings',      type: 'legs',    defenseBonus: 3, sellPrice: 18, description: '+3 Defense', textureKey: 'item_legs'   };
ITEM_TYPES.LEATHER_GAUNTLETS  = { id: 'leather_gauntlets',  name: 'Leather Gauntlets',   type: 'arms',    defenseBonus: 1, sellPrice: 8,  description: '+1 Defense', textureKey: 'item_arms'   };
ITEM_TYPES.IRON_GAUNTLETS     = { id: 'iron_gauntlets',     name: 'Iron Gauntlets',      type: 'arms',    defenseBonus: 3, sellPrice: 18, description: '+3 Defense', textureKey: 'item_arms'   };
ITEM_TYPES.LEATHER_BOOTS      = { id: 'leather_boots',      name: 'Leather Boots',       type: 'boots',   defenseBonus: 1, sellPrice: 6,  description: '+1 Defense', textureKey: 'item_boots'  };
ITEM_TYPES.IRON_BOOTS         = { id: 'iron_boots',         name: 'Iron Boots',          type: 'boots',   defenseBonus: 2, sellPrice: 14, description: '+2 Defense', textureKey: 'item_boots'  };
ITEM_TYPES.IRON_RING          = { id: 'iron_ring',          name: 'Iron Ring',           type: 'ring',    attackBonus: 1,  defenseBonus: 0, sellPrice: 15, description: '+1 Attack', textureKey: 'item_ring'   };
ITEM_TYPES.GOLD_RING          = { id: 'gold_ring',          name: 'Gold Ring',           type: 'ring',    attackBonus: 2,  defenseBonus: 0, sellPrice: 25, description: '+2 Attack', textureKey: 'item_ring'   };
ITEM_TYPES.STONE_AMULET       = { id: 'stone_amulet',       name: 'Stone Amulet',        type: 'amulet',  defenseBonus: 2, sellPrice: 15, description: '+2 Defense', textureKey: 'item_amulet' };
ITEM_TYPES.JADE_AMULET        = { id: 'jade_amulet',        name: 'Jade Amulet',         type: 'amulet',  attackBonus: 0,  defenseBonus: 3, sellPrice: 25, description: '+3 Defense', textureKey: 'item_amulet' };

/**
 * Returns the weighted item loot pool for the given floor.
 * Extracted so tests can inspect pool contents without needing an RNG.
 *
 * @param {number} floor
 * @param {Set<string>} [unlockedItems]
 * @returns {object[]} Array of ITEM_TYPES entries (may contain duplicates for weighting).
 */
export function getFloorLootPool(floor, unlockedItems = new Set()) {
  const pool = [
    ITEM_TYPES.HEALTH_POTION, ITEM_TYPES.HEALTH_POTION, ITEM_TYPES.HEALTH_POTION,
  ];
  if (floor >= 1) {
    pool.push(
      ITEM_TYPES.SWORD, ITEM_TYPES.LEATHER_ARMOR, ITEM_TYPES.SHORT_BOW,
      ITEM_TYPES.LEATHER_BOOTS, ITEM_TYPES.LEATHER_BOOTS,
    );
  }
  if (floor >= 2) {
    pool.push(
      ITEM_TYPES.MEGA_POTION, ITEM_TYPES.MEGA_POTION, ITEM_TYPES.MEGA_POTION,
      ITEM_TYPES.LONG_SWORD,
    );
  }
  if (floor >= 3) pool.push(ITEM_TYPES.CHAIN_MAIL);
  if (floor >= 4) pool.push(ITEM_TYPES.HAND_CROSSBOW);
  if (floor >= 10) pool.push(ITEM_TYPES.LEATHER_CAP, ITEM_TYPES.IRON_HELMET);
  if (floor >= 20) {
    pool.push(
      ITEM_TYPES.LEATHER_CHESTPIECE, ITEM_TYPES.CHAIN_HAUBERK,
      ITEM_TYPES.LEATHER_LEGGINGS,   ITEM_TYPES.CHAIN_LEGGINGS,
      ITEM_TYPES.LEATHER_GAUNTLETS,  ITEM_TYPES.IRON_GAUNTLETS,
      ITEM_TYPES.IRON_BOOTS,
    );
  }
  if (floor >= 30) {
    pool.push(
      ITEM_TYPES.IRON_RING,    ITEM_TYPES.GOLD_RING,
      ITEM_TYPES.STONE_AMULET, ITEM_TYPES.JADE_AMULET,
    );
  }
  if (unlockedItems.has(ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION.id)) {
    pool.push(ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION);
  }
  return pool;
}

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
  const pool = getFloorLootPool(floor, unlockedItems);
  return rng.pick(pool);
}

/**
 * Returns the potion-only loot pool used for challenge floors.
 * Challenge floors never drop weapons or armour — only consumable potions.
 *
 * @param {Set<string>} [unlockedItems] - Achievement-unlocked item ids.
 * @returns {object[]} Array of ITEM_TYPES entries (may contain duplicates for weighting).
 */
export function getChallengeLootPool(unlockedItems = new Set()) {
  const pool = [
    ITEM_TYPES.HEALTH_POTION, ITEM_TYPES.HEALTH_POTION,
    ITEM_TYPES.MEGA_POTION,   ITEM_TYPES.MEGA_POTION,
  ];
  if (unlockedItems.has(ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION.id)) {
    pool.push(ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION);
  }
  return pool;
}

/**
 * Returns a random potion for a challenge floor.
 * No weapons or armour are ever included in the pool.
 *
 * @param {object} rng          - RNG with a `pick(array)` method.
 * @param {Set<string>} [unlockedItems]
 * @returns {object} An ITEM_TYPES entry.
 */
export function getChallengeLoot(rng, unlockedItems = new Set()) {
  return rng.pick(getChallengeLootPool(unlockedItems));
}
