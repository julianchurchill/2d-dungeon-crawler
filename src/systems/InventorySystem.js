import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';

/**
 * Pure inventory logic — no Phaser dependencies.
 * Operates on player.inventory array.
 */
export class InventorySystem {
  /**
   * Attempt to pick up an item.
   * @returns {string|null} message or null if failed
   */
  static pickUp(player, item) {
    if (!player.canPickUp()) {
      return 'Your pack is full!';
    }
    player.addItem(item);
    EventBus.emit(GameEvents.INVENTORY_CHANGED, player.inventory);
    return `You pick up the ${item.name}.`;
  }

  /**
   * Use an item from the player's inventory by index.
   * @returns {string} message
   */
  static useItem(player, index) {
    const item = player.inventory[index];
    if (!item) return 'Nothing there.';

    const msg = item.use(player);

    if (item.isConsumable()) {
      player.removeItem(index);
    }

    EventBus.emit(GameEvents.INVENTORY_CHANGED, player.inventory);
    EventBus.emit(GameEvents.PLAYER_STATS_CHANGED, player.stats);
    return msg;
  }

  /**
   * Drop an item from inventory onto the ground.
   * @returns {{ item, message }} dropped item (GameScene should place it on map)
   */
  static dropItem(player, index) {
    const item = player.removeItem(index);
    if (!item) return null;
    item.x = player.x;
    item.y = player.y;
    EventBus.emit(GameEvents.INVENTORY_CHANGED, player.inventory);
    return { item, message: `You drop the ${item.name}.` };
  }
}
