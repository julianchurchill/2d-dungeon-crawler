/**
 * Step definitions for the shop sell-back feature.
 * Tests the pure ShopSystem methods that calculate buy-back prices and
 * create buy-back stock entries — no Phaser required.
 *
 * "a potion shop" / "a weapon shop" / "an armour shop" Given steps are
 * defined in shop.steps.js and set this.shop on the World object.
 */
import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';

// ── When ─────────────────────────────────────────────────────────────────────

When('a buy-back entry is created for a short sword', function () {
  const item = new Item(0, 0, ITEM_TYPES.SWORD);
  this.buyBackEntry = this.shop.createBuyBackEntry(item);
});

// ── Then ─────────────────────────────────────────────────────────────────────

Then('the buy-back price of a health potion should be {int} gold', function (expected) {
  const item = new Item(0, 0, ITEM_TYPES.HEALTH_POTION);
  assert.strictEqual(this.shop.buyBackPrice(item), expected);
});

Then('the buy-back price of a short sword should be {int} gold', function (expected) {
  const item = new Item(0, 0, ITEM_TYPES.SWORD);
  assert.strictEqual(this.shop.buyBackPrice(item), expected);
});

Then('the buy-back price of leather armor should be {int} gold', function (expected) {
  const item = new Item(0, 0, ITEM_TYPES.LEATHER_ARMOR);
  assert.strictEqual(this.shop.buyBackPrice(item), expected);
});

Then('the buy-back price of a mega potion should be {int} gold', function (expected) {
  const item = new Item(0, 0, ITEM_TYPES.MEGA_POTION);
  assert.strictEqual(this.shop.buyBackPrice(item), expected);
});

Then('the buy-back entry should contain the short sword', function () {
  assert.ok(this.buyBackEntry, 'Expected a buy-back entry to exist');
  assert.strictEqual(this.buyBackEntry.item.name, ITEM_TYPES.SWORD.name);
});

Then('the buy-back entry price should be {int} gold', function (expected) {
  assert.ok(this.buyBackEntry, 'Expected a buy-back entry to exist');
  assert.strictEqual(this.buyBackEntry.buyPrice, expected);
});

Then('the shop should accept the buy-back item', function () {
  assert.ok(this.buyBackEntry, 'Expected a buy-back entry to exist');
  assert.ok(this.shop.accepts(this.buyBackEntry.item), 'Expected shop to accept the buy-back item');
});
