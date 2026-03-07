import { Given, When, Then, defineStep } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { devOptions, resetDevOptions, applyToGame } from '../../src/systems/DevOptions.js';
import { Player } from '../../src/entities/Player.js';
import { FloorManager } from '../../src/systems/FloorManager.js';

// ─── Background / reset ───────────────────────────────────────────────────

Given('developer options are reset to defaults', function () {
  resetDevOptions();
});

// ─── Setting options ───────────────────────────────────────────────────────

// These steps are used as both Given and When; defineStep registers them once
// for both keywords so Cucumber does not report an ambiguous match.
defineStep('the start floor is set to {int}', function (floor) {
  devOptions.startFloor = floor;
});

defineStep('the start level is set to {int}', function (level) {
  devOptions.startLevel = level;
});

defineStep('a {string} is added to the starting items', function (key) {
  devOptions.startItems.push(key);
});

When('developer options are reset', function () {
  resetDevOptions();
});

// ─── Assertions on devOptions ─────────────────────────────────────────────

Then('the start floor should be {int}', function (expected) {
  assert.equal(devOptions.startFloor, expected);
});

Then('the start level should be {int}', function (expected) {
  assert.equal(devOptions.startLevel, expected);
});

Then('the start items should be empty', function () {
  assert.equal(devOptions.startItems.length, 0);
});

Then('the starting items should contain {string}', function (key) {
  assert.ok(devOptions.startItems.includes(key), `Expected startItems to contain "${key}"`);
});

// ─── applyToGame helpers ───────────────────────────────────────────────────

Given('a new player', function () {
  this.player = new Player(0, 0);
});

Given('a new floor manager', function () {
  this.floorManager = new FloorManager();
});

When('developer options are applied to the game', function () {
  applyToGame(this.player, this.floorManager);
});

// ─── Assertions after applyToGame ─────────────────────────────────────────

Then('the floor manager should be on floor {int}', function (expected) {
  assert.equal(this.floorManager.currentFloor, expected);
});

Then('the player inventory should be empty', function () {
  assert.equal(this.player.inventory.length, 0);
});

Then('the player attack should be {int}', function (expected) {
  assert.equal(this.player.stats.attack, expected);
});

Then('the player max HP should be {int}', function (expected) {
  assert.equal(this.player.stats.maxHp, expected);
});

Then('the player inventory should contain an item named {string}', function (name) {
  const found = this.player.inventory.some(i => i.name === name);
  assert.ok(found, `Expected player inventory to contain an item named "${name}"`);
});
