/**
 * Step definitions for the Save Security feature.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { applyPlayerStats } from '../../src/save/SaveGame.js';

// ── Player stats restore ──────────────────────────────────────────────────────

Given('saved player stats with an extra key {string} set to {int}', function (key, value) {
  this.savedStats = {
    hp: 25, maxHp: 30, attack: 6, defense: 3,
    level: 2, xp: 10, xpToNext: 40, statPoints: 1,
    [key]: value,
  };
  this.targetStats = {
    hp: 30, maxHp: 30, attack: 5, defense: 2,
    level: 1, xp: 0, xpToNext: 20, statPoints: 0,
  };
});

Given('saved player stats with a {string} key containing a poisoned field', function (key) {
  // Simulate a crafted save: JSON.parse('{"__proto__":{"poisoned":true}}')
  // JSON.parse produces a plain object with __proto__ as own key, not prototype mutation.
  // We pass it as raw saved data to simulate what applyPlayerStats receives.
  this.savedStats = JSON.parse(`{"${key}":{"poisoned":true},"hp":20,"maxHp":30,"attack":5,"defense":2,"level":1,"xp":0,"xpToNext":20,"statPoints":0}`);
  this.targetStats = {
    hp: 30, maxHp: 30, attack: 5, defense: 2,
    level: 1, xp: 0, xpToNext: 20, statPoints: 0,
  };
});

When('the saved stats are applied to a fresh player', function () {
  applyPlayerStats(this.targetStats, this.savedStats);
});

Then('the player stats should not contain key {string}', function (key) {
  assert.ok(!Object.prototype.hasOwnProperty.call(this.targetStats, key),
    `Expected player stats not to contain key "${key}" but it was present`);
});

Then('Object.prototype should not have been polluted by the stats restore', function () {
  assert.equal(({}).poisoned, undefined,
    'Object.prototype was polluted by applyPlayerStats');
});
