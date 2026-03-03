/**
 * Step definitions for HeldMovementTracker behaviour.
 *
 * The tracker self-registers keyboard event listeners, so these steps use a
 * Node EventEmitter as a mock keyboard and a second one as a mock EventBus.
 *
 * A hold threshold of 0 ms is used in tests so that "held" steps can resolve
 * with a single event-loop tick (await nextTick) rather than wall-clock time,
 * while "briefly tapped" steps work by releasing before that tick arrives.
 */
import { EventEmitter } from 'node:events';
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { HeldMovementTracker } from '../../src/systems/HeldMovementTracker.js';
import { DIR } from '../../src/utils/Direction.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolves after one event-loop tick, allowing any pending setTimeout(fn, 0)
 * callbacks (i.e. the hold threshold timer) to fire before the next step runs.
 *
 * @returns {Promise<void>}
 */
const nextTick = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Create a fresh tracker with new mock keyboard and EventBus emitters,
 * storing them on the Cucumber World for use in subsequent steps.
 * Uses a hold threshold of 0 ms so tests stay fast and deterministic.
 *
 * @param {object} world - The Cucumber World (`this` in step definitions).
 */
function createTracker(world) {
  world.mockKeyboard = new EventEmitter();
  world.mockEventBus = new EventEmitter();
  world.tracker = new HeldMovementTracker(world.mockKeyboard, world.mockEventBus, 0);
}

// ── Given ─────────────────────────────────────────────────────────────────────

Given('no movement key is held', function () {
  createTracker(this);
});

Given('the right key is held on the keyboard', async function () {
  createTracker(this);
  this.mockKeyboard.emit('keydown-RIGHT');
  await nextTick(); // wait for the 0 ms hold timer to fire
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the right key is pressed and held on the keyboard', async function () {
  this.mockKeyboard.emit('keydown-RIGHT');
  await nextTick();
});

When('the up key is pressed and held on the keyboard', async function () {
  this.mockKeyboard.emit('keydown-UP');
  await nextTick();
});

When('the right key is pressed on the keyboard', function () {
  // Simulates what _beginPlayerTurn sees: checked synchronously on the same
  // event-loop tick as the initial keydown, before any hold timer can fire.
  this.mockKeyboard.emit('keydown-RIGHT');
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
