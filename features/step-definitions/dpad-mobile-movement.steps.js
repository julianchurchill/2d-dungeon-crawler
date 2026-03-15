/**
 * Step definitions for mobile D-pad hold detection and double-tap run detection.
 *
 * Hold detection is tested via HeldMovementTracker with a mock EventBus that
 * emits DPAD_HOLD_START / DPAD_HOLD_END events.
 *
 * Double-tap detection is tested via DoubleTapDetector directly, using an
 * injectable time function so tests can control elapsed time without real timers.
 */
import { EventEmitter } from 'node:events';
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { HeldMovementTracker } from '../../src/systems/HeldMovementTracker.js';
import { DoubleTapDetector } from '../../src/systems/DoubleTapDetector.js';
import { GameEvents } from '../../src/events/GameEvents.js';
import { DIR } from '../../src/utils/Direction.js';

/** @type {number} Threshold used by the test double-tap detector. */
const DOUBLE_TAP_MS = 300;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Create a fresh HeldMovementTracker with mock keyboard and EventBus emitters.
 * Stores them on the Cucumber World.
 *
 * @param {object} world - Cucumber World (`this` in step definitions).
 */
function createDpadTracker(world) {
  world.mockKeyboard = new EventEmitter();
  world.mockEventBus = new EventEmitter();
  world.tracker = new HeldMovementTracker(world.mockKeyboard, world.mockEventBus);
}

// ── Given ─────────────────────────────────────────────────────────────────────

Given('no direction is held via the d-pad', function () {
  createDpadTracker(this);
});

Given('the up d-pad button is held', function () {
  createDpadTracker(this);
  this.mockEventBus.emit(GameEvents.DPAD_HOLD_START, DIR.UP);
});

Given('the double-tap detector is ready', function () {
  this.currentTime = 0;
  this.detector = new DoubleTapDetector(DOUBLE_TAP_MS, () => this.currentTime);
  this.doubleTapResult = false;
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the up d-pad button is pressed', function () {
  this.mockEventBus.emit(GameEvents.DPAD_HOLD_START, DIR.UP);
});

When('the right d-pad button is pressed', function () {
  this.mockEventBus.emit(GameEvents.DPAD_HOLD_START, DIR.RIGHT);
});

When('the up d-pad button is released', function () {
  this.mockEventBus.emit(GameEvents.DPAD_HOLD_END, DIR.UP);
});

When('the right d-pad button is released', function () {
  this.mockEventBus.emit(GameEvents.DPAD_HOLD_END, DIR.RIGHT);
});

When('the game over event fires on the dpad tracker', function () {
  this.mockEventBus.emit('game-over');
});

When('the up d-pad button is tapped', function () {
  this.doubleTapResult = this.detector.tap(DIR.UP);
});

When('the up d-pad button is tapped again quickly', function () {
  // Advance time slightly but within the threshold.
  this.currentTime += DOUBLE_TAP_MS - 1;
  this.doubleTapResult = this.detector.tap(DIR.UP);
});

When('the right d-pad button is tapped quickly', function () {
  this.currentTime += DOUBLE_TAP_MS - 1;
  this.doubleTapResult = this.detector.tap(DIR.RIGHT);
});

When('time passes beyond the double-tap threshold', function () {
  this.currentTime += DOUBLE_TAP_MS + 1;
});

When('the up d-pad button is tapped again', function () {
  this.doubleTapResult = this.detector.tap(DIR.UP);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the d-pad held direction should be up', function () {
  assert.equal(this.tracker.getDir(), DIR.UP);
});

Then('the d-pad held direction should be right', function () {
  assert.equal(this.tracker.getDir(), DIR.RIGHT);
});

Then('no d-pad direction should be held', function () {
  assert.equal(this.tracker.getDir(), null);
});

Then('a double-tap should be detected', function () {
  assert.equal(this.doubleTapResult, true);
});

Then('a double-tap should not be detected', function () {
  assert.equal(this.doubleTapResult, false);
});
