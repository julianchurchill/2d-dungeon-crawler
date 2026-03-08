import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getSpawnTable } from '../../src/entities/EnemyTypes.js';
import { EnemySpawner } from '../../src/systems/EnemySpawner.js';

// ─── Shared helpers ───────────────────────────────────────────────────────

/**
 * Builds a set of rooms at non-overlapping x offsets so positions never
 * conflict (avoiding false negatives when getEntityAt is checked).
 *
 * @param {number} count
 * @returns {Array<{x:number,y:number,w:number,h:number}>}
 */
function makeRooms(count) {
  return Array.from({ length: count }, (_, i) => ({
    x: i * 20, y: 0, w: 7, h: 7,
  }));
}

/** RNG whose nextInt always returns the maximum and pick always returns the last element. */
const maxRNG = {
  nextInt: (min, max) => max,
  pick: (arr) => arr[arr.length - 1],
};

/** RNG whose nextInt always returns 0 and pick always returns the first element. */
const zeroRNG = {
  nextInt: () => 0,
  pick: (arr) => arr[0],
};

// ─── getSpawnTable scenarios ──────────────────────────────────────────────

When('the spawn table is requested for floor {int} with no weight override', function (floor) {
  this.spawnResult = getSpawnTable(floor, null);
});

When('the spawn table is requested for floor {int} with weights goblin {int} orc {int} troll {int}',
  function (floor, goblin, orc, troll) {
    this.spawnResult = getSpawnTable(floor, { goblin, orc, troll });
  });

Then('the result should contain {int} goblins and {int} orcs', function (goblins, orcs) {
  assert.equal(this.spawnResult.filter(t => t === 'goblin').length, goblins);
  assert.equal(this.spawnResult.filter(t => t === 'orc').length, orcs);
});

Then('the result should contain {int} goblins and {int} orc', function (goblins, orcs) {
  assert.equal(this.spawnResult.filter(t => t === 'goblin').length, goblins);
  assert.equal(this.spawnResult.filter(t => t === 'orc').length, orcs);
});

// ─── EnemySpawner scenarios ───────────────────────────────────────────────

Given('an EnemySpawner with max enemies per room {int}', function (max) {
  this.spawned = [];
  this.spawner = new EnemySpawner(zeroRNG, {
    spawnWeights: null,
    minEnemiesPerRoom: null,
    maxEnemiesPerRoom: max,
  });
});

Given('an EnemySpawner with max enemies per room {int} and a maximum RNG', function (max) {
  this.spawned = [];
  this.spawner = new EnemySpawner(maxRNG, {
    spawnWeights: null,
    minEnemiesPerRoom: null,
    maxEnemiesPerRoom: max,
  });
});

When('spawning enemies for {int} room(s) on floor {int}', function (roomCount, floor) {
  const rooms = makeRooms(roomCount);
  this.spawner.spawnForRooms(
    rooms,
    floor,
    () => null,                                    // no existing entities
    (x, y, type) => this.spawned.push({ x, y, type }),
  );
});

Then('no enemies should have been spawned', function () {
  assert.equal(this.spawned.length, 0, `Expected no spawns but got ${this.spawned.length}`);
});

Then('{int} enemies should have been spawned', function (expected) {
  assert.equal(this.spawned.length, expected,
    `Expected ${expected} spawns but got ${this.spawned.length}`);
});
