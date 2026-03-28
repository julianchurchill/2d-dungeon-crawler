/**
 * Step definitions for inventory-slot-pointer feature.
 *
 * Tests the pure `applySlotPointerDown` helper using a real InventoryCursor
 * so that cursor state transitions can be verified without Phaser.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { InventoryCursor } from '../../src/systems/InventoryCursor.js';
import { applySlotPointerDown } from '../../src/systems/InventorySlotPointer.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('an inventory cursor at slot {int} with {int} items', function (slot, itemCount) {
  this.cursor = new InventoryCursor(4, 5);
  this.cursor.setIndex(slot);
  this.inventoryLength = itemCount;
});

// ── When ──────────────────────────────────────────────────────────────────────

When('slot {int} is pointer-pressed', function (slotIndex) {
  this.pointerAction = applySlotPointerDown(this.cursor, slotIndex, this.inventoryLength);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the pointer action should be {string}', function (expected) {
  assert.equal(this.pointerAction, expected);
});

Then('no pointer action should occur', function () {
  assert.equal(this.pointerAction, null);
});

Then('the cursor should be at slot {int}', function (expected) {
  assert.equal(this.cursor.index, expected);
});

Then('the cursor should still be at slot {int}', function (expected) {
  assert.equal(this.cursor.index, expected);
});
