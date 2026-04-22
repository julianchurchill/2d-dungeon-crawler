import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { InventorySystem } from '../../src/systems/InventorySystem.js';
import { ShopSystem } from '../../src/systems/ShopSystem.js';

// --- Given ---

Given('a health potion item type', function () {
  this.itemType = ITEM_TYPES.HEALTH_POTION;
});

Given('a mega potion item type', function () {
  this.itemType = ITEM_TYPES.MEGA_POTION;
});

Given('a teleport potion item type', function () {
  this.itemType = ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION;
});

Given('a short sword item type', function () {
  this.itemType = ITEM_TYPES.SWORD;
});

Given('a player with an empty inventory capped at {int} slot', function (max) {
  this.player = new Player(0, 0);
  this.player.maxInventory = max;
});

Given('a health potion stack of {int} in the player inventory', function (count) {
  const potion = new Item(0, 0, ITEM_TYPES.HEALTH_POTION);
  potion.count = count;
  this.player.inventory.push(potion);
});

// --- When ---

When('the player picks up another health potion', function () {
  const potion = new Item(0, 0, ITEM_TYPES.HEALTH_POTION);
  this.result = InventorySystem.pickUp(this.player, potion);
});

When('the player tries to pick up another health potion', function () {
  const potion = new Item(0, 0, ITEM_TYPES.HEALTH_POTION);
  this.result = InventorySystem.pickUp(this.player, potion);
});

When('the player tries to pick up a short sword', function () {
  const sword = new Item(0, 0, ITEM_TYPES.SWORD);
  this.result = InventorySystem.pickUp(this.player, sword);
});

When('the player uses the stacked health potion', function () {
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player sells one stacked health potion at a potion shop', function () {
  const shop = new ShopSystem('potion');
  shop.sell(this.player, this.player.inventory[0]);
});

// --- Then ---

Then('the item type should be stackable', function () {
  assert.ok(this.itemType.stackable === true,
    `Expected ${this.itemType.name} to be stackable`);
});

Then('the item type should not be stackable', function () {
  assert.ok(!this.itemType.stackable,
    `Expected ${this.itemType.name} to NOT be stackable`);
});

Then('the inventory slot count should be {int}', function (expected) {
  assert.equal(this.player.inventory.length, expected,
    `Expected ${expected} inventory slot(s), got ${this.player.inventory.length}`);
});

Then('the first slot stack count should be {int}', function (expected) {
  const item = this.player.inventory[0];
  assert.ok(item, 'Expected an item in the first inventory slot');
  assert.equal(item.count, expected,
    `Expected stack count ${expected}, got ${item.count}`);
});

Then('the pickup result should indicate success', function () {
  assert.ok(
    typeof this.result === 'string' && !this.result.includes('full'),
    `Expected a success message, got: ${this.result}`,
  );
});

Then('the pickup result should indicate failure', function () {
  assert.ok(
    typeof this.result === 'string' && this.result.includes('full'),
    `Expected a failure message, got: ${this.result}`,
  );
});
