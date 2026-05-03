/**
 * Step definitions for the Pick Axe feature.
 * Reuses player-movement world context (this.player, this.map, this.result).
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { ITEM_TYPES, getPickAxeFloorDrop } from '../../src/items/ItemTypes.js';
import { Item } from '../../src/items/Item.js';
import { TILE } from '../../src/utils/TileTypes.js';
import { getTileLabel } from '../../src/utils/TileLabelMap.js';
import { DungeonMap } from '../../src/dungeon/DungeonMap.js';

// ── Item definition ───────────────────────────────────────────────────────────

Given('the pick axe item type', function () {
  this.itemType = ITEM_TYPES.PICK_AXE;
});

Then('it is a weapon', function () {
  assert.equal(this.itemType.type, 'weapon',
    `Expected type to be 'weapon' but got '${this.itemType.type}'`);
});

Then('it has the canBreakWalls property', function () {
  assert.ok(this.itemType.canBreakWalls === true,
    'Expected canBreakWalls to be true');
});

Then('its attack bonus is at most {int}', function (max) {
  assert.ok(this.itemType.attackBonus <= max,
    `Expected attackBonus ≤ ${max} but got ${this.itemType.attackBonus}`);
});

// ── BREAKABLE_WALL tile ───────────────────────────────────────────────────────

Then('the BREAKABLE_WALL tile value is defined', function () {
  assert.ok(TILE.BREAKABLE_WALL !== undefined,
    'Expected TILE.BREAKABLE_WALL to be defined');
});

Given('a dungeon map with a BREAKABLE_WALL tile at position {int} {int}', function (x, y) {
  this.map = new DungeonMap(20, 20);
  this.map.setTile(x, y, TILE.BREAKABLE_WALL);
});

Then('the tile at {int} {int} is not walkable', function (x, y) {
  assert.ok(!this.map.isWalkable(x, y),
    `Expected tile at (${x},${y}) to not be walkable`);
});

Then('the tile at {int} {int} is opaque', function (x, y) {
  assert.ok(this.map.isOpaque(x, y),
    `Expected tile at (${x},${y}) to be opaque`);
});

Then('the look label for BREAKABLE_WALL is {string}', function (expected) {
  assert.equal(getTileLabel(TILE.BREAKABLE_WALL), expected,
    `Expected look label '${expected}' but got '${getTileLabel(TILE.BREAKABLE_WALL)}'`);
});

// ── Wall breaking ─────────────────────────────────────────────────────────────

Given('a BREAKABLE_WALL at position {int}, {int}', function (x, y) {
  this.map.setTile(x, y, TILE.BREAKABLE_WALL);
});

Given('a pick axe is equipped', function () {
  this.player.equippedWeapon = new Item(0, 0, ITEM_TYPES.PICK_AXE);
});

// ── Shop price ────────────────────────────────────────────────────────────────

Then('the pick axe buy price should be {int}', function (expected) {
  const entry = this.shopStock.find(({ item }) => item.id === 'pick_axe');
  assert.ok(entry, 'Expected pick axe to be in the weapon shop stock');
  assert.equal(entry.buyPrice, expected,
    `Expected pick axe buy price to be ${expected} but got ${entry.buyPrice}`);
});

// ── Rare floor drop ───────────────────────────────────────────────────────────

When('the pick axe floor drop is rolled with an always-trigger RNG', function () {
  this.dropResult = getPickAxeFloorDrop({ nextBool: () => true });
});

When('the pick axe floor drop is rolled with a never-trigger RNG', function () {
  this.dropResult = getPickAxeFloorDrop({ nextBool: () => false });
});

Then('the drop result should be the pick axe', function () {
  assert.equal(this.dropResult, ITEM_TYPES.PICK_AXE,
    'Expected drop result to be ITEM_TYPES.PICK_AXE');
});

Then('the drop result should be null', function () {
  assert.equal(this.dropResult, null, 'Expected drop result to be null');
});
