/**
 * Step definitions for the DifficultyManager feature.
 *
 * DifficultyManager is a pure system with no Phaser dependency, so it can be
 * tested directly in Node.js without any mocking of the renderer.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { DifficultyManager } from '../../src/systems/DifficultyManager.js';

// ── Given ────────────────────────────────────────────────────────────────────

Given('a new DifficultyManager with no stored preference', function () {
  // Inject a null storage so no real localStorage is used; defaults to 'normal'.
  this.difficultyManager = new DifficultyManager(null);
});

// ── When ─────────────────────────────────────────────────────────────────────

When('the difficulty is set to {string}', function (level) {
  this.difficultyManager.setDifficulty(level);
});

// ── Then ─────────────────────────────────────────────────────────────────────

Then('the difficulty should be {string}', function (expected) {
  assert.equal(this.difficultyManager.getDifficulty(), expected);
});

Then('the enemy count multiplier should be less than 1', function () {
  const m = this.difficultyManager.getConfig().enemyCount;
  assert.ok(m < 1, `Expected enemy count multiplier < 1 but got ${m}`);
});

Then('the enemy count multiplier should be greater than 1', function () {
  const m = this.difficultyManager.getConfig().enemyCount;
  assert.ok(m > 1, `Expected enemy count multiplier > 1 but got ${m}`);
});

Then('the enemy HP multiplier should be less than 1', function () {
  const m = this.difficultyManager.getConfig().enemyHp;
  assert.ok(m < 1, `Expected enemy HP multiplier < 1 but got ${m}`);
});

Then('the enemy HP multiplier should be greater than 1', function () {
  const m = this.difficultyManager.getConfig().enemyHp;
  assert.ok(m > 1, `Expected enemy HP multiplier > 1 but got ${m}`);
});

Then('the enemy ATK multiplier should be less than 1', function () {
  const m = this.difficultyManager.getConfig().enemyAtk;
  assert.ok(m < 1, `Expected enemy ATK multiplier < 1 but got ${m}`);
});

Then('the enemy ATK multiplier should be greater than 1', function () {
  const m = this.difficultyManager.getConfig().enemyAtk;
  assert.ok(m > 1, `Expected enemy ATK multiplier > 1 but got ${m}`);
});
