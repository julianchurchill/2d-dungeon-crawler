/**
 * Step definitions for the Home Seeking Scroll feature.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { TILE } from '../../src/utils/TileTypes.js';
import { DungeonMap } from '../../src/dungeon/DungeonMap.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { getFloorLootPool } from '../../src/items/LootTables.js';
import { generateShopItems } from '../../src/items/ShopInventory.js';
import { getShopName } from '../../src/ui/ShopNames.js';
import { DungeonSnapshot } from '../../src/dungeon/DungeonSnapshot.js';
import { createRNG } from '../../src/utils/RNG.js';
import { Item } from '../../src/items/Item.js';

const TEST_RNG = createRNG(42);

// ── Item definition ──────────────────────────────────────────────────────────

Given('the Home Seeking Scroll item type', function () {
  this.itemType = ITEM_TYPES.HOME_SEEKING_SCROLL;
});

Then('it has a teleport_to_town effect', function () {
  assert.equal(this.itemType.effect?.type, 'teleport_to_town',
    `Expected effect type 'teleport_to_town' but got '${this.itemType.effect?.type}'`);
});

Then('its sell price is greater than 0', function () {
  assert.ok(this.itemType.sellPrice > 0,
    `Expected sellPrice > 0 but got ${this.itemType.sellPrice}`);
});

Then('it is stackable', function () {
  assert.ok(this.itemType.stackable === true,
    `Expected ${this.itemType.name} to be stackable`);
});

// ── Loot pool ────────────────────────────────────────────────────────────────

When('getFloorLootPool is called for floor {int}', function (floor) {
  this.lootPool = getFloorLootPool(floor);
});

Then('the home seeking scroll is in the loot pool', function () {
  const ids = this.lootPool.map(t => t.id);
  assert.ok(ids.includes(ITEM_TYPES.HOME_SEEKING_SCROLL.id),
    `Expected home_seeking_scroll in loot pool but got: ${[...new Set(ids)].join(', ')}`);
});

When('getFloorLootPool is sampled {int} times on floor {int}', function (times, floor) {
  const pool = getFloorLootPool(floor);
  const rng = createRNG(1);
  const counts = {};
  for (let i = 0; i < times; i++) {
    const item = rng.pick(pool);
    counts[item.id] = (counts[item.id] || 0) + 1;
  }
  this.sampleCounts = counts;
});

Then('the home seeking scroll appears less often than the health potion', function () {
  const scrollCount = this.sampleCounts[ITEM_TYPES.HOME_SEEKING_SCROLL.id] || 0;
  const potionCount = this.sampleCounts[ITEM_TYPES.HEALTH_POTION.id] || 0;
  assert.ok(scrollCount < potionCount,
    `Expected scroll (${scrollCount}) to appear less often than health potion (${potionCount})`);
});

// ── Magic shop stock ─────────────────────────────────────────────────────────

When('magic shop stock is generated for a level {int} player', function (level) {
  this.shopStock = generateShopItems('potion', level, TEST_RNG);
});

Then('the stock includes exactly one Home Seeking Scroll', function () {
  const scrolls = this.shopStock.filter(s => s.item.id === ITEM_TYPES.HOME_SEEKING_SCROLL.id);
  assert.equal(scrolls.length, 1,
    `Expected 1 Home Seeking Scroll in stock but found ${scrolls.length}`);
});

Then('the stock includes at least one Health Potion', function () {
  const potions = this.shopStock.filter(s => s.item.id === ITEM_TYPES.HEALTH_POTION.id);
  assert.ok(potions.length >= 1,
    `Expected at least 1 Health Potion in stock but found ${potions.length}`);
});

// ── Shop name ────────────────────────────────────────────────────────────────

When('the shop name for type {string} is looked up', function (type) {
  this.shopType = type;
  this.shopName = getShopName(type);
});

Then('the shop name is {string}', function (expected) {
  assert.equal(this.shopName, expected,
    `Expected shop name '${expected}' but got '${this.shopName}'`);
});

// ── RECALL_PORTAL tile ───────────────────────────────────────────────────────

Then('the RECALL_PORTAL tile value is defined', function () {
  assert.ok(TILE.RECALL_PORTAL !== undefined,
    'Expected TILE.RECALL_PORTAL to be defined');
});

Given('a dungeon map with a RECALL_PORTAL tile at position {int} {int}', function (x, y) {
  this.map = new DungeonMap(20, 20);
  this.map.setTile(x, y, TILE.RECALL_PORTAL);
  this.tileX = x;
  this.tileY = y;
});

Then('the tile at {int} {int} is walkable', function (x, y) {
  assert.ok(this.map.isWalkable(x, y),
    `Expected tile at (${x},${y}) to be walkable`);
});

Then('the tile at {int} {int} is not opaque', function (x, y) {
  assert.ok(!this.map.isOpaque(x, y),
    `Expected tile at (${x},${y}) to not be opaque`);
});

// ── DungeonSnapshot ──────────────────────────────────────────────────────────

Given('a dungeon snapshot created at floor {int} position {int} {int}', function (floor, x, y) {
  const map = new DungeonMap(20, 20);
  this.snapshot = DungeonSnapshot.create(floor, x, y, map, [], []);
});

Then('the snapshot floor is {int}', function (floor) {
  assert.equal(this.snapshot.floor, floor,
    `Expected snapshot floor ${floor} but got ${this.snapshot.floor}`);
});

Then('the snapshot return position is {int} {int}', function (x, y) {
  assert.equal(this.snapshot.returnX, x,
    `Expected snapshot returnX ${x} but got ${this.snapshot.returnX}`);
  assert.equal(this.snapshot.returnY, y,
    `Expected snapshot returnY ${y} but got ${this.snapshot.returnY}`);
});

Given('a dungeon snapshot created with {int} enemies', function (count) {
  const map = new DungeonMap(20, 20);
  const enemies = Array.from({ length: count }, (_, i) => ({ id: i, type: 'goblin' }));
  this.snapshot = DungeonSnapshot.create(1, 5, 5, map, enemies, []);
});

Then('the snapshot enemy count is {int}', function (count) {
  assert.equal(this.snapshot.enemies.length, count,
    `Expected ${count} enemies in snapshot but got ${this.snapshot.enemies.length}`);
});

Given('a dungeon snapshot created with {int} items', function (count) {
  const map = new DungeonMap(20, 20);
  const items = Array.from({ length: count }, (_, i) => new Item(i, i, ITEM_TYPES.HEALTH_POTION));
  this.snapshot = DungeonSnapshot.create(1, 5, 5, map, [], items);
});

Then('the snapshot item count is {int}', function (count) {
  assert.equal(this.snapshot.items.length, count,
    `Expected ${count} items in snapshot but got ${this.snapshot.items.length}`);
});

// ── Player movement on RECALL_PORTAL ─────────────────────────────────────────

Given('a recall portal tile at position {int}, {int}', function (x, y) {
  this.map.setTile(x, y, TILE.RECALL_PORTAL);
});

// ── FloorManager.jumpToTown ───────────────────────────────────────────────────

When('the player jumps to town', function () {
  this.jumpResult = this.floorManager.jumpToTown();
});
