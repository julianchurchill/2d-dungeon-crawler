/**
 * ShopEventHandler — shop and display-case event handling for GameScene.
 *
 * Encapsulates the four shop/display-case event handlers previously
 * living in GameScene: buying and selling items at shops, and storing
 * or retrieving items from the player's display case.
 */

import { ShopSystem }        from './ShopSystem.js';
import { EventBus }          from '../utils/EventBus.js';
import { GameEvents }        from '../events/GameEvents.js';
import { devOptions }        from './DevOptions.js';
import {
  recordGlobalGoldSpent,
  recordGlobalGoldGained,
} from '../save/GlobalStatsStore.js';

export class ShopEventHandler {
  /**
   * @param {import('../scenes/GameScene.js').GameScene} scene
   */
  constructor(scene) {
    /** @private */
    this._scene = scene;
  }

  // ── Public methods ────────────────────────────────────────────────────────

  /**
   * Handles a BUY_ITEM event: validates stock, deducts gold, removes the
   * item from the shop's persistent stock, and notifies the player.
   *
   * @param {string} shopType
   * @param {{ item: object, buyPrice: number }} shopItem
   */
  handleBuyItem(shopType, shopItem) {
    if (!shopItem || !shopItem.item) return;
    const sc = this._scene;
    const shop = sc.shops.find(s => s.type === shopType && s.stock.includes(shopItem));
    if (!shop) return;

    const system = new ShopSystem(shopType);
    const success = system.buy(sc.player, shopItem.item, shopItem.buyPrice);
    if (!success) {
      if (!devOptions.freeShop && sc.player.gold < shopItem.buyPrice) {
        EventBus.emit(GameEvents.MESSAGE, `You can't afford the ${shopItem.item.name} (${shopItem.buyPrice}g needed).`);
      } else {
        EventBus.emit(GameEvents.MESSAGE, 'Your inventory is full!');
      }
      return;
    }

    if (!devOptions.freeShop) {
      sc.player.recordGoldSpent(shopItem.buyPrice);
      recordGlobalGoldSpent(shopItem.buyPrice);
    }

    // Remove the purchased item from the shop's persistent stock.
    const idx = shop.stock.indexOf(shopItem);
    if (idx !== -1) shop.stock.splice(idx, 1);

    EventBus.emit(GameEvents.MESSAGE, `Bought ${shopItem.item.name} for ${shopItem.buyPrice} gold.`);
    EventBus.emit(GameEvents.PLAYER_GOLD_CHANGED, sc.player.gold);
    EventBus.emit(GameEvents.INVENTORY_CHANGED, [...sc.player.inventory]);
    sc._syncRegistry();
  }

  /**
   * Handles a SELL_ITEM event: sells the item, credits gold, and pushes a
   * buy-back entry onto the active shop's stock.
   *
   * @param {string} shopType
   * @param {object} item
   */
  handleSellItem(shopType, item) {
    const sc = this._scene;
    // Guard against rapid double-clicks: item may already be gone from inventory.
    if (!sc.player.inventory.includes(item)) return;
    const system = new ShopSystem(shopType);
    const earned = system.sell(sc.player, item);
    if (earned > 0) {
      sc.player.recordGoldGained(earned);
      recordGlobalGoldGained(earned);
      if (sc._activeShop) {
        // For stackable items the stack object is still in inventory (count
        // decremented), so clone it to avoid aliasing the live slot.
        const buyBackItem = item.stackable ? item._cloneOne() : item;
        sc._activeShop.stock.push(system.createBuyBackEntry(buyBackItem));
      }
    }
    EventBus.emit(GameEvents.MESSAGE, `Sold ${item.name} for ${earned} gold.`);
    EventBus.emit(GameEvents.PLAYER_GOLD_CHANGED, sc.player.gold);
    EventBus.emit(GameEvents.INVENTORY_CHANGED, [...sc.player.inventory]);
    sc._syncRegistry();
  }

  /**
   * Handles a STORE_ITEM event: moves the item at `index` from the player's
   * inventory into the display case.
   *
   * @param {number} index
   */
  handleStoreItem(index) {
    const sc = this._scene;
    const item = sc.player.inventory[index];
    if (!item) return;
    const stored = sc.player.displayCase.store(item);
    if (!stored) {
      EventBus.emit(GameEvents.MESSAGE, `${item.name} cannot be stored in the display case.`);
      return;
    }
    sc.player.removeItem(index);
    EventBus.emit(GameEvents.MESSAGE, `You place the ${item.name} in the display case.`);
    EventBus.emit(GameEvents.DISPLAY_CASE_CHANGED, {
      displayCase: sc.player.displayCase,
      inventory: sc.player.inventory,
    });
    EventBus.emit(GameEvents.INVENTORY_CHANGED, [...sc.player.inventory]);
  }

  /**
   * Handles a RETRIEVE_ITEM event: moves the item at `index` from the
   * display case back into the player's inventory.
   *
   * @param {number} index
   */
  handleRetrieveItem(index) {
    const sc = this._scene;
    if (!sc.player.canPickUp()) {
      EventBus.emit(GameEvents.MESSAGE, 'Your pack is full!');
      return;
    }
    const item = sc.player.displayCase.retrieve(index);
    if (!item) return;
    sc.player.addItem(item);
    EventBus.emit(GameEvents.MESSAGE, `You take the ${item.name} from the display case.`);
    EventBus.emit(GameEvents.DISPLAY_CASE_CHANGED, {
      displayCase: sc.player.displayCase,
      inventory: sc.player.inventory,
    });
    EventBus.emit(GameEvents.INVENTORY_CHANGED, [...sc.player.inventory]);
  }
}
