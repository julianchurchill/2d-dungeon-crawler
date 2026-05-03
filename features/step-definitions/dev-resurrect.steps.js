/**
 * Step definitions for the dev-mode resurrect feature.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';
import { SkillSystem } from '../../src/systems/SkillSystem.js';

Given('a player with max HP of {int} and current HP of {int}', function (maxHp, currentHp) {
  this.player = new Player(0, 0, new SkillSystem(null, [], []));
  this.player.stats.maxHp = maxHp;
  this.player.stats.hp = currentHp;
});

When('the player is resurrected', function () {
  this.player.resurrect();
});

Then("the player's current HP should be {int}", function (expected) {
  assert.equal(this.player.stats.hp, expected,
    `Expected HP to be ${expected} but got ${this.player.stats.hp}`);
});

Then("the player's max HP should still be {int}", function (expected) {
  assert.equal(this.player.stats.maxHp, expected,
    `Expected maxHp to be ${expected} but got ${this.player.stats.maxHp}`);
});
