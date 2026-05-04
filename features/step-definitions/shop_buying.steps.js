import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { ShopSystem } from '../../src/systems/ShopSystem.js';
import { generateShopItems } from '../../src/items/ShopInventory.js';
import { createRNG } from '../../src/utils/RNG.js';
import { devOptions } from '../../src/systems/DevOptions.js';

// Shared RNG for deterministic test generation
const TEST_RNG = createRNG(42);

// Reset any dev options touched by these tests after each scenario.
After(function () {
  devOptions.freeShop = false;
});

// ─── Given ────────────────────────────────────────────────────────────────────

Given('the free shop dev option is enabled', function () {
  devOptions.freeShop = true;
});

Given('a weapon shop selling a short sword for {int} gold', function (buyPrice) {
  this.shop = new ShopSystem('weapon');
  this.shopItem = { item: new Item(0, 0, ITEM_TYPES.SWORD), buyPrice };
});

Given('a player with {int} gold', function (gold) {
  this.player = new Player(0, 0);
  this.player.gold = gold;
});

Given('a player with a full inventory and {int} gold', function (gold) {
  this.player = new Player(0, 0);
  this.player.gold = gold;
  // Fill inventory to capacity
  while (this.player.canPickUp()) {
    this.player.inventory.push(new Item(0, 0, ITEM_TYPES.HEALTH_POTION));
  }
});

Given('a weapon shop stock generated for a level 1 player', function () {
  this.shopStock = generateShopItems('weapon', 1, createRNG(42));
});

Given('an armour shop stock generated for a level 1 player', function () {
  this.shopStock = generateShopItems('armour', 1, createRNG(42));
});

Given('a potion shop stock generated for a level 1 player', function () {
  this.shopStock = generateShopItems('potion', 1, createRNG(42));
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('the player buys the short sword from the shop', function () {
  this.result = this.shop.buy(this.player, this.shopItem.item, this.shopItem.buyPrice);
});

When('the player tries to buy the short sword from the shop', function () {
  this.result = this.shop.buy(this.player, this.shopItem.item, this.shopItem.buyPrice);
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('the player should have {int} item in their inventory', function (count) {
  assert.equal(this.player.inventory.length, count,
    `Expected ${count} item(s) in inventory, got ${this.player.inventory.length}`);
});

Then("the player's inventory should be empty", function () {
  assert.equal(this.player.inventory.length, 0,
    `Expected empty inventory, got ${this.player.inventory.length} items`);
});

Then("the player should still have {int} gold", function (gold) {
  assert.equal(this.player.gold, gold,
    `Expected player to still have ${gold} gold, got ${this.player.gold}`);
});

Then("the player's inventory should still be full", function () {
  assert.ok(!this.player.canPickUp(),
    'Expected inventory to still be full');
});

Then('all generated items should be weapons', function () {
  assert.ok(this.shopStock.length > 0, 'Expected shop to have items');
  for (const { item } of this.shopStock) {
    assert.equal(item.itemType, 'weapon',
      `Expected weapon item, got itemType="${item.itemType}" (name="${item.name}")`);
  }
});

Then('all generated items should be armour', function () {
  const ARMOUR_TYPES = ['armor', 'helmet', 'chest', 'legs', 'arms', 'boots', 'ring', 'amulet'];
  assert.ok(this.shopStock.length > 0, 'Expected shop to have items');
  for (const { item } of this.shopStock) {
    assert.ok(ARMOUR_TYPES.includes(item.itemType),
      `Expected armour item, got itemType="${item.itemType}" (name="${item.name}")`);
  }
});

Then('all generated items should be consumables', function () {
  assert.ok(this.shopStock.length > 0, 'Expected shop to have items');
  for (const { item } of this.shopStock) {
    assert.equal(item.itemType, 'consumable',
      `Expected consumable item, got itemType="${item.itemType}" (name="${item.name}")`);
  }
});

Then('every item should have a buy price greater than its sell price', function () {
  assert.ok(this.shopStock.length > 0, 'Expected shop to have items');
  for (const { item, buyPrice } of this.shopStock) {
    assert.ok(buyPrice > item.sellPrice,
      `Expected buyPrice (${buyPrice}) > sellPrice (${item.sellPrice}) for "${item.name}"`);
  }
});

Then('all generated weapons should have a positive attack bonus', function () {
  assert.ok(this.shopStock.length > 0, 'Expected shop to have items');
  for (const { item } of this.shopStock) {
    assert.ok(item.attackBonus > 0,
      `Expected positive attackBonus, got ${item.attackBonus} for "${item.name}"`);
  }
});

Then('all generated armour should have a positive defense bonus', function () {
  assert.ok(this.shopStock.length > 0, 'Expected shop to have items');
  for (const { item } of this.shopStock) {
    assert.ok(item.defenseBonus > 0,
      `Expected positive defenseBonus, got ${item.defenseBonus} for "${item.name}"`);
  }
});

Then('the shop stock should contain at least {int} item', function (minCount) {
  assert.ok(this.shopStock.length >= minCount,
    `Expected at least ${minCount} item(s) in shop stock, got ${this.shopStock.length}`);
});
