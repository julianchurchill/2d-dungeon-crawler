/**
 * Step definitions for the additional equipment slots feature.
 *
 * Uses the Cucumber world (this) to avoid conflicts with other step files.
 * Tests Player slot properties, stat aggregation, item→slot assignment,
 * ring double-slot logic, and loot pool floor thresholds.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { getFloorLootPool } from '../../src/items/LootTables.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Creates an Item instance at (0,0) from an ITEM_TYPES definition. */
function makeItem(typeDef) {
  return new Item(0, 0, typeDef);
}

// ── Given ─────────────────────────────────────────────────────────────────────

Given('a new player for slot testing', function () {
  this.slotPlayer = new Player(0, 0);
});

Given('the item loot pool for floor {int}', function (floor) {
  this.lootPool = getFloorLootPool(floor);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('a leather cap is equipped on the slot test player', function () {
  makeItem(ITEM_TYPES.LEATHER_CAP).use(this.slotPlayer);
});

When('a leather chestpiece is equipped on the slot test player', function () {
  makeItem(ITEM_TYPES.LEATHER_CHESTPIECE).use(this.slotPlayer);
});

When('leather leggings are equipped on the slot test player', function () {
  makeItem(ITEM_TYPES.LEATHER_LEGGINGS).use(this.slotPlayer);
});

When('leather gauntlets are equipped on the slot test player', function () {
  makeItem(ITEM_TYPES.LEATHER_GAUNTLETS).use(this.slotPlayer);
});

When('leather boots are equipped on the slot test player', function () {
  makeItem(ITEM_TYPES.LEATHER_BOOTS).use(this.slotPlayer);
});

When('an iron ring is equipped on the slot test player', function () {
  makeItem(ITEM_TYPES.IRON_RING).use(this.slotPlayer);
});

When('a jade amulet is equipped on the slot test player', function () {
  makeItem(ITEM_TYPES.JADE_AMULET).use(this.slotPlayer);
});

When('a stone amulet is equipped on the slot test player', function () {
  makeItem(ITEM_TYPES.STONE_AMULET).use(this.slotPlayer);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the player {word} slot is empty', function (slotKey) {
  const prop = `equipped${slotKey.charAt(0).toUpperCase()}${slotKey.slice(1)}`;
  assert.equal(
    this.slotPlayer[prop], null,
    `Expected ${prop} to be null, got ${this.slotPlayer[prop]}`,
  );
});

Then('the slot test player defence power is {int}', function (expected) {
  assert.equal(
    this.slotPlayer.defensePower, expected,
    `Expected defensePower ${expected}, got ${this.slotPlayer.defensePower}`,
  );
});

Then('the slot test player attack power is {int}', function (expected) {
  assert.equal(
    this.slotPlayer.attackPower, expected,
    `Expected attackPower ${expected}, got ${this.slotPlayer.attackPower}`,
  );
});

Then('the slot test player {word} slot contains {string}', function (slotKey, itemName) {
  const prop = `equipped${slotKey.charAt(0).toUpperCase()}${slotKey.slice(1)}`;
  assert.ok(
    this.slotPlayer[prop] !== null,
    `Expected ${prop} to be occupied, but it was null`,
  );
  assert.equal(
    this.slotPlayer[prop].name, itemName,
    `Expected ${prop} to contain "${itemName}", got "${this.slotPlayer[prop]?.name}"`,
  );
});

Then('{string} is in the item loot pool', function (itemId) {
  const ids = this.lootPool.map(t => t.id);
  assert.ok(
    ids.includes(itemId),
    `Expected "${itemId}" to be in the loot pool but it was not. Pool: ${[...new Set(ids)].join(', ')}`,
  );
});

Then('{string} is not in the item loot pool', function (itemId) {
  const ids = this.lootPool.map(t => t.id);
  assert.ok(
    !ids.includes(itemId),
    `Expected "${itemId}" NOT to be in the loot pool but it was`,
  );
});
