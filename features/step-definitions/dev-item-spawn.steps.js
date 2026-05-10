/**
 * Step definitions for the Developer forced floor item spawn feature.
 */
import { When, Then, defineStep } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { devOptions } from '../../src/systems/DevOptions.js';
import { RARE_FLOOR_DROP_ITEMS, getPickAxeFloorDrop } from '../../src/items/LootTables.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';

// ── State helpers ─────────────────────────────────────────────────────────────

defineStep('the dev forced floor item {string} is enabled', function (key) {
  devOptions.forcedFloorItems.add(key);
});

When('the dev forced floor item {string} is disabled', function (key) {
  devOptions.forcedFloorItems.delete(key);
});

// ── Assertions on devOptions.forcedFloorItems ─────────────────────────────────

Then('the dev forced floor items should be empty', function () {
  assert.equal(devOptions.forcedFloorItems.size, 0);
});

Then('{string} should be a forced floor item', function (key) {
  assert.ok(devOptions.forcedFloorItems.has(key), `Expected "${key}" to be in forcedFloorItems`);
});

Then('{string} should not be a forced floor item', function (key) {
  assert.ok(!devOptions.forcedFloorItems.has(key), `Expected "${key}" not to be in forcedFloorItems`);
});

// ── RARE_FLOOR_DROP_ITEMS registry ────────────────────────────────────────────

Then('{string} should be in the rare floor drop items list', function (key) {
  const found = RARE_FLOOR_DROP_ITEMS.some(entry => entry.key === key);
  assert.ok(found, `Expected "${key}" to be registered in RARE_FLOOR_DROP_ITEMS`);
});

// ── getPickAxeFloorDrop with forced flag ──────────────────────────────────────

When('getPickAxeFloorDrop is called with an always-false RNG and forced {word}', function (forcedStr) {
  const rng = { nextBool: () => false };
  this.pickAxeDropResult = getPickAxeFloorDrop(rng, forcedStr === 'true');
});

When('getPickAxeFloorDrop is called with an always-true RNG and forced {word}', function (forcedStr) {
  const rng = { nextBool: () => true };
  this.pickAxeDropResult = getPickAxeFloorDrop(rng, forcedStr === 'true');
});

Then('the pick axe floor drop result should be ITEM_TYPES.PICK_AXE', function () {
  assert.equal(this.pickAxeDropResult, ITEM_TYPES.PICK_AXE);
});

Then('the pick axe floor drop result should be null', function () {
  assert.equal(this.pickAxeDropResult, null);
});
