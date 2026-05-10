/**
 * Loot table functions and rare-drop registries.
 * All floor/challenge/hidden-room loot selection logic lives here;
 * ItemTypes.js contains only the item type definitions.
 */

import { ITEM_TYPES } from './ItemTypes.js';

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
