import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { ShopSystem } from '../../src/systems/ShopSystem.js';

// --- Given ---

Given('a player with a health potion in their inventory', function () {
  this.player = new Player(0, 0);
  this.healthPotion = new Item(0, 0, ITEM_TYPES.HEALTH_POTION);
  this.player.inventory.push(this.healthPotion);
});

Given('a player with a short sword in their inventory', function () {
  this.player = new Player(0, 0);
  this.shortSword = new Item(0, 0, ITEM_TYPES.SWORD);
  this.player.inventory.push(this.shortSword);
});

Given('the player also has a mega potion in their inventory', function () {
  this.megaPotion = new Item(0, 0, ITEM_TYPES.MEGA_POTION);
  this.player.inventory.push(this.megaPotion);
});

Given('a potion shop', function () {
  this.shop = new ShopSystem('potion');
});

Given('a weapon shop', function () {
  this.shop = new ShopSystem('weapon');
});

Given('an armour shop', function () {
  this.shop = new ShopSystem('armour');
});

// --- When ---

When('the player sells the health potion at the potion shop', function () {
  const shop = new ShopSystem('potion');
  shop.sell(this.player, this.healthPotion);
});

When('the player sells the short sword at the weapon shop', function () {
  const shop = new ShopSystem('weapon');
  shop.sell(this.player, this.shortSword);
});

When('the player sells the mega potion at the potion shop', function () {
  const shop = new ShopSystem('potion');
  shop.sell(this.player, this.megaPotion);
});

// --- Then ---

Then('the player should have {int} gold', function (expected) {
  assert.equal(this.player.gold, expected,
    `Expected player to have ${expected} gold, got ${this.player.gold}`);
});

Then("the player's shop inventory should be empty", function () {
  assert.equal(this.player.inventory.length, 0,
    `Expected inventory to be empty, got ${this.player.inventory.length} items`);
});

Then('the health potion sell price should be {int}', function (expected) {
  assert.equal(ITEM_TYPES.HEALTH_POTION.sellPrice, expected,
    `Expected health potion sell price ${expected}, got ${ITEM_TYPES.HEALTH_POTION.sellPrice}`);
});

Then('the mega potion sell price should be {int}', function (expected) {
  assert.equal(ITEM_TYPES.MEGA_POTION.sellPrice, expected);
});

Then('the short sword sell price should be {int}', function (expected) {
  assert.equal(ITEM_TYPES.SWORD.sellPrice, expected);
});

Then('the long sword sell price should be {int}', function (expected) {
  assert.equal(ITEM_TYPES.LONG_SWORD.sellPrice, expected);
});

Then('the leather armor sell price should be {int}', function (expected) {
  assert.equal(ITEM_TYPES.LEATHER_ARMOR.sellPrice, expected);
});

Then('the chain mail sell price should be {int}', function (expected) {
  assert.equal(ITEM_TYPES.CHAIN_MAIL.sellPrice, expected);
});

Then('the teleport potion sell price should be {int}', function (expected) {
  assert.equal(ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION.sellPrice, expected);
});

Then('the shop accepts the health potion', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.HEALTH_POTION)),
    'Expected shop to accept health potion');
});

Then('the shop accepts the mega potion', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.MEGA_POTION)),
    'Expected shop to accept mega potion');
});

Then('the shop accepts the teleport potion', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION)),
    'Expected shop to accept teleport potion');
});

Then('the shop accepts the short sword', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.SWORD)),
    'Expected shop to accept short sword');
});

Then('the shop accepts the long sword', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.LONG_SWORD)),
    'Expected shop to accept long sword');
});

Then('the shop accepts leather armor', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.LEATHER_ARMOR)),
    'Expected shop to accept leather armor');
});

Then('the shop accepts chain mail', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.CHAIN_MAIL)),
    'Expected shop to accept chain mail');
});

Then('the shop accepts leather boots', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.LEATHER_BOOTS)),
    'Expected shop to accept leather boots');
});

Then('the shop accepts leather cap', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.LEATHER_CAP)),
    'Expected shop to accept leather cap');
});

Then('the shop accepts leather chestpiece', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.LEATHER_CHESTPIECE)),
    'Expected shop to accept leather chestpiece');
});

Then('the shop accepts leather leggings', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.LEATHER_LEGGINGS)),
    'Expected shop to accept leather leggings');
});

Then('the shop accepts leather gauntlets', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.LEATHER_GAUNTLETS)),
    'Expected shop to accept leather gauntlets');
});

Then('the shop accepts iron ring', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.IRON_RING)),
    'Expected shop to accept iron ring');
});

Then('the shop accepts stone amulet', function () {
  assert.ok(this.shop.accepts(new Item(0, 0, ITEM_TYPES.STONE_AMULET)),
    'Expected shop to accept stone amulet');
});

Then('the shop does not accept the short sword', function () {
  assert.ok(!this.shop.accepts(new Item(0, 0, ITEM_TYPES.SWORD)),
    'Expected shop NOT to accept short sword');
});

Then('the shop does not accept leather armor', function () {
  assert.ok(!this.shop.accepts(new Item(0, 0, ITEM_TYPES.LEATHER_ARMOR)),
    'Expected shop NOT to accept leather armor');
});

Then('the shop does not accept the health potion', function () {
  assert.ok(!this.shop.accepts(new Item(0, 0, ITEM_TYPES.HEALTH_POTION)),
    'Expected shop NOT to accept health potion');
});
