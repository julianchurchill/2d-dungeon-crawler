/**
 * Step definitions for stat distribution on level up.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('a new player at full HP', function () {
  this.player = new Player(0, 0);
});

Given('a player with {int} stat points', function (points) {
  this.player = new Player(0, 0);
  this.player.stats.statPoints = points;
});

Given('a player with {int} XP needing {int} to level', function (xp, xpToNext) {
  this.player = new Player(0, 0);
  this.player.stats.xp = xp;
  this.player.stats.xpToNext = xpToNext;
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the player levels up', function () {
  this.player.levelUp();
});

When('the player applies a stat point to attack', function () {
  this.player.applyStatPoint('attack');
});

When('the player applies a stat point to defense', function () {
  this.player.applyStatPoint('defense');
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the player has {int} stat points to distribute', function (points) {
  assert.equal(this.player.stats.statPoints, points,
    `Expected ${points} stat points but got ${this.player.stats.statPoints}`);
});

Then('the player attack stat is unchanged at {int}', function (attack) {
  assert.equal(this.player.stats.attack, attack,
    `Expected attack ${attack} but got ${this.player.stats.attack}`);
});

Then('the player attack stat is {int}', function (attack) {
  assert.equal(this.player.stats.attack, attack,
    `Expected attack ${attack} but got ${this.player.stats.attack}`);
});

Then('the player defense stat is {int}', function (defense) {
  assert.equal(this.player.stats.defense, defense,
    `Expected defense ${defense} but got ${this.player.stats.defense}`);
});

Then('the player max HP is {int}', function (maxHp) {
  assert.equal(this.player.stats.maxHp, maxHp,
    `Expected maxHp ${maxHp} but got ${this.player.stats.maxHp}`);
});

Then('the player HP is {int}', function (hp) {
  assert.equal(this.player.stats.hp, hp,
    `Expected hp ${hp} but got ${this.player.stats.hp}`);
});

Then('the player has {int} stat point remaining', function (points) {
  assert.equal(this.player.stats.statPoints, points,
    `Expected ${points} stat points remaining but got ${this.player.stats.statPoints}`);
});

Then('the player has {int} stat points remaining', function (points) {
  assert.equal(this.player.stats.statPoints, points,
    `Expected ${points} stat points remaining but got ${this.player.stats.statPoints}`);
});
