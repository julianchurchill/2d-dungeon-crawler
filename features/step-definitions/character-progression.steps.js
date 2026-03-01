import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';

// --- Given ---

Given('a player at level {int} needing {int} XP to level up', function (level, xpToNext) {
  this.player = new Player(0, 0);
  this.player.stats.level = level;
  this.player.stats.xp = 0;
  this.player.stats.xpToNext = xpToNext;
  this._initialAttack = this.player.stats.attack;
  this._initialMaxHp = this.player.stats.maxHp;
});

Given('a player at level {int} with {int} HP out of {int} maximum', function (level, hp, maxHp) {
  this.player = new Player(0, 0);
  this.player.stats.level = level;
  this.player.stats.hp = hp;
  this.player.stats.maxHp = maxHp;
  this.player.stats.xpToNext = 20;
  this._initialHp = hp;
});

// --- When ---

When('the player gains {int} XP', function (xp) {
  this.leveledUp = this.player.gainXP(xp);
});

When('the player gains enough XP to level up', function () {
  this._initialHp = this.player.stats.hp;
  this.leveledUp = this.player.gainXP(this.player.stats.xpToNext);
});

// --- Then ---

Then('the player XP should be {int}', function (xp) {
  assert.equal(this.player.stats.xp, xp);
});

Then('the player should still be level {int}', function (level) {
  assert.equal(this.player.stats.level, level);
});

Then('the player should be level {int}', function (level) {
  assert.equal(this.player.stats.level, level);
});

Then('the player max HP should have increased by {int}', function (amount) {
  assert.equal(this.player.stats.maxHp, this._initialMaxHp + amount);
});

Then('the player attack should have increased by {int}', function (amount) {
  assert.equal(this.player.stats.attack, this._initialAttack + amount);
});

Then('the XP threshold for the next level should be {int}', function (xpToNext) {
  assert.equal(this.player.stats.xpToNext, xpToNext);
});

Then('the player level should be greater than {int}', function (minLevel) {
  assert.ok(
    this.player.stats.level > minLevel,
    `Expected level > ${minLevel}, got ${this.player.stats.level}`
  );
});

Then('the player HP should have increased', function () {
  assert.ok(
    this.player.stats.hp > this._initialHp,
    `Expected HP to increase from ${this._initialHp}, got ${this.player.stats.hp}`
  );
});
