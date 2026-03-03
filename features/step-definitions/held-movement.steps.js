/**
 * Step definitions for HeldMovementTracker behaviour.
 *
 * The tracker self-registers keyboard event listeners, so these steps use a
 * Node EventEmitter as a mock keyboard and a second one as a mock EventBus.
 * Simulating a key press / release / game-event is just emitting the
 * corresponding event on the appropriate mock.
 */
import { EventEmitter } from 'node:events';
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { HeldMovementTracker } from '../../src/systems/HeldMovementTracker.js';
import { DIR } from '../../src/utils/Direction.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Create a fresh tracker with new mock keyboard and EventBus emitters,
 * storing them on the Cucumber World for use in subsequent steps.
 *
 * @param {object} world - The Cucumber World (`this` in step definitions).
 */
function createTracker(world) {
  world.mockKeyboard = new EventEmitter();
  world.mockEventBus = new EventEmitter();
  world.tracker = new HeldMovementTracker(world.mockKeyboard, world.mockEventBus);
}

// ── Given ─────────────────────────────────────────────────────────────────────

Given('no movement key is held', function () {
  createTracker(this);
});

Given('the right key is held on the keyboard', function () {
  createTracker(this);
  this.mockKeyboard.emit('keydown-RIGHT');
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the right key is pressed on the keyboard', function () {
  this.mockKeyboard.emit('keydown-RIGHT');
});

When('the up key is pressed on the keyboard', function () {
  this.mockKeyboard.emit('keydown-UP');
});

When('the right key is released on the keyboard', function () {
  this.mockKeyboard.emit('keyup-RIGHT');
});

When('the left key is released on the keyboard', function () {
  this.mockKeyboard.emit('keyup-LEFT');
});

When('the game over event fires', function () {
  this.mockEventBus.emit('game-over');
});

// ── Then ──────────────────────────────────────────────────────────────────────

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
