/**
 * Step definitions for RunMovementController behaviour.
 *
 * RunMovementController is pure JS with no Phaser dependency, so these steps
 * instantiate it directly and drive it with plain boolean arguments.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { RunMovementController } from '../../src/systems/RunMovementController.js';
import { DIR } from '../../src/utils/Direction.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('no run is in progress', function () {
  this.runController = new RunMovementController();
});

Given('a run to the right is in progress', function () {
  this.runController = new RunMovementController();
  this.runController.start(DIR.RIGHT);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the player starts a run to the right', function () {
  this.runController.start(DIR.RIGHT);
});

When('the player starts a run upward', function () {
  this.runController.start(DIR.UP);
});

When('the run is checked with a clear path and nothing visible', function () {
  this.runController.nextDir(false, false);
});

When('the run is checked with a blocked path and nothing visible', function () {
  this.runController.nextDir(true, false);
});

When('the run is checked with a clear path and an entity visible', function () {
  this.runController.nextDir(false, true);
});

When('the run is cancelled', function () {
  this.runController.cancel();
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the run should be active', function () {
  assert.equal(this.runController.isRunning(), true);
});

Then('the run should still be active', function () {
  assert.equal(this.runController.isRunning(), true);
});

Then('the run should not be active', function () {
  assert.equal(this.runController.isRunning(), false);
});

Then('the run direction should be right', function () {
  assert.equal(this.runController.getDir(), DIR.RIGHT);
});

Then('the run direction should be up', function () {
  assert.equal(this.runController.getDir(), DIR.UP);
});
