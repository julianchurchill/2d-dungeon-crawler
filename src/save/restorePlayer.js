/**
 * Restores a player's inventory and equipment from save data.
 *
 * Equipment slots are assigned references from the reconstructed inventory so
 * that identity checks (e.g. Player.isEquipped) work correctly after loading.
 *
 * @module restorePlayer
 */
import { Item } from '../items/Item.js';
import { ITEM_TYPES } from '../items/ItemTypes.js';

/** @param {string} id - Item type id */
const findTypeDef = id => Object.values(ITEM_TYPES).find(t => t.id === id);

/**
 * Rebuilds inventory items and equipment slot references from plain save data.
 *
 * @param {object} player - Live player object whose fields will be mutated.
 * @param {object} savedPlayer - The `player` sub-object from a save data record.
 */
export function restoreInventoryAndEquipment(player, savedPlayer) {
  player.inventory = savedPlayer.inventory
    .map(({ id, count }) => {
      const typeDef = findTypeDef(id);
      if (!typeDef) return null;
      const item = new Item(0, 0, typeDef);
      item.count = count;
      return item;
    })
    .filter(Boolean);

  // Claim inventory items by index so equipment slots share the same references.
  // Tracking claimed indices handles duplicate item types (e.g. two iron rings).
  const claimed = new Set();
  const makeEquipped = id => {
    if (!id) return null;
    const idx = player.inventory.findIndex((item, j) => item.id === id && !claimed.has(j));
    if (idx !== -1) {
      claimed.add(idx);
      return player.inventory[idx];
    }
    const typeDef = findTypeDef(id);
    return typeDef ? new Item(0, 0, typeDef) : null;
  };

  const eq = savedPlayer.equipped;
  player.equippedWeapon       = makeEquipped(eq.weapon);
  player.equippedRangedWeapon = makeEquipped(eq.rangedWeapon);
  player.equippedArmor        = makeEquipped(eq.armor);
  player.equippedHelmet       = makeEquipped(eq.helmet);
  player.equippedChest        = makeEquipped(eq.chest);
  player.equippedLegs         = makeEquipped(eq.legs);
  player.equippedArms         = makeEquipped(eq.arms);
  player.equippedBoots        = makeEquipped(eq.boots);
  player.equippedRing1        = makeEquipped(eq.ring1);
  player.equippedRing2        = makeEquipped(eq.ring2);
  player.equippedAmulet       = makeEquipped(eq.amulet);
}
