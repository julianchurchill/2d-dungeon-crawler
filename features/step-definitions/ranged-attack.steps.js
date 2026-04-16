/**
 * Step definitions for the ranged attack feature.
 *
 * Covers:
 *   - findRangedTarget: target-finding logic (walls, range, nearest-first, out-of-range)
 *   - resolveRangedAttack: damage, kill detection, and message content
 *   - Player.rangedAttackPower: only counts ranged-weapon bonus, not melee
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findRangedTarget, resolveRangedAttack } from '../../src/systems/RangedCombat.js';
import { Player } from '../../src/entities/Player.js';
import { Enemy } from '../../src/entities/Enemy.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { createRNG } from '../../src/utils/RNG.js';

// ── Shared helpers ────────────────────────────────────────────────────────────

/**
 * Returns the isOpaque predicate bound to this.walls (a Set of "x,y" strings).
 * @param {object} world - Cucumber world object.
 */
function isOpaqueFn(world) {
  return (x, y) => (world.walls ?? new Set()).has(`${x},${y}`);
}

/**
 * Returns the getEntityAt predicate bound to this.enemies.
 * @param {object} world - Cucumber world object.
 */
function getEntityAtFn(world) {
  return (x, y) => (world.enemies ?? []).find(e => e.x === x && e.y === y) ?? null;
}

// ── Given — grid setup ────────────────────────────────────────────────────────

Given('the player is at tile {int}, {int}', function (x, y) {
  this.playerX = x;
  this.playerY = y;
});

Given('an enemy is at tile {int}, {int}', function (x, y) {
  this.enemies = this.enemies ?? [];
  this.enemy = new Enemy(x, y, 'goblin');
  this.enemies.push(this.enemy);
});

Given('a second enemy is at tile {int}, {int}', function (x, y) {
  this.enemies = this.enemies ?? [];
  this.secondEnemy = new Enemy(x, y, 'goblin');
  this.enemies.push(this.secondEnemy);
});

Given('no enemies are ahead', function () {
  this.enemies = [];
});

Given('no walls block the path', function () {
  this.walls = new Set();
});

Given('a wall at tile {int}, {int}', function (x, y) {
  this.walls = this.walls ?? new Set();
  this.walls.add(`${x},${y}`);
});

// ── When — target finding ─────────────────────────────────────────────────────

When('finding a ranged target upward with range {int}', function (range) {
  // findRangedTarget returns { target, outOfRange }
  this.rangedFindResult = findRangedTarget(
    this.playerX, this.playerY,
    0, -1,           // dx=0, dy=-1 (up)
    range,
    isOpaqueFn(this),
    getEntityAtFn(this),
  );
});

// ── Then — target finding ─────────────────────────────────────────────────────

Then('the ranged target should be the enemy at {int}, {int}', function (x, y) {
  const target = this.rangedFindResult.target;
  assert.ok(target !== null, 'Expected a ranged target but got null');
  assert.equal(target.x, x, `Expected target x=${x} but got ${target.x}`);
  assert.equal(target.y, y, `Expected target y=${y} but got ${target.y}`);
});

Then('no ranged target should be found', function () {
  assert.equal(
    this.rangedFindResult.target, null,
    'Expected no ranged target but one was found',
  );
});

Then('the search result should indicate out of range', function () {
  assert.ok(
    this.rangedFindResult.outOfRange,
    'Expected outOfRange to be true but it was false',
  );
});

Then('the search result should not indicate out of range', function () {
  assert.ok(
    !this.rangedFindResult.outOfRange,
    'Expected outOfRange to be false but it was true',
  );
});

// ── Given — attack resolution ─────────────────────────────────────────────────

Given('a player with ranged attack power {int}', function (power) {
  this.player = new Player(0, 0);
  // Set base attack to the desired power; the rangedAttackPower getter uses
  // base + ranged weapon bonus, so for a baseline test we just set base stats.
  this.player.stats.attack = power;
});

// ── When — attack resolution ──────────────────────────────────────────────────

When('the player fires at the goblin with seed {int}', function (seed) {
  this.rangedResult = resolveRangedAttack(this.player, this.enemy, createRNG(seed));
});

// ── Then — attack resolution ──────────────────────────────────────────────────

Then('the goblin should have taken damage from ranged attack', function () {
  assert.ok(
    this.enemy.stats.hp < this.enemy.stats.maxHp,
    `Expected goblin HP to be reduced, but got ${this.enemy.stats.hp}/${this.enemy.stats.maxHp}`,
  );
});

Then('the ranged attack result should indicate a kill', function () {
  assert.ok(this.rangedResult.killed, 'Expected rangedResult.killed to be true');
});

Then('the ranged attack message should mention {string}', function (phrase) {
  const msg = this.rangedResult.messages.at(-1);
  assert.ok(
    msg.includes(phrase),
    `Expected ranged attack message to include "${phrase}", got: "${msg}"`,
  );
});

Then('the ranged attack message should contain {string}', function (phrase) {
  const msg = this.rangedResult.messages.at(-1);
  assert.ok(
    msg.includes(phrase),
    `Expected ranged attack message to contain "${phrase}", got: "${msg}"`,
  );
});

// ── Then — rangedAttackPower ──────────────────────────────────────────────────

Then('the player ranged attack power should be {int}', function (expected) {
  assert.equal(
    this.player.rangedAttackPower, expected,
    `Expected rangedAttackPower to be ${expected}, got ${this.player.rangedAttackPower}`,
  );
});
