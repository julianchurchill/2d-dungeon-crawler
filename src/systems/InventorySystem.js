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
    if (!player.canPickUp(item)) {
      return 'Your pack is full!';
    }
    player.addItem(item);
    EventBus.emit(GameEvents.INVENTORY_CHANGED, player.inventory);
    return `You pick up the ${item.name}.`;
  }

  /**
   * Use an item from the player's inventory by index.
   * @param {object} player
   * @param {number} index
   * @param {object} [context] - Optional world-access context forwarded to
   *   `item.use()`.  Required for items with effects that need map or RNG
   *   access (e.g. `teleport_near`).
   * @returns {string} message
   */
  static useItem(player, index, context = {}) {
    const item = player.inventory[index];
    if (!item) return 'Nothing there.';

    const msg = item.use(player, context);

    if (item.isConsumable()) {
      player.removeItem(index);
    }

    EventBus.emit(GameEvents.INVENTORY_CHANGED, player.inventory);
    // Emit effective stats (including equipment bonuses) so listeners display
    // the correct ATK/DEF values rather than bare base stats.
    EventBus.emit(GameEvents.PLAYER_STATS_CHANGED, {
      ...player.stats,
      attack: player.attackPower,
      defense: player.defensePower,
    });
    return msg;
  }

  /**
   * Drop an item from inventory onto the ground.
   * @returns {{ item, message }} dropped item (GameScene should place it on map)
   */
  static dropItem(player, index) {
    const item = player.inventory[index];
    if (!item) return null;

    // Unequip first so stat bonuses are removed before the item leaves.
    const equippedSlot = player.isEquipped?.(item);
    if (equippedSlot) {
      player[equippedSlot] = null;
      EventBus.emit(GameEvents.PLAYER_STATS_CHANGED, {
        ...player.stats,
        attack: player.attackPower,
        defense: player.defensePower,
      });
    }

    // Use the return value of removeItem: for stackable stacks it is a clone
    // (with count=1), not the original slot object that remains in inventory.
    const dropped = player.removeItem(index);
    dropped.x = player.x;
    dropped.y = player.y;
    EventBus.emit(GameEvents.INVENTORY_CHANGED, player.inventory);
    return { item: dropped, message: `You drop the ${dropped.name}.` };
  }
}
