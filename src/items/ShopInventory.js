/**
 * @module ShopInventory
 * @description Generates shop stock for town shops.
 * Each shop type sells items appropriate for the player's level with randomly
 * generated stat bonuses. Buy prices are always higher than item sell prices.
 * Weapons and armour have a small chance to be a "rare" item with better stats.
 */

import { Item } from './Item.js';
import { ITEM_TYPES } from './ItemTypes.js';

/** Chance (0–100) of a rare high-tier item appearing as the first item. */
const RARE_CHANCE = 20;

/**
 * Generates shop stock for the given shop type.
 *
 * @param {'potion'|'weapon'|'armour'} shopType
 * @param {number} playerLevel - The player's current level, used to scale item quality.
 * @param {object} rng - RNG with nextInt(min, max) and nextBool(chance) methods.
 * @returns {Array<{item: import('./Item.js').Item, buyPrice: number}>}
 */
export function generateShopItems(shopType, playerLevel, rng) {
  switch (shopType) {
    case 'potion': return _generatePotionStock(playerLevel);
    case 'weapon': return _generateWeaponStock(playerLevel, rng);
    case 'armour': return _generateArmourStock(playerLevel, rng);
    default: return [];
  }
}

/**
 * Generates potion shop stock. Health potions are always available;
 * Mega Potions appear from level 2; Teleport Potions are always stocked.
 * Potion buy prices are double their sell price.
 *
 * @param {number} playerLevel
 * @returns {Array<{item: Item, buyPrice: number}>}
 */
function _generatePotionStock(playerLevel) {
  const stock = [];

  // Health potions — always stocked in quantity
  for (let i = 0; i < 3; i++) {
    stock.push(_fixedShopItem(ITEM_TYPES.HEALTH_POTION));
  }

  // Mega potions for experienced adventurers
  if (playerLevel >= 2) {
    for (let i = 0; i < 2; i++) {
      stock.push(_fixedShopItem(ITEM_TYPES.MEGA_POTION));
    }
  }

  // Teleport potions — always one in stock
  stock.push(_fixedShopItem(ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION));

  // Home Seeking Scroll — always one in stock
  stock.push(_fixedShopItem(ITEM_TYPES.HOME_SEEKING_SCROLL));

  return stock;
}

/**
 * Creates a shop entry for a fixed item type. Buy price is double the sell price.
 *
 * @param {object} typeDef - An ITEM_TYPES entry.
 * @returns {{item: Item, buyPrice: number}}
 */
function _fixedShopItem(typeDef) {
  return {
    item: new Item(0, 0, typeDef),
    buyPrice: typeDef.sellPrice * 2,
  };
}

/**
 * Generates weapon shop stock. Each weapon has a randomly rolled attack bonus
 * within a tier-appropriate range. A rare weapon with enhanced stats has a
 * small chance of appearing.
 *
 * @param {number} playerLevel
 * @param {object} rng
 * @returns {Array<{item: Item, buyPrice: number}>}
 */
function _generateWeaponStock(playerLevel, rng) {
  const stock = [];
  const count = rng.nextInt(3, 5);
  const isHighLevel = playerLevel >= 3;

  for (let i = 0; i < count; i++) {
    // First slot: chance of a rare item
    const isRare = i === 0 && rng.nextInt(1, 100) <= RARE_CHANCE;
    const useTier2 = isHighLevel || isRare;

    const attackBonus = useTier2 ? rng.nextInt(4, 7) : rng.nextInt(2, 5);
    const baseName = useTier2 ? 'Long Sword' : 'Short Sword';
    const name = isRare ? `Fine ${baseName}` : baseName;

    const typeDef = {
      id: useTier2 ? 'long_sword' : 'sword',
      name,
      description: `+${attackBonus} Attack`,
      textureKey: 'item_weapon',
      type: 'weapon',
      attackBonus,
      sellPrice: attackBonus * 4,
    };

    // Buy price: 8 gold per attack point, plus a premium for rare items
    const buyPrice = attackBonus * 8 + (isRare ? 20 : 0);

    stock.push({ item: new Item(0, 0, typeDef), buyPrice });
  }

  return stock;
}

/**
 * Generates armour shop stock. Each piece has a randomly rolled defense bonus
 * within a tier-appropriate range. A rare piece with enhanced stats has a
 * small chance of appearing.
 *
 * @param {number} playerLevel
 * @param {object} rng
 * @returns {Array<{item: Item, buyPrice: number}>}
 */
function _generateArmourStock(playerLevel, rng) {
  const stock = [];
  const count = rng.nextInt(3, 5);
  const isHighLevel = playerLevel >= 3;

  for (let i = 0; i < count; i++) {
    // First slot: chance of a rare item
    const isRare = i === 0 && rng.nextInt(1, 100) <= RARE_CHANCE;
    const useTier2 = isHighLevel || isRare;

    const defenseBonus = useTier2 ? rng.nextInt(3, 6) : rng.nextInt(1, 4);
    const baseName = useTier2 ? 'Chain Mail' : 'Leather Armor';
    const name = isRare ? `Fine ${baseName}` : baseName;

    const typeDef = {
      id: useTier2 ? 'chain_mail' : 'leather_armor',
      name,
      description: `+${defenseBonus} Defense`,
      textureKey: 'item_armor',
      type: 'armor',
      defenseBonus,
      sellPrice: defenseBonus * 4,
    };

    // Buy price: 7 gold per defense point, plus a premium for rare items
    const buyPrice = defenseBonus * 7 + (isRare ? 20 : 0);

    stock.push({ item: new Item(0, 0, typeDef), buyPrice });
  }

  return stock;
}
