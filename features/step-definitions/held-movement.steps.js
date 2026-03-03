/**
 * Step definitions for HeldMovementTracker behaviour.
 * Tests that pressing and releasing direction keys correctly tracks
 * the currently held movement direction.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { HeldMovementTracker } from '../../src/systems/HeldMovementTracker.js';
import { DIR } from '../../src/utils/Direction.js';

// ── Given ────────────────────────────────────────────────────────────────────

Given('no movement key is held', function () {
  this.tracker = new HeldMovementTracker();
});

Given('the player is holding the right key', function () {
  this.tracker = new HeldMovementTracker();
  this.tracker.press(DIR.RIGHT);
});

// ── When ─────────────────────────────────────────────────────────────────────

When('the player presses and holds the right key', function () {
  this.tracker.press(DIR.RIGHT);
});

When('the player presses and holds the up key', function () {
  this.tracker.press(DIR.UP);
});

When('the player releases the right key', function () {
  this.tracker.release(DIR.RIGHT);
});

When('the player releases the left key', function () {
  this.tracker.release(DIR.LEFT);
});

// ── Then ─────────────────────────────────────────────────────────────────────

Then('the held movement direction should be right', function () {
  assert.equal(this.tracker.getDir(), DIR.RIGHT);
});

Then('the held movement direction should be up', function () {
  assert.equal(this.tracker.getDir(), DIR.UP);
});

Then('no movement key should be held', function () {
  assert.equal(this.tracker.getDir(), null);
});

Then('the held movement direction should still be right', function () {
  assert.equal(this.tracker.getDir(), DIR.RIGHT);
});
