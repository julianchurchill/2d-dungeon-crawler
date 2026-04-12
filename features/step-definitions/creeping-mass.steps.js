import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'assert';
import { CreepingMass, HP_PER_SEGMENT } from '../../src/entities/CreepingMass.js';
import { getSpawnTable } from '../../src/entities/EnemyTypes.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a linear horizontal chain of `count` segments starting at (x, y).
 * @param {number} x
 * @param {number} y
 * @param {number} count
 * @returns {Array<{x:number,y:number}>}
 */
function linearSegments(x, y, count) {
  return Array.from({ length: count }, (_, i) => ({ x: x + i, y }));
}

/** Minimal map stub — every tile walkable unless (x,y) is in the blocked list. */
function makeMap({ blocked = [], fullyBlocked = false } = {}) {
  return {
    isWalkable(x, y) {
      if (fullyBlocked) return false;
      return !blocked.some(b => b.x === x && b.y === y);
    },
  };
}

/** RNG stub that always returns fixed values. */
function makeRng({ nextVal = 0.5 } = {}) {
  return {
    next: () => nextVal,
    nextBool: () => false,
    pick: (arr) => arr[0],
  };
}

/** getEntityAt stub that returns null for every tile. */
const noEntities = () => null;

// ---------------------------------------------------------------------------
// State shared across steps in one scenario
// ---------------------------------------------------------------------------

const state = {};

Before(function () {
  Object.keys(state).forEach(k => delete state[k]);
});

// ---------------------------------------------------------------------------
// Given
// ---------------------------------------------------------------------------

Given('a Creeping Mass with {int} segments starting at {int}, {int}', function (count, x, y) {
  const segs = linearSegments(x, y, count);
  state.mass = new CreepingMass(segs);
  state.initialCount = count;
  state.startX = x;
  state.startY = y;
});

Given('a mass target player at position {int}, {int}', function (x, y) {
  state.player = { x, y, name: 'Player' };
});

Given('the spawn table for floor {int}', function (floor) {
  state.spawnTable = getSpawnTable(floor);
});

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When('the mass takes {int} damage', function (amount) {
  state.mass.takeDamage(amount);
});

When('the mass takes enough damage to leave {int} segment(s) worth of hp', function (remaining) {
  // Deal just enough damage so that hp sits at exactly `remaining * HP_PER_SEGMENT`.
  const target = remaining * HP_PER_SEGMENT;
  const toRemove = state.mass.stats.hp - target;
  // We bypass defence for precise testing by dealing enough that after defence the result is exact.
  // Easiest: set hp directly to test the sync logic.
  state.mass.stats.hp = target + 1; // above floor
  state.mass.takeDamage(1);         // triggers _syncSegments with hp == target
});

When('the mass takes its turn on an open map', function () {
  const map = makeMap();
  const player = state.player || { x: 0, y: 0 };
  state.result = state.mass.takeTurn(player, map, noEntities, makeRng());
});

When('the mass takes its turn on an open map with wander suppressed', function () {
  const map = makeMap();
  const player = state.player || { x: 0, y: 0 };
  state.result = state.mass.takeTurn(player, map, noEntities, makeRng({ nextVal: 1 }));
});

When('the mass takes its turn on a fully blocked map', function () {
  const map = makeMap({ fullyBlocked: true });
  const player = state.player || { x: 5, y: 0 };
  state.result = state.mass.takeTurn(player, map, noEntities, makeRng());
});

// ---------------------------------------------------------------------------
// Then
// ---------------------------------------------------------------------------

Then(/^the mass has (\d+) segments?$/, function (count) {
  assert.strictEqual(state.mass.segments.length, Number(count));
});

Then('the mass hp equals {int} times the hp per segment', function (n) {
  assert.strictEqual(state.mass.stats.hp, n * HP_PER_SEGMENT);
});

Then('the mass max hp equals {int} times the hp per segment', function (n) {
  assert.strictEqual(state.mass.stats.maxHp, n * HP_PER_SEGMENT);
});

Then('every segment is adjacent to at least one other segment', function () {
  for (const seg of state.mass.segments) {
    const neighbours = state.mass.segments.filter(
      o => o !== seg && Math.abs(o.x - seg.x) + Math.abs(o.y - seg.y) === 1,
    );
    assert.ok(
      neighbours.length >= 1,
      `Segment at (${seg.x},${seg.y}) has no neighbours`,
    );
  }
});

Then('the mass type is {string}', function (type) {
  assert.strictEqual(state.mass.type, type);
});

Then('the mass name is {string}', function (name) {
  assert.strictEqual(state.mass.name, name);
});

Then('the mass is not dead', function () {
  assert.strictEqual(state.mass.isDead(), false);
});

Then('the mass is dead', function () {
  assert.strictEqual(state.mass.isDead(), true);
});

Then('there is {int} pending removed segment(s)', function (count) {
  assert.strictEqual(state.mass.pendingRemovedSegments.length, count);
});

Then('the mass action is {string}', function (action) {
  assert.strictEqual(state.result.action, action);
});

Then('the mass action is not {string}', function (action) {
  assert.notStrictEqual(state.result.action, action);
});

Then('the mass attack target is the player', function () {
  assert.strictEqual(state.result.target, state.player);
});

Then('the remove segment is different from the add segment', function () {
  const { removeSegment, addSegment } = state.result;
  assert.ok(
    removeSegment.x !== addSegment.x || removeSegment.y !== addSegment.y,
    'removeSegment and addSegment should be different tiles',
  );
});

Then('{string} is in the spawn table', function (type) {
  assert.ok(
    state.spawnTable.includes(type),
    `Expected "${type}" to be in the spawn table but it was not`,
  );
});

Then('{string} is not in the spawn table', function (type) {
  assert.ok(
    !state.spawnTable.includes(type),
    `Expected "${type}" not to be in the spawn table but it was`,
  );
});
