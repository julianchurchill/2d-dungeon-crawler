/**
 * Step definitions for dev-mode invincibility toggles.
 *
 * Drives CombatSystem.resolveMeleeAttack with the defenderIsInvincible option
 * to verify that invincible defenders take zero damage and cannot be killed.
 */
import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { resolveMeleeAttack } from '../../src/systems/CombatSystem.js';
import { Player } from '../../src/entities/Player.js';
import { Enemy } from '../../src/entities/Enemy.js';
import { createRNG } from '../../src/utils/RNG.js';

/** Fixed-seed RNG so test outcomes are deterministic. */
const rng = createRNG(42);

// ── Given ─────────────────────────────────────────────────────────────────────

Given('enemy invincibility is off', function () {
  this.enemiesInvincible = false;
});

Given('enemy invincibility is on', function () {
  this.enemiesInvincible = true;
});

Given('player invincibility is off', function () {
  this.playerInvincible = false;
});

Given('player invincibility is on', function () {
  this.playerInvincible = true;
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the player attacks an enemy with base attack power {int}', function (attack) {
  this.attacker = new Player(0, 0);
  this.attacker.stats.attack = attack;
  this.attacker.stats.defense = 0;

  this.defender = new Enemy(0, 0, 'goblin');
  this.defender.stats.hp = 1; // minimal HP so a normal hit would kill

  this.combatResult = resolveMeleeAttack(
    this.attacker, this.defender, rng,
    { defenderIsInvincible: this.enemiesInvincible },
  );
});

When('an enemy attacks the player with base attack power {int}', function (attack) {
  this.attacker = new Enemy(0, 0, 'goblin');
  this.attacker.stats.attack = attack;

  this.defender = new Player(0, 0);
  this.defender.stats.hp = 1; // minimal HP so a normal hit would kill
  this.defender.stats.defense = 0;

  this.combatResult = resolveMeleeAttack(
    this.attacker, this.defender, rng,
    { defenderIsInvincible: this.playerInvincible },
  );
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the enemy takes damage greater than 0', function () {
  assert.ok(this.combatResult.damage > 0, `Expected damage > 0 but got ${this.combatResult.damage}`);
});

Then('the enemy takes no damage', function () {
  assert.equal(this.combatResult.damage, 0);
});

Then('the enemy is not killed', function () {
  assert.equal(this.combatResult.killed, false);
});

Then('the player takes damage greater than 0', function () {
  assert.ok(this.combatResult.damage > 0, `Expected damage > 0 but got ${this.combatResult.damage}`);
});

Then('the player takes no damage', function () {
  assert.equal(this.combatResult.damage, 0);
});

Then('the player is not killed', function () {
  assert.equal(this.combatResult.killed, false);
});
