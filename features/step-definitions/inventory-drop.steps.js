/**
 * Step definitions for the Drop Items from Inventory feature.
 *
 * Tests the pure InventorySystem.dropItem logic in isolation.
 * The title hint scenarios reuse steps from inventory-close-button.steps.js.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { InventorySystem } from '../../src/systems/InventorySystem.js';
import { Player } from '../../src/entities/Player.js';
import { SkillSystem } from '../../src/systems/SkillSystem.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';

Given('a player carrying a {string} in inventory slot 0', function (itemId) {
  const typeDef = Object.values(ITEM_TYPES).find(t => t.id === itemId);
  assert.ok(typeDef, `Unknown item id: ${itemId}`);
  this.player = {
    x: 3, y: 5,
    inventory: [new Item(0, 0, typeDef)],
    removeItem(index) {
      const item = this.inventory[index] ?? null;
      if (item) this.inventory.splice(index, 1);
      return item;
    },
  };
});

Given('a player with no items in their inventory', function () {
  this.player = {
    x: 2, y: 4,
    inventory: [],
    removeItem(_index) { return null; },
  };
});

When('the player drops the item at inventory index {int}', function (index) {
  this.dropResult = InventorySystem.dropItem(this.player, index);
});

Then("the player's inventory should be empty after dropping", function () {
  assert.equal(this.player.inventory.length, 0);
});

Then('the dropped result should have item id {string}', function (id) {
  assert.ok(this.dropResult, 'Expected a non-null drop result');
  assert.equal(this.dropResult.item.id, id);
});

Then('the dropped item position should match the player position', function () {
  assert.equal(this.dropResult.item.x, this.player.x);
  assert.equal(this.dropResult.item.y, this.player.y);
});

Then('the dropped result should be null', function () {
  assert.equal(this.dropResult, null);
});

// ── Dropping equipped items ───────────────────────────────────────────────────

Given('a player with a sword equipped at inventory index 0', function () {
  this.player = new Player(0, 0, new SkillSystem(null, [], []));
  const sword = new Item(0, 0, ITEM_TYPES.SWORD);
  this.player.addItem(sword);
  this.player.equippedWeapon = sword;
});

Given('a player with a leather shield equipped at inventory index 0', function () {
  this.player = new Player(0, 0, new SkillSystem(null, [], []));
  const shield = new Item(0, 0, ITEM_TYPES.LEATHER_ARMOR);
  this.player.addItem(shield);
  this.player.equippedArmor = shield;
});

Given('the player has a sword equipped', function () {
  this.player.equippedWeapon = new Item(0, 0, ITEM_TYPES.SWORD);
});

Then("the player's equipped weapon slot should be empty", function () {
  assert.equal(this.player.equippedWeapon, null,
    'Expected equippedWeapon to be null after dropping');
});

Then("the player's equipped armour slot should be empty", function () {
  assert.equal(this.player.equippedArmor, null,
    'Expected equippedArmor to be null after dropping');
});

Then("the player's equipped weapon slot should not be empty", function () {
  assert.notEqual(this.player.equippedWeapon, null,
    'Expected equippedWeapon to still be set');
});
