import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { FloorManager } from '../../src/systems/FloorManager.js';
import { ChallengeFloorGenerator } from '../../src/dungeon/ChallengeFloorGenerator.js';
import { getChallengeLoot } from '../../src/items/LootTables.js';
import { TILE } from '../../src/utils/TileTypes.js';

// ─── Shared helpers ────────────────────────────────────────────────────────

/** Deterministic RNG cycling through [0, 0.25, 0.5, 0.75]. */
let _fixedIdx = 0;
const fixedRNG = {
  next: () => { const v = [0, 0.25, 0.5, 0.75][_fixedIdx % 4]; _fixedIdx++; return v; },
  nextInt: (min, max) => min,
  nextBool: () => false,
  pick: (arr) => arr[0],
};

/**
 * BFS reachability check — returns true if `to` is reachable from `from`
 * over walkable tiles.
 */
function isReachable(map, from, to) {
  const visited = new Set();
  const queue = [`${from.x},${from.y}`];
  visited.add(queue[0]);
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  while (queue.length > 0) {
    const key = queue.shift();
    const [x, y] = key.split(',').map(Number);
    if (x === to.x && y === to.y) return true;
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      const nKey = `${nx},${ny}`;
      if (!visited.has(nKey) && map.isWalkable(nx, ny)) {
        visited.add(nKey);
        queue.push(nKey);
      }
    }
  }
  return false;
}

// ─── Given ────────────────────────────────────────────────────────────────

Given('a FloorManager on floor {int}', function (floor) {
  this.floorManager = new FloorManager();
  this.floorManager.currentFloor = floor;
});

// ─── When ─────────────────────────────────────────────────────────────────

When('a challenge floor is generated', function () {
  const gen = new ChallengeFloorGenerator();
  this.challengeResult = gen.generate();
});

When('the FloorManager generates the floor', function () {
  this.challengeResult = this.floorManager.generateFloor();
});

When('challenge floor loot is drawn {int} times with a fixed RNG', function (n) {
  _fixedIdx = 0;
  this.drawnItems = Array.from({ length: n }, () => getChallengeLoot(fixedRNG));
});

// ─── Then ─────────────────────────────────────────────────────────────────

Then('isChallengeFloor should return true', function () {
  assert.strictEqual(this.floorManager.isChallengeFloor(), true,
    `Expected isChallengeFloor() to return true for floor ${this.floorManager.currentFloor}`);
});

Then('isChallengeFloor should return false', function () {
  assert.strictEqual(this.floorManager.isChallengeFloor(), false,
    `Expected isChallengeFloor() to return false for floor ${this.floorManager.currentFloor}`);
});

Then('the challenge result should have exactly {int} rooms', function (n) {
  assert.strictEqual(this.challengeResult.rooms.length, n,
    `Expected ${n} rooms but got ${this.challengeResult.rooms.length}`);
});

Then('the challenge result should have isChallenge set to true', function () {
  assert.strictEqual(this.challengeResult.isChallenge, true,
    `Expected isChallenge to be true but got ${this.challengeResult.isChallenge}`);
});

Then('the result should have isChallenge set to true', function () {
  assert.strictEqual(this.challengeResult.isChallenge, true,
    `Expected isChallenge to be true but got ${this.challengeResult.isChallenge}`);
});

Then('the challenge map should contain stairs leading up', function () {
  const { map } = this.challengeResult;
  let found = false;
  for (let y = 0; y < map.height && !found; y++)
    for (let x = 0; x < map.width && !found; x++)
      if (map.getTile(x, y) === TILE.STAIRS_UP) found = true;
  assert.ok(found, 'Expected challenge map to contain STAIRS_UP');
});

Then('the challenge map should contain stairs leading down', function () {
  const { map } = this.challengeResult;
  let found = false;
  for (let y = 0; y < map.height && !found; y++)
    for (let x = 0; x < map.width && !found; x++)
      if (map.getTile(x, y) === TILE.STAIRS_DOWN) found = true;
  assert.ok(found, 'Expected challenge map to contain STAIRS_DOWN');
});

Then('the challenge start position should be on a walkable tile', function () {
  const { map, startPos } = this.challengeResult;
  assert.ok(map.isWalkable(startPos.x, startPos.y),
    `Expected start (${startPos.x},${startPos.y}) to be walkable`);
});

Then('the challenge up-stairs should be reachable from the start', function () {
  const { map, startPos, stairsUpPos } = this.challengeResult;
  assert.ok(stairsUpPos, 'Expected challengeResult to include stairsUpPos');
  assert.ok(isReachable(map, startPos, stairsUpPos),
    `Expected up-stairs (${stairsUpPos.x},${stairsUpPos.y}) to be reachable from start (${startPos.x},${startPos.y})`);
});

Then('the challenge down-stairs should be reachable from the start', function () {
  const { map, startPos, stairsPos } = this.challengeResult;
  assert.ok(isReachable(map, startPos, stairsPos),
    `Expected down-stairs (${stairsPos.x},${stairsPos.y}) to be reachable from start (${startPos.x},${startPos.y})`);
});

Then('every drawn item should have type consumable', function () {
  for (const item of this.drawnItems) {
    assert.strictEqual(item.type, 'consumable',
      `Expected consumable but got '${item.type}' (${item.name})`);
  }
});

Then('no drawn item should have type weapon', function () {
  for (const item of this.drawnItems) {
    assert.notStrictEqual(item.type, 'weapon',
      `Expected no weapons but got '${item.name}'`);
  }
});

Then('no drawn item should have type armor', function () {
  for (const item of this.drawnItems) {
    assert.notStrictEqual(item.type, 'armor',
      `Expected no armor but got '${item.name}'`);
  }
});
