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
   * Buy an item from the shop, deducting the buy price from the player's gold
   * and adding the item to their inventory.
   * Returns false if the player cannot afford it or their inventory is full.
   *
   * @param {import('../entities/Player.js').Player} player
   * @param {import('../items/Item.js').Item} item - The item to purchase.
   * @param {number} buyPrice - The gold cost to buy this item.
   * @returns {boolean} True if the purchase succeeded.
   */
  buy(player, item, buyPrice) {
    if (player.gold < buyPrice) return false;
    if (!player.canPickUp()) return false;
    player.gold -= buyPrice;
    player.addItem(item);
    return true;
  }

  /**
   * Returns the price at which this shop will re-sell an item the player sold
   * to it: the item's sell price rounded up to the nearest gold after a 10%
   * mark-up.
   *
   * @param {import('../items/Item.js').Item} item
   * @returns {number} Buy-back price in gold.
   */
  buyBackPrice(item) {
    return Math.ceil(item.sellPrice * 1.1);
  }

  /**
   * Creates a shop stock entry for an item that the player has sold, priced at
   * the buy-back rate. The entry has the same shape as regular shop stock so it
   * can be pushed directly onto a shop's stock array.
   *
   * @param {import('../items/Item.js').Item} item
   * @returns {{ item: import('../items/Item.js').Item, buyPrice: number }}
   */
  createBuyBackEntry(item) {
    return { item, buyPrice: this.buyBackPrice(item) };
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
