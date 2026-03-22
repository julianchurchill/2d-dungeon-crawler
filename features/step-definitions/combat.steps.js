import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { resolveMeleeAttack } from '../../src/systems/CombatSystem.js';
import { Player } from '../../src/entities/Player.js';
import { Enemy } from '../../src/entities/Enemy.js';
import { createRNG } from '../../src/utils/RNG.js';

// --- Given ---

Given('a player with {int} attack power', function (attack) {
  this.player = new Player(0, 0);
  this.player.stats.attack = attack;
});

Given('a player with {int} HP and {int} defense', function (hp, defense) {
  this.player = new Player(0, 0);
  this.player.stats.hp = hp;
  this.player.stats.maxHp = hp;
  this.player.stats.defense = defense;
});

Given('a player at full health with {int} defense', function (defense) {
  this.player = new Player(0, 0);
  this.player.stats.defense = defense;
  this.previousHp = this.player.stats.hp;
});

Given('a goblin with {int} HP and {int} defense', function (hp, defense) {
  this.enemy = new Enemy(1, 0, 'goblin');
  this.enemy.stats.hp = hp;
  this.enemy.stats.maxHp = hp;
  this.enemy.stats.defense = defense;
});

Given('a goblin with {int} attack', function (attack) {
  this.enemy = new Enemy(1, 0, 'goblin');
  this.enemy.stats.attack = attack;
});

// --- When ---

When('the player attacks the goblin with seed {int}', function (seed) {
  this.result = resolveMeleeAttack(this.player, this.enemy, createRNG(seed));
});

When('the goblin attacks the player with seed {int}', function (seed) {
  this.result = resolveMeleeAttack(this.enemy, this.player, createRNG(seed));
});

When('the player attacks the goblin {int} times with consecutive seeds', function (times) {
  this.attackResults = [];
  for (let i = 0; i < times; i++) {
    const freshEnemy = new Enemy(1, 0, 'goblin');
    freshEnemy.stats.defense = 0;
    this.attackResults.push(resolveMeleeAttack(this.player, freshEnemy, createRNG(i)));
  }
});

// --- Then ---

Then('the goblin should have taken damage', function () {
  assert.ok(this.enemy.stats.hp < this.enemy.stats.maxHp, 'Expected goblin HP to be reduced');
});

Then('the attack result message should mention the goblin', function () {
  assert.ok(
    this.result.messages[0].toLowerCase().includes('goblin'),
    `Expected message to mention goblin, got: "${this.result.messages[0]}"`
  );
});

Then('every attack should have dealt at least 1 damage', function () {
  for (const r of this.attackResults) {
    assert.ok(r.damage >= 1, `Expected damage >= 1, got ${r.damage}`);
  }
});

Then('the goblin should be dead', function () {
  assert.ok(this.enemy.isDead(), 'Expected goblin to be dead');
});

Then('the attack result should indicate a kill', function () {
  assert.ok(this.result.killed, 'Expected result.killed to be true');
});

Then('the player HP should be lower than before the attack', function () {
  assert.ok(
    this.player.stats.hp < this.previousHp,
    `Expected player HP (${this.player.stats.hp}) to be less than before (${this.previousHp})`
  );
});

Then('the player should be dead', function () {
  assert.ok(this.player.isDead(), 'Expected player to be dead');
});

Then('the attack result damage should be {int}', function (expected) {
  assert.equal(this.result.damage, expected, `Expected damage ${expected}, got ${this.result.damage}`);
});

Then('the attack result message should start with {string}', function (prefix) {
  assert.ok(
    this.result.messages[0].startsWith(prefix),
    `Expected message to start with "${prefix}", got: "${this.result.messages[0]}"`
  );
});

Then('the attack result message should contain {string}', function (text) {
  assert.ok(
    this.result.messages[0].includes(text),
    `Expected message to contain "${text}", got: "${this.result.messages[0]}"`
  );
});

Then('the attack result message should not contain {string}', function (text) {
  assert.ok(
    !this.result.messages[0].includes(text),
    `Expected message not to contain "${text}", got: "${this.result.messages[0]}"`
  );
});

Then('the attack result message should end with {string}', function (suffix) {
  assert.ok(
    this.result.messages[0].endsWith(suffix),
    `Expected message to end with "${suffix}", got: "${this.result.messages[0]}"`
  );
});
