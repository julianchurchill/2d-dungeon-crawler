import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { FloorManager } from '../../src/systems/FloorManager.js';
import { TownGenerator } from '../../src/dungeon/TownGenerator.js';
import { TILE } from '../../src/utils/TileTypes.js';

const SHOP_TYPES = ['potion', 'weapon', 'armour'];

// --- Given ---

Given('a new FloorManager', function () {
  this.floorManager = new FloorManager();
});

Given('the town is generated', function () {
  const generator = new TownGenerator();
  this.townResult = generator.generate();
});

// --- When ---

When('the player descends', function () {
  this.floorManager.descend();
});

When('the town is generated again', function () {
  const generator = new TownGenerator();
  this.townResult2 = generator.generate();
});

// --- Then ---

Then('the current floor is {int}', function (expected) {
  assert.equal(this.floorManager.currentFloor, expected,
    `Expected floor ${expected}, got ${this.floorManager.currentFloor}`);
});

Then('the floor is the town', function () {
  assert.ok(this.floorManager.isTown(),
    'Expected isTown() to return true');
});

Then('the floor is not the town', function () {
  assert.ok(!this.floorManager.isTown(),
    'Expected isTown() to return false');
});

Then('both town layouts are identical', function () {
  const t1 = this.townResult.map;
  const t2 = this.townResult2.map;
  assert.equal(t1.width, t2.width);
  assert.equal(t1.height, t2.height);
  assert.ok(
    t1.tiles.every((v, i) => v === t2.tiles[i]),
    'Expected both town layouts to be identical'
  );
});

Then('the town map contains floor tiles', function () {
  const { map } = this.townResult;
  let hasFloor = false;
  for (let i = 0; i < map.tiles.length; i++) {
    if (map.tiles[i] === TILE.FLOOR) { hasFloor = true; break; }
  }
  assert.ok(hasFloor, 'Expected town map to contain at least one floor tile');
});

Then('the town map contains stairs leading down', function () {
  const { map } = this.townResult;
  let hasStairs = false;
  for (let i = 0; i < map.tiles.length; i++) {
    if (map.tiles[i] === TILE.STAIRS_DOWN) { hasStairs = true; break; }
  }
  assert.ok(hasStairs, 'Expected town map to contain stairs leading down');
});

Then('the town start position is on a walkable tile', function () {
  const { map, startPos } = this.townResult;
  assert.ok(
    map.isWalkable(startPos.x, startPos.y),
    `Expected start position (${startPos.x}, ${startPos.y}) to be walkable`
  );
});

When('the floor is generated', function () {
  this.floorResult = this.floorManager.generateFloor();
});

Then('the generated floor map contains floor tiles', function () {
  const { map } = this.floorResult;
  let hasFloor = false;
  for (let i = 0; i < map.tiles.length; i++) {
    if (map.tiles[i] === TILE.FLOOR) { hasFloor = true; break; }
  }
  assert.ok(hasFloor, 'Expected generated floor map to contain at least one floor tile');
});

Then('the generated floor map contains stairs leading down', function () {
  const { map } = this.floorResult;
  let hasStairs = false;
  for (let i = 0; i < map.tiles.length; i++) {
    if (map.tiles[i] === TILE.STAIRS_DOWN) { hasStairs = true; break; }
  }
  assert.ok(hasStairs, 'Expected generated floor map to contain stairs leading down');
});

Then('the town map contains {int} door tiles', function (expected) {
  const { map } = this.townResult;
  let count = 0;
  for (let i = 0; i < map.tiles.length; i++) {
    if (map.tiles[i] === TILE.DOOR) count++;
  }
  assert.equal(count, expected,
    `Expected ${expected} door tile(s) in town map, found ${count}`);
});

Then('the town result should include {int} shops', function (expected) {
  const shops = this.townResult.shops;
  assert.ok(Array.isArray(shops),
    'Expected townResult.shops to be an array');
  assert.equal(shops.length, expected,
    `Expected ${expected} shops, got ${shops.length}`);
});

Then('the town shops should be of types potion, weapon and armour', function () {
  assert.ok(Array.isArray(this.townResult.shops),
    'Expected townResult.shops to be an array');
  const types = this.townResult.shops.map(s => s.type);
  for (const expected of SHOP_TYPES) {
    assert.ok(types.includes(expected),
      `Expected shops to include type '${expected}', got [${types.join(', ')}]`);
  }
});

Then('the generated floor start position is on a walkable tile', function () {
  const { map, startPos } = this.floorResult;
  assert.ok(
    map.isWalkable(startPos.x, startPos.y),
    `Expected generated floor start position (${startPos.x}, ${startPos.y}) to be walkable`
  );
});
