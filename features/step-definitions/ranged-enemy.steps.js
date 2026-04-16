/**
 * Step definitions for the ranged-enemy feature.
 *
 * Covers Spitter and Skeleton Mage AI: ranged-attack decisions based on
 * cardinal alignment, range, and line-of-sight (opaque tile blocking).
 *
 * Uses the Cucumber world object (this) exclusively to avoid conflicts with
 * the module-level state in enemy.steps.js.  Spawn-table assertions reuse
 * steps already defined in creeping-mass.steps.js.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Enemy } from '../../src/entities/Enemy.js';
import { ENEMY_DEFS } from '../../src/entities/EnemyTypes.js';

// ── Map stub ──────────────────────────────────────────────────────────────────

/**
 * Minimal map stub with isWalkable and isOpaque backed by a blocked-tile list.
 * Blocked tiles are treated as walls: neither walkable nor transparent.
 *
 * @param {{ blocked?: Array<{x,y}> }} opts
 */
function makeRangedMap({ blocked = [] } = {}) {
  return {
    isWalkable: (x, y) => !blocked.some(b => b.x === x && b.y === y),
    isOpaque:   (x, y) =>  blocked.some(b => b.x === x && b.y === y),
  };
}

/** RNG stub: nextVal drives the teleport roll; nextBool drives wander. */
function makeRng({ nextVal = 0.9, nextBool = false } = {}) {
  return {
    next:     () => nextVal,
    nextBool: () => nextBool,
    nextInt:  (min, max) => Math.floor((min + max) / 2),
  };
}

// ── Given ─────────────────────────────────────────────────────────────────────

Given('a ranged enemy of type {string} at position {int}, {int}', function (type, x, y) {
  this.rangedEnemy = new Enemy(x, y, type);
});

Given('a player target at position {int}, {int}', function (x, y) {
  this.playerTarget = { x, y, name: 'Player', isDead: () => false };
});

Given('no opaque tiles blocking the shot', function () {
  this.opaqueBlocked = [];
});

Given('an opaque tile at position {int}, {int}', function (x, y) {
  this.opaqueBlocked = this.opaqueBlocked ?? [];
  this.opaqueBlocked.push({ x, y });
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the ranged enemy takes its turn with wander suppressed', function () {
  const map = makeRangedMap({ blocked: this.opaqueBlocked ?? [] });
  const rng = makeRng({ nextVal: 0.9, nextBool: false });
  this.rangedResult = this.rangedEnemy.takeTurn(
    this.playerTarget, map, () => null, rng,
  );
});

When('the skeleton mage takes its turn with teleport and wander suppressed', function () {
  // nextVal: 0.9 → teleport roll (0.9 >= teleportChance 0.3) → teleport suppressed
  // nextBool: false → wander suppressed
  const map = makeRangedMap({ blocked: this.opaqueBlocked ?? [] });
  const rng = makeRng({ nextVal: 0.9, nextBool: false });
  this.rangedResult = this.rangedEnemy.takeTurn(
    this.playerTarget, map, () => null, rng,
  );
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the ranged enemy name is {string}', function (expected) {
  assert.equal(this.rangedEnemy.name, expected);
});

Then('the ranged enemy ranged attack power is {int}', function (expected) {
  assert.equal(
    this.rangedEnemy.rangedAttackPower, expected,
    `Expected rangedAttackPower ${expected}, got ${this.rangedEnemy.rangedAttackPower}`,
  );
});

Then('the ranged enemy ranged range is {int}', function (expected) {
  assert.equal(
    this.rangedEnemy.rangedRange, expected,
    `Expected rangedRange ${expected}, got ${this.rangedEnemy.rangedRange}`,
  );
});

Then('the ranged action is {string}', function (expected) {
  assert.equal(
    this.rangedResult.action, expected,
    `Expected action "${expected}" but got "${this.rangedResult.action}"`,
  );
});

Then('the ranged action is not {string}', function (notExpected) {
  assert.notEqual(
    this.rangedResult.action, notExpected,
    `Expected action NOT to be "${notExpected}" but it was`,
  );
});

Then('the ranged target is the player', function () {
  assert.strictEqual(
    this.rangedResult.target, this.playerTarget,
    'Expected ranged attack target to be the player',
  );
});
