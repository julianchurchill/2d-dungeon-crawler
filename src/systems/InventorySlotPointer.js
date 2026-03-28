/**
 * @module InventorySlotPointer
 * @description Pure helper for inventory slot pointer (click/tap) interactions.
 *
 * On pointer devices the first tap on a slot moves the cursor and shows item
 * stats without consuming the item.  A second tap on the already-selected slot
 * uses the item.  This mirrors the shop panel's click-to-highlight-then-confirm
 * pattern and prevents accidental consumption on mobile.
 *
 * Keeping this logic out of Phaser panels makes it straightforward to test
 * without any rendering dependency.
 */

/**
 * Handles a pointer-down event on an inventory slot.
 *
 * - If the slot is empty (index >= inventoryLength): does nothing, returns null.
 * - If the slot is not the current cursor position: moves the cursor there,
 *   returns 'select' (caller should update description display).
 * - If the slot is already the cursor position: returns 'use' (caller should
 *   emit INVENTORY_USE).
 *
 * @param {import('./InventoryCursor.js').InventoryCursor} cursor
 * @param {number} slotIndex - The flat slot index that was clicked.
 * @param {number} inventoryLength - Number of items currently in the inventory.
 * @returns {'select'|'use'|null}
 */
export function applySlotPointerDown(cursor, slotIndex, inventoryLength) {
  if (slotIndex >= inventoryLength) return null;
  if (cursor.index !== slotIndex) {
    cursor.setIndex(slotIndex);
    return 'select';
  }
  return 'use';
}
