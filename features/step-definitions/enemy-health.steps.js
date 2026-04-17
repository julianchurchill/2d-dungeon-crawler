/**
 * Step definitions for the enemy-health feature.
 *
 * Tests the healthBarFraction getter on Enemy and the getHealthBarColor
 * pure function exported from Enemy.js.  Uses the Cucumber world (this)
 * to avoid conflicts with module-level state in other step files.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Enemy, getHealthBarColor } from '../../src/entities/Enemy.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('a health bar test enemy of type {string}', function (type) {
  this.hbEnemy = new Enemy(0, 0, type);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the health bar test enemy has {int} of {int} HP', function (hp, maxHp) {
  this.hbEnemy.stats.hp    = hp;
  this.hbEnemy.stats.maxHp = maxHp;
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the health bar fraction is {float}', function (expected) {
  assert.equal(
    this.hbEnemy.healthBarFraction, expected,
    `Expected healthBarFraction ${expected}, got ${this.hbEnemy.healthBarFraction}`,
  );
});

Then('the health bar colour is {int} for fraction {float}', function (expected, fraction) {
  const actual = getHealthBarColor(fraction);
  assert.equal(
    actual, expected,
    `Expected colour ${expected} (0x${expected.toString(16)}) for fraction ${fraction}, got ${actual} (0x${actual.toString(16)})`,
  );
});
