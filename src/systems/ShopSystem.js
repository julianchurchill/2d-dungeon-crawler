/**
 * @module ShopSystem
 * Handles item selling at town shops.
 * Each shop instance is typed (potion / weapon / armour) and only accepts
 * the relevant category of items for sale.
 */

/** Maps shop type → the item type categories it accepts. */
export const SHOP_ACCEPTED_TYPES = {
  potion: ['consumable'],
  weapon: ['weapon'],
  armour: ['armor'],
};

export class ShopSystem {
  /**
   * @param {'potion'|'weapon'|'armour'} shopType
   */
  constructor(shopType) {
    this.shopType = shopType;
    this.acceptedItemTypes = SHOP_ACCEPTED_TYPES[shopType] ?? [];
  }

  /**
   * Returns true if this shop will buy the given item.
   * @param {import('../items/Item.js').Item} item
   * @returns {boolean}
   */
  accepts(item) {
    return this.acceptedItemTypes.includes(item.itemType);
  }

  /**
   * Sell an item from the player's inventory at this shop.
   * The item is removed from the inventory and its sell price is added to
   * the player's gold. Returns 0 if the item is not in the inventory or if
   * this shop does not accept the item type.
   * @param {import('../entities/Player.js').Player} player
   * @param {import('../items/Item.js').Item} item
   * @returns {number} Gold received.
   */
  sell(player, item) {
    if (!this.accepts(item)) return 0;
    const idx = player.inventory.indexOf(item);
    if (idx === -1) return 0;
    player.inventory.splice(idx, 1);
    player.gold += item.sellPrice;
    return item.sellPrice;
  }
}
