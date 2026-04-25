/**
 * @module ShopNames
 * @description Shared shop display names, keyed by shop type.
 */

/** Maps shop type to display name. */
export const SHOP_NAMES = {
  potion: 'Magic Shop',
  weapon: 'Weapon Shop',
  armour: 'Armour Shop',
};

/**
 * Returns the display name for the given shop type.
 *
 * @param {'potion'|'weapon'|'armour'} type
 * @returns {string}
 */
export function getShopName(type) {
  return SHOP_NAMES[type] ?? type;
}
