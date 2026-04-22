import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getSpawnTable } from '../../src/entities/EnemyTypes.js';
import { EnemySpawner } from '../../src/systems/EnemySpawner.js';

// ─── Shared helpers ───────────────────────────────────────────────────────

/**
 * A neutral difficulty manager stub that applies no scaling (all multipliers 1).
 * Injected into EnemySpawner test instances so spawner count/position tests are
 * isolated from the difficulty system.
 */
const neutralDiffMgr = { getConfig: () => ({ enemyCount: 1, enemyHp: 1, enemyAtk: 1 }) };

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
  next: () => 1,        // 1 < any champion chance → no champions
  nextInt: (min, max) => max,
  pick: (arr) => arr[arr.length - 1],
};

/** RNG whose nextInt always returns 0 and pick always returns the first element. */
const zeroRNG = {
  next: () => 1,        // 1 < any champion chance → no champions
  nextInt: () => 0,
  pick: (arr) => arr[0],
};

/** RNG whose nextInt always returns its min argument and pick always returns the first element. */
const minRNG = {
  next: () => 1,        // 1 < any champion chance → no champions
  nextInt: (min) => min,
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

Then('the result should contain {int} cockroaches and {int} sprites', function (cockroaches, sprites) {
  assert.equal(this.spawnResult.filter(t => t === 'cockroach').length, cockroaches);
  assert.equal(this.spawnResult.filter(t => t === 'sprite').length, sprites);
});

Then('the result should contain {int} trolls', function (trolls) {
  assert.equal(this.spawnResult.filter(t => t === 'troll').length, trolls);
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
  }, neutralDiffMgr);
});

Given('an EnemySpawner with null max enemies per room and a maximum RNG', function () {
  this.spawned = [];
  this.spawner = new EnemySpawner(maxRNG, {
    spawnWeights: null,
    minEnemiesPerRoom: null,
    maxEnemiesPerRoom: null,
  }, neutralDiffMgr);
});

Given('an EnemySpawner with min {int} max {int} and a minimum RNG', function (min, max) {
  this.spawned = [];
  this.spawner = new EnemySpawner(minRNG, {
    spawnWeights: null,
    minEnemiesPerRoom: min,
    maxEnemiesPerRoom: max,
  }, neutralDiffMgr);
});

Given('an EnemySpawner with min {int} max {int} a minimum RNG and troll-only weights', function (min, max) {
  this.spawned = [];
  this.spawner = new EnemySpawner(minRNG, {
    spawnWeights: { cockroach: 0, sprite: 0, goblin: 0, orc: 0, troll: 1 },
    minEnemiesPerRoom: min,
    maxEnemiesPerRoom: max,
  }, neutralDiffMgr);
});

Given('an EnemySpawner that only spawns cockroaches with max enemies per room {int} and a maximum RNG',
  function (max) {
    this.spawned = [];
    this.spawner = new EnemySpawner(maxRNG, {
      spawnWeights: { cockroach: 1, sprite: 0, goblin: 0, orc: 0, troll: 0 },
      minEnemiesPerRoom: null,
      maxEnemiesPerRoom: max,
    }, neutralDiffMgr);
  }
);

Given('an EnemySpawner with max enemies per room {int} and a maximum RNG', function (max) {
  this.spawned = [];
  this.spawner = new EnemySpawner(maxRNG, {
    spawnWeights: null,
    minEnemiesPerRoom: null,
    maxEnemiesPerRoom: max,
  }, neutralDiffMgr);
});

When('spawning cockroaches for {int} rooms on floor {int} with entity-aware tracking',
  function (roomCount, floor) {
    this.spawned = [];
    const rooms = makeRooms(roomCount);
    const occupied = new Set();
    this.spawner.spawnForRooms(
      rooms, floor,
      (x, y) => occupied.has(`${x},${y}`) ? { x, y } : null,
      (x, y, type) => {
        this.spawned.push({ x, y, type });
        occupied.add(`${x},${y}`);
      },
    );
  }
);

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

When('spawning enemies for {int} room(s) on floor {int} with all tiles occupied', function (roomCount, floor) {
  const rooms = makeRooms(roomCount);
  this.spawner.spawnForRooms(
    rooms,
    floor,
    () => true,
    (x, y, type) => this.spawned.push({ x, y, type }),
  );
});

Then('the first enemy should have been spawned at x {int} y {int}', function (x, y) {
  assert.ok(this.spawned.length > 0, `Expected at least one enemy but got none`);
  assert.equal(this.spawned[0].x, x, `Expected x=${x} but got ${this.spawned[0].x}`);
  assert.equal(this.spawned[0].y, y, `Expected y=${y} but got ${this.spawned[0].y}`);
});

Then('between {int} and {int} cockroaches should have been spawned', function (min, max) {
  const count = this.spawned.filter(e => e.type === 'cockroach').length;
  assert.ok(count >= min && count <= max,
    `Expected ${min}–${max} cockroaches but got ${count}`);
});

Then('each cockroach is adjacent to at least one other cockroach', function () {
  const roaches = this.spawned.filter(e => e.type === 'cockroach');
  if (roaches.length <= 1) return;
  const posSet = new Set(roaches.map(r => `${r.x},${r.y}`));
  for (const r of roaches) {
    const hasNeighbour = [
      `${r.x},${r.y - 1}`, `${r.x},${r.y + 1}`,
      `${r.x - 1},${r.y}`, `${r.x + 1},${r.y}`,
    ].some(k => posSet.has(k));
    assert.ok(hasNeighbour, `Cockroach at (${r.x},${r.y}) has no adjacent cockroach`);
  }
});

Then('{int} enemies should have been spawned', function (expected) {
  assert.equal(this.spawned.length, expected,
    `Expected ${expected} spawns but got ${this.spawned.length}`);
});

Given('an EnemySpawner that only spawns creeping_mass with min {int} max {int} and a minimum RNG',
  function (min, max) {
    this.spawned = [];
    this.spawner = new EnemySpawner(minRNG, {
      spawnWeights: { creeping_mass: 1 },
      minEnemiesPerRoom: min,
      maxEnemiesPerRoom: max,
    }, neutralDiffMgr);
  },
);

Then('at most {int} creeping_mass should have been spawned per room', function (maxPerRoom) {
  // With 2 rooms (room 0 = start, skipped; room 1 = non-start), the total cap
  // is maxPerRoom × 1 non-start room.  We verify solitary enforcement by
  // checking the total count never exceeds that cap.
  const count = this.spawned.filter(e => e.type === 'creeping_mass').length;
  assert.ok(
    count <= maxPerRoom,
    `Expected at most ${maxPerRoom} creeping_mass but got ${count}`,
  );
});
