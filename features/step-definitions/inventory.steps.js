import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { InventorySystem } from '../../src/systems/InventorySystem.js';

// --- Given ---

Given('a player with an empty inventory', function () {
  this.player = new Player(0, 0);
});

Given('a player with base attack {int}', function (attack) {
  this.player = new Player(0, 0);
  this.player.stats.attack = attack;
});

Given('a player with base defense {int}', function (defense) {
  this.player = new Player(0, 0);
  this.player.stats.defense = defense;
});

Given('a player with {int} HP out of {int} maximum', function (hp, maxHp) {
  this.player = new Player(0, 0);
  this.player.stats.hp = hp;
  this.player.stats.maxHp = maxHp;
});

Given('a player at full health with {int} HP maximum', function (maxHp) {
  this.player = new Player(0, 0);
  this.player.stats.maxHp = maxHp;
  this.player.stats.hp = maxHp;
});

Given('a player with a full inventory of {int} items', function (count) {
  this.player = new Player(0, 0);
  for (let i = 0; i < count; i++) {
    this.player.addItem(new Item(0, 0, ITEM_TYPES.HEALTH_POTION));
  }
});

Given('a player at position {int}, {int} with a health potion in inventory', function (x, y) {
  this.player = new Player(x, y);
  this.player.addItem(new Item(x, y, ITEM_TYPES.HEALTH_POTION));
});

Given('a health potion on the ground', function () {
  this.groundItem = new Item(0, 0, ITEM_TYPES.HEALTH_POTION);
});

Given('a health potion in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.HEALTH_POTION));
});

Given('a short sword in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.SWORD));
});

Given('leather armor in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.LEATHER_ARMOR));
});

// --- When ---

When('the player picks up the health potion', function () {
  this.result = InventorySystem.pickUp(this.player, this.groundItem);
});

When('the player tries to pick up the health potion', function () {
  this.result = InventorySystem.pickUp(this.player, this.groundItem);
});

When('the player uses the health potion', function () {
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player equips the short sword', function () {
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player equips the leather armor', function () {
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player drops the health potion', function () {
  this.result = InventorySystem.dropItem(this.player, 0);
});

// --- Then ---

Then('the player inventory should contain {int} item', function (count) {
  assert.equal(this.player.inventory.length, count);
});

Then('the inventory should contain a health potion', function () {
  const hasPotion = this.player.inventory.some((i) => i.id === ITEM_TYPES.HEALTH_POTION.id);
  assert.ok(hasPotion, 'Expected inventory to contain a health potion');
});

Then('the player HP should be {int}', function (hp) {
  assert.equal(this.player.stats.hp, hp);
});

Then('the player HP should still be {int}', function (hp) {
  assert.equal(this.player.stats.hp, hp);
});

Then('the health potion should be removed from the inventory', function () {
  const hasPotion = this.player.inventory.some((i) => i.id === ITEM_TYPES.HEALTH_POTION.id);
  assert.ok(!hasPotion, 'Expected health potion to be removed from inventory');
});

Then('the player attack power should be {int}', function (expected) {
  assert.equal(this.player.attackPower, expected);
});

Then('the short sword should be the equipped weapon', function () {
  assert.ok(this.player.equippedWeapon, 'Expected a weapon to be equipped');
  assert.equal(this.player.equippedWeapon.id, ITEM_TYPES.SWORD.id);
});

Then('the player defense power should be {int}', function (expected) {
  assert.equal(this.player.defensePower, expected);
});

Then('the leather armor should be the equipped armor', function () {
  assert.ok(this.player.equippedArmor, 'Expected armor to be equipped');
  assert.equal(this.player.equippedArmor.id, ITEM_TYPES.LEATHER_ARMOR.id);
});

Then('the pickup should fail with message {string}', function (msg) {
  assert.equal(this.result, msg);
  assert.equal(this.player.inventory.length, 20, 'Inventory size should remain at 20');
});

Then('the inventory should be empty', function () {
  assert.equal(this.player.inventory.length, 0);
});

Then('the dropped item should be at position {int}, {int}', function (x, y) {
  assert.ok(this.result.item, 'Expected a dropped item');
  assert.equal(this.result.item.x, x);
  assert.equal(this.result.item.y, y);
});
