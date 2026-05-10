import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { InventorySystem } from '../../src/systems/InventorySystem.js';
import { EventBus } from '../../src/utils/EventBus.js';
import { GameEvents } from '../../src/events/GameEvents.js';

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
    // Use a non-stackable item so each occupies a separate slot, filling the inventory.
    this.player.addItem(new Item(0, 0, ITEM_TYPES.SWORD));
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

Given('a leather cap in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.LEATHER_CAP));
});

Given('a leather chestpiece in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.LEATHER_CHESTPIECE));
});

Given('leather leggings in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.LEATHER_LEGGINGS));
});

Given('leather gauntlets in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.LEATHER_GAUNTLETS));
});

Given('leather boots in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.LEATHER_BOOTS));
});

Given('an iron ring in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.IRON_RING));
});

Given('an iron ring already equipped in slot 1', function () {
  this.player.equippedRing1 = new Item(0, 0, ITEM_TYPES.IRON_RING);
});

Given('a stone amulet in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.STONE_AMULET));
});

Given('a home seeking scroll in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.HOME_SEEKING_SCROLL));
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
  this.emittedStats = null;
  EventBus.once(GameEvents.PLAYER_STATS_CHANGED, (stats) => { this.emittedStats = stats; });
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player equips the leather armor', function () {
  this.emittedStats = null;
  EventBus.once(GameEvents.PLAYER_STATS_CHANGED, (stats) => { this.emittedStats = stats; });
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player drops the health potion', function () {
  this.result = InventorySystem.dropItem(this.player, 0);
});

When('the player equips the leather cap', function () {
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player equips the leather chestpiece', function () {
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player equips the leather leggings', function () {
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player equips the leather gauntlets', function () {
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player equips the leather boots', function () {
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player equips the iron ring', function () {
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player equips the stone amulet', function () {
  this.result = InventorySystem.useItem(this.player, 0);
});

When('the player uses the home seeking scroll', function () {
  this.result = InventorySystem.useItem(this.player, 0);
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

Given('the Health Potion item type', function () {
  this.itemType = ITEM_TYPES.HEALTH_POTION;
});

Then('the item shortName should be defined', function () {
  assert.ok(this.itemType.shortName !== undefined,
    `Expected shortName to be defined on ${this.itemType.name}`);
});

Then('the item shortName should be shorter than the full name', function () {
  assert.ok(this.itemType.shortName.length < this.itemType.name.length,
    `Expected shortName "${this.itemType.shortName}" to be shorter than name "${this.itemType.name}"`);
});

Then('the item shortName should not be defined', function () {
  assert.strictEqual(this.itemType.shortName, undefined,
    `Expected shortName to be undefined on ${this.itemType.name}`);
});

Then('the PLAYER_STATS_CHANGED event should carry attack {int}', function (expected) {
  assert.ok(this.emittedStats, 'Expected PLAYER_STATS_CHANGED to have been emitted');
  assert.equal(this.emittedStats.attack, expected);
});

Then('the PLAYER_STATS_CHANGED event should carry defense {int}', function (expected) {
  assert.ok(this.emittedStats, 'Expected PLAYER_STATS_CHANGED to have been emitted');
  assert.equal(this.emittedStats.defense, expected);
});

Then('the leather cap should be the equipped helmet', function () {
  assert.ok(this.player.equippedHelmet, 'Expected a helmet to be equipped');
  assert.equal(this.player.equippedHelmet.id, ITEM_TYPES.LEATHER_CAP.id);
});

Then('the leather chestpiece should be the equipped chest', function () {
  assert.ok(this.player.equippedChest, 'Expected a chestpiece to be equipped');
  assert.equal(this.player.equippedChest.id, ITEM_TYPES.LEATHER_CHESTPIECE.id);
});

Then('the leather leggings should be the equipped legs', function () {
  assert.ok(this.player.equippedLegs, 'Expected leggings to be equipped');
  assert.equal(this.player.equippedLegs.id, ITEM_TYPES.LEATHER_LEGGINGS.id);
});

Then('the leather gauntlets should be the equipped arms', function () {
  assert.ok(this.player.equippedArms, 'Expected gauntlets to be equipped');
  assert.equal(this.player.equippedArms.id, ITEM_TYPES.LEATHER_GAUNTLETS.id);
});

Then('the leather boots should be the equipped boots', function () {
  assert.ok(this.player.equippedBoots, 'Expected boots to be equipped');
  assert.equal(this.player.equippedBoots.id, ITEM_TYPES.LEATHER_BOOTS.id);
});

Then('the iron ring should be in ring slot 1', function () {
  assert.ok(this.player.equippedRing1, 'Expected ring slot 1 to be filled');
  assert.equal(this.player.equippedRing1.id, ITEM_TYPES.IRON_RING.id);
});

Then('the iron ring should be in ring slot 2', function () {
  assert.ok(this.player.equippedRing2, 'Expected ring slot 2 to be filled');
  assert.equal(this.player.equippedRing2.id, ITEM_TYPES.IRON_RING.id);
});

Then('the stone amulet should be the equipped amulet', function () {
  assert.ok(this.player.equippedAmulet, 'Expected an amulet to be equipped');
  assert.equal(this.player.equippedAmulet.id, ITEM_TYPES.STONE_AMULET.id);
});

Then('the use result should mention returning to town', function () {
  assert.ok(this.result && this.result.includes('town'),
    `Expected result to mention "town", got: ${this.result}`);
});
