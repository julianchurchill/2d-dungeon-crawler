/**
 * Step definitions for the Potion of Minor Teleportation.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findMinorTeleportDestination } from '../../src/systems/MinorTeleportation.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { getFloorLoot } from '../../src/items/LootTables.js';
import { Item } from '../../src/items/Item.js';

// Stub RNG that always picks the first element of any array.
const firstRng = { pick: (arr) => arr[0], next: () => 0 };

// Seeded RNG for reproducible shuffling — returns values 0..1 cycling.
let _seed = 0;
const seededRng = {
  pick: (arr) => arr[Math.floor(_seed++ % arr.length)],
  next: () => (_seed++ % 100) / 100,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds a simple flat isWalkable function for an open NxN map.
 *
 * @param {number} size
 * @returns {(x: number, y: number) => boolean}
 */
function openMapWalkable(size) {
  return (x, y) => x >= 0 && y >= 0 && x < size && y < size;
}

/**
 * Chebyshev distance between two points.
 *
 * @param {number} ax
 * @param {number} ay
 * @param {number} bx
 * @param {number} by
 * @returns {number}
 */
function chebyshev(ax, ay, bx, by) {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

// ── Given ─────────────────────────────────────────────────────────────────────

Given('a 20x20 open map with the player at position {int} {int}', function (px, py) {
  _seed = 0;
  this.px = px;
  this.py = py;
  this.isWalkable = openMapWalkable(20);
  this.getEntityAt = () => null;
  this.rng = seededRng;
});

Given('a map where all tiles in range are walls with player at position {int} {int}', function (px, py) {
  this.px = px;
  this.py = py;
  this.isWalkable = () => false;
  this.getEntityAt = () => null;
  this.rng = firstRng;
});

Given('a 20x20 open map where all tiles are occupied with player at position {int} {int}', function (px, py) {
  this.px = px;
  this.py = py;
  this.isWalkable = openMapWalkable(20);
  this.getEntityAt = () => ({ type: 'enemy' }); // every tile occupied
  this.rng = firstRng;
});

Given('the Potion of Minor Teleportation item type', function () {
  this.itemType = ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION;
});

Given('a Potion of Minor Teleportation item instance', function () {
  this.item = new Item(0, 0, ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION);
  this.player = { x: this.px, y: this.py };
});

Given('the sprite_stalker achievement is unlocked', function () {
  this.unlockedItems = new Set([ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION.id]);
});

Given('the sprite_stalker achievement is not unlocked', function () {
  this.unlockedItems = new Set();
});

// ── When ──────────────────────────────────────────────────────────────────────

When('findMinorTeleportDestination is called with minDist {int} and maxDist {int}',
  function (minDist, maxDist) {
    this.minDist = minDist;
    this.maxDist = maxDist;
    this.destination = findMinorTeleportDestination(
      this.px, this.py, this.isWalkable, this.getEntityAt, this.rng, minDist, maxDist,
    );
  });

When('the item is used with a teleport context', function () {
  const context = {
    rng: this.rng,
    isWalkable: this.isWalkable,
    getEntityAt: this.getEntityAt,
  };
  this.useMessage = this.item.use(this.player, context);
});

When('getFloorLoot is sampled {int} times on floor {int}', function (samples, floor) {
  const pickRng = { pick: (arr) => arr[Math.floor(Math.random() * arr.length)] };
  this.lootCounts = {};
  for (let i = 0; i < samples; i++) {
    const item = getFloorLoot(floor, pickRng, this.unlockedItems);
    this.lootCounts[item.id] = (this.lootCounts[item.id] || 0) + 1;
  }
});

When('getFloorLoot is called for floor {int}', function (floor) {
  // Sample many times to check whether the potion can appear.
  let count = 0;
  const sample = 200;
  const pickRng = { pick: (arr) => arr[count++ % arr.length] };
  this.lootSamples = Array.from({ length: sample },
    () => getFloorLoot(floor, pickRng, this.unlockedItems));
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('a destination tile is returned', function () {
  assert.ok(this.destination !== null,
    'Expected a destination to be returned but got null');
});

Then('the destination is between {int} and {int} tiles from the player',
  function (minDist, maxDist) {
    const d = chebyshev(this.px, this.py, this.destination.x, this.destination.y);
    assert.ok(d >= minDist && d <= maxDist,
      `Expected distance ${d} to be between ${minDist} and ${maxDist}`);
  });

Then('the destination is at least {int} tiles from the player', function (minDist) {
  const d = chebyshev(this.px, this.py, this.destination.x, this.destination.y);
  assert.ok(d >= minDist,
    `Expected distance ${d} to be at least ${minDist}`);
});

Then("the destination is not the player's starting position", function () {
  assert.ok(
    this.destination.x !== this.px || this.destination.y !== this.py,
    "Destination must not be the player's own tile",
  );
});

Then('no destination is returned', function () {
  assert.strictEqual(this.destination, null,
    'Expected null but got a destination');
});

Then('the returned tile is walkable and unoccupied', function () {
  assert.ok(this.isWalkable(this.destination.x, this.destination.y),
    'Destination tile is not walkable');
  assert.strictEqual(this.getEntityAt(this.destination.x, this.destination.y), null,
    'Destination tile is occupied');
});

Then('it is a consumable item', function () {
  assert.strictEqual(this.itemType.type, 'consumable');
});

Then('it has a teleport_near effect', function () {
  assert.strictEqual(this.itemType.effect?.type, 'teleport_near');
});

Then('the player position has changed', function () {
  assert.ok(
    this.player.x !== this.px || this.player.y !== this.py,
    `Expected player to move from (${this.px},${this.py}) but position is unchanged`,
  );
});

Then('the player position has not changed', function () {
  assert.strictEqual(this.player.x, this.px);
  assert.strictEqual(this.player.y, this.py);
});

Then('the use message mentions vanishing', function () {
  assert.ok(this.useMessage.includes('vanish'),
    `Expected message to mention vanishing, got: "${this.useMessage}"`);
});

Then('the use message mentions nothing happening', function () {
  assert.ok(this.useMessage.includes('nothing happens'),
    `Expected message to mention nothing happening, got: "${this.useMessage}"`);
});

Then('the potion of minor teleportation appears less often than the health potion', function () {
  const teleportCount = this.lootCounts[ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION.id] || 0;
  const healthCount   = this.lootCounts[ITEM_TYPES.HEALTH_POTION.id] || 0;
  assert.ok(
    teleportCount < healthCount,
    `Expected teleport potion (${teleportCount}) to appear less often than health potion (${healthCount})`,
  );
});

Then('the potion of minor teleportation is in the loot pool', function () {
  const found = this.lootSamples.some(
    t => t.id === ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION.id,
  );
  assert.ok(found, 'Expected potion to appear in loot samples but it did not');
});

Then('the potion of minor teleportation is not in the loot pool', function () {
  const found = this.lootSamples.some(
    t => t.id === ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION.id,
  );
  assert.ok(!found, 'Expected potion NOT to appear in loot samples but it did');
});
