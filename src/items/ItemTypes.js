import { findMinorTeleportDestination } from '../systems/MinorTeleportation.js';

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
    use(item, player) {
      const healed = player.heal(item.effect.heal);
      return `You drink the ${item.name} and restore ${healed} HP.`;
    },
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
    use(item, player) {
      const healed = player.heal(item.effect.heal);
      return `You drink the ${item.name} and restore ${healed} HP.`;
    },
  },
  SWORD: {
    id: 'sword',
    name: 'Short Sword',
    description: '+3 Attack',
    textureKey: 'item_weapon',
    type: 'weapon',
    attackBonus: 3,
    sellPrice: 15,
    use(item, player) {
      player.equippedWeapon = item;
      return `You equip the ${item.name}. (+${item.attackBonus} ATK)`;
    },
  },
  LONG_SWORD: {
    id: 'long_sword',
    name: 'Long Sword',
    description: '+5 Attack',
    textureKey: 'item_weapon',
    type: 'weapon',
    attackBonus: 5,
    sellPrice: 25,
    use(item, player) {
      player.equippedWeapon = item;
      return `You equip the ${item.name}. (+${item.attackBonus} ATK)`;
    },
  },
  LEATHER_ARMOR: {
    id: 'leather_armor',
    name: 'Leather Shield',
    description: '+2 Defense',
    textureKey: 'item_armor',
    type: 'armor',
    defenseBonus: 2,
    sellPrice: 12,
    use(item, player) {
      player.equippedArmor = item;
      return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`;
    },
  },
  CHAIN_MAIL: {
    id: 'chain_mail',
    name: 'Iron Shield',
    description: '+4 Defense',
    textureKey: 'item_armor',
    type: 'armor',
    defenseBonus: 4,
    sellPrice: 20,
    use(item, player) {
      player.equippedArmor = item;
      return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`;
    },
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
    use(item, player) {
      player.equippedWeapon = item;
      return `You equip the ${item.name}. (+${item.attackBonus} ATK)`;
    },
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
    use(item, player) {
      player.equippedArmor = item;
      return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`;
    },
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
    use(item, player) {
      player.equippedArmor = item;
      return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`;
    },
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
    use(item, player) {
      player.equippedWeapon = item;
      return `You equip the ${item.name}. (+${item.attackBonus} ATK)`;
    },
  },
  ECLIPSE_BLADE: {
    id: 'eclipse_blade',
    name: 'Eclipse Blade',
    description: '+12 Attack — a blade forged in total darkness, drinks the light from the air around it',
    textureKey: 'item_eclipse_blade',
    type: 'weapon',
    attackBonus: 12,
    sellPrice: 80,
    unique: true,
    use(item, player) {
      player.equippedWeapon = item;
      return `You equip the ${item.name}. (+${item.attackBonus} ATK)`;
    },
  },
  KEY_TO_BEYOND: {
    id: 'key_to_beyond',
    name: 'The Key to Beyond',
    description: 'A heavy iron key etched with symbols you cannot read — its purpose lies further still',
    textureKey: 'item_key_to_beyond',
    type: 'quest_item',
    sellPrice: 0,
    unique: true,
  },
  KEY_TO_ELSEWHERE: {
    id: 'key_to_elsewhere',
    name: 'The Key to Elsewhere',
    description: 'An ornate key humming with portal-magic, its purpose lies deeper in the dungeon',
    textureKey: 'item_key_to_elsewhere',
    type: 'quest_item',
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
    use(item, player) {
      player.equippedRangedWeapon = item;
      return `You equip the ${item.name}. (+${item.attackBonus} ATK)`;
    },
  },
  HAND_CROSSBOW: {
    id: 'hand_crossbow',
    name: 'Hand Crossbow',
    description: '+4 Attack',
    textureKey: 'item_ranged_weapon',
    type: 'ranged_weapon',
    attackBonus: 4,
    sellPrice: 22,
    use(item, player) {
      player.equippedRangedWeapon = item;
      return `You equip the ${item.name}. (+${item.attackBonus} ATK)`;
    },
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
    use(item, player, context) {
      const { rng, isWalkable, getEntityAt } = context;
      const dest = findMinorTeleportDestination(
        player.x, player.y, isWalkable, getEntityAt, rng,
        item.effect.minDist, item.effect.maxDist,
      );
      if (!dest) {
        return `You drink the ${item.name} but nothing happens — no clear space nearby!`;
      }
      player.x = dest.x;
      player.y = dest.y;
      return `You drink the ${item.name} and vanish in a flash!`;
    },
  },
  PICK_AXE: {
    id: 'pick_axe',
    name: 'Pick Axe',
    description: '+2 Attack. Equip to break Rocky Stone Walls by moving into them.',
    textureKey: 'item_pick_axe',
    type: 'weapon',
    attackBonus: 2,
    canBreakWalls: true,
    sellPrice: 8,
    use(item, player) {
      player.equippedWeapon = item;
      return `You equip the ${item.name}. (+${item.attackBonus} ATK)`;
    },
  },
  HOME_SEEKING_SCROLL: {
    id: 'home_seeking_scroll',
    name: 'Home Seeking Scroll',
    description: 'Teleports you to town instantly. Leaves a portal so you can return.',
    textureKey: 'item_home_seeking_scroll',
    type: 'consumable',
    effect: { type: 'teleport_to_town' },
    sellPrice: 15,
    stackable: true,
    use(item) {
      return `You read the ${item.name} and are whisked back to town!`;
    },
  },
};

// ── Additional equipment slot items ───────────────────────────────────────────

ITEM_TYPES.LEATHER_CAP       = { id: 'leather_cap',       name: 'Leather Cap',        type: 'helmet',  defenseBonus: 1, sellPrice: 10, description: '+1 Defense', textureKey: 'item_helmet', use(item, player) { player.equippedHelmet = item; return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`; } };
ITEM_TYPES.IRON_HELMET        = { id: 'iron_helmet',        name: 'Iron Helmet',         type: 'helmet',  defenseBonus: 3, sellPrice: 20, description: '+3 Defense', textureKey: 'item_helmet', use(item, player) { player.equippedHelmet = item; return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`; } };
ITEM_TYPES.LEATHER_CHESTPIECE = { id: 'leather_chestpiece', name: 'Leather Chestpiece',  type: 'chest',   defenseBonus: 2, sellPrice: 12, description: '+2 Defense', textureKey: 'item_chest',  use(item, player) { player.equippedChest = item; return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`; } };
ITEM_TYPES.CHAIN_HAUBERK      = { id: 'chain_hauberk',      name: 'Chain Hauberk',       type: 'chest',   defenseBonus: 4, sellPrice: 22, description: '+4 Defense', textureKey: 'item_chest',  use(item, player) { player.equippedChest = item; return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`; } };
ITEM_TYPES.LEATHER_LEGGINGS   = { id: 'leather_leggings',   name: 'Leather Leggings',    type: 'legs',    defenseBonus: 1, sellPrice: 8,  description: '+1 Defense', textureKey: 'item_legs',   use(item, player) { player.equippedLegs = item; return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`; } };
ITEM_TYPES.CHAIN_LEGGINGS     = { id: 'chain_leggings',     name: 'Chain Leggings',      type: 'legs',    defenseBonus: 3, sellPrice: 18, description: '+3 Defense', textureKey: 'item_legs',   use(item, player) { player.equippedLegs = item; return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`; } };
ITEM_TYPES.LEATHER_GAUNTLETS  = { id: 'leather_gauntlets',  name: 'Leather Gauntlets',   type: 'arms',    defenseBonus: 1, sellPrice: 8,  description: '+1 Defense', textureKey: 'item_arms',   use(item, player) { player.equippedArms = item; return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`; } };
ITEM_TYPES.IRON_GAUNTLETS     = { id: 'iron_gauntlets',     name: 'Iron Gauntlets',      type: 'arms',    defenseBonus: 3, sellPrice: 18, description: '+3 Defense', textureKey: 'item_arms',   use(item, player) { player.equippedArms = item; return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`; } };
ITEM_TYPES.LEATHER_BOOTS      = { id: 'leather_boots',      name: 'Leather Boots',       type: 'boots',   defenseBonus: 1, sellPrice: 6,  description: '+1 Defense', textureKey: 'item_boots',  use(item, player) { player.equippedBoots = item; return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`; } };
ITEM_TYPES.IRON_BOOTS         = { id: 'iron_boots',         name: 'Iron Boots',          type: 'boots',   defenseBonus: 2, sellPrice: 14, description: '+2 Defense', textureKey: 'item_boots',  use(item, player) { player.equippedBoots = item; return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`; } };
ITEM_TYPES.IRON_RING          = { id: 'iron_ring',          name: 'Iron Ring',           type: 'ring',    attackBonus: 1,  defenseBonus: 0, sellPrice: 15, description: '+1 Attack', textureKey: 'item_ring',   use(item, player) { if (player.equippedRing1 === null) { player.equippedRing1 = item; } else { player.equippedRing2 = item; } return `You equip the ${item.name}. (+${item.attackBonus} ATK)`; } };
ITEM_TYPES.GOLD_RING          = { id: 'gold_ring',          name: 'Gold Ring',           type: 'ring',    attackBonus: 2,  defenseBonus: 0, sellPrice: 25, description: '+2 Attack', textureKey: 'item_ring',   use(item, player) { if (player.equippedRing1 === null) { player.equippedRing1 = item; } else { player.equippedRing2 = item; } return `You equip the ${item.name}. (+${item.attackBonus} ATK)`; } };
ITEM_TYPES.STONE_AMULET       = { id: 'stone_amulet',       name: 'Stone Amulet',        type: 'amulet',  defenseBonus: 2, sellPrice: 15, description: '+2 Defense', textureKey: 'item_amulet', use(item, player) { player.equippedAmulet = item; return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`; } };
ITEM_TYPES.JADE_AMULET        = { id: 'jade_amulet',        name: 'Jade Amulet',         type: 'amulet',  attackBonus: 0,  defenseBonus: 3, sellPrice: 25, description: '+3 Defense', textureKey: 'item_amulet', use(item, player) { player.equippedAmulet = item; return `You equip the ${item.name}. (+${item.defenseBonus} DEF)`; } };

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
      ITEM_TYPES.HOME_SEEKING_SCROLL,
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
 * Registry of item types that have a percentage-based rare floor drop mechanic.
 * Used by DevOptionsScene to build the ITEM SPAWN toggle rows.
 *
 * @type {Array<{ key: string, typeDef: object }>}
 */
export const RARE_FLOOR_DROP_ITEMS = [
  { key: 'PICK_AXE', typeDef: ITEM_TYPES.PICK_AXE },
];

/**
 * Rolls for a rare one-off pick axe floor drop.
 * Returns ITEM_TYPES.PICK_AXE with a 10% probability, or always when forced.
 *
 * @param {{ nextBool: (p: number) => boolean }} rng
 * @param {boolean} [forced=false] - When true, skips the RNG roll and always returns the item.
 * @returns {object|null}
 */
export function getPickAxeFloorDrop(rng, forced = false) {
  return (forced || rng.nextBool(0.1)) ? ITEM_TYPES.PICK_AXE : null;
}

/**
 * Returns a random valuable item suitable for a hidden room cache.
 * Stub — real implementation in the green phase.
 *
 * @param {number} floor
 * @param {{ next: () => number }} rng
 * @param {Set<string>} [unlockedItems]
 * @returns {object}
 */
export function getHiddenRoomLoot(floor, rng, unlockedItems = new Set()) {
  // Bias toward non-potion gear by using a +5 floor bonus and filtering out
  // the extra health-potion weight added at every floor level.
  const bonusFloor = floor + 5;
  const pool = getFloorLootPool(bonusFloor, unlockedItems).filter(
    item => item !== ITEM_TYPES.HEALTH_POTION,
  );
  const src = pool.length > 0 ? pool : getFloorLootPool(floor, unlockedItems);
  return src[Math.floor(rng.next() * src.length)];
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
