/**
 * Step definitions for HoldRepeatScheduler behaviour.
 *
 * Uses a fake scheduler in place of setTimeout so the delay can be triggered
 * synchronously in tests without needing real timers.
 */
import { EventEmitter } from 'node:events';
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { HeldMovementTracker } from '../../src/systems/HeldMovementTracker.js';
import { HoldRepeatScheduler } from '../../src/systems/HoldRepeatScheduler.js';
import { DIR } from '../../src/utils/Direction.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a fake scheduler that captures callbacks without invoking real timers.
 * Call `flush()` to trigger all pending callbacks synchronously.
 *
 * @returns {{ schedule: function, flush: function, pendingCount: number }}
 */
function makeFakeScheduler() {
  const pending = [];
  return {
    schedule: (fn) => pending.push(fn),
    flush:    () => pending.splice(0).forEach(fn => fn()),
    get pendingCount() { return pending.length; },
  };
}

/**
 * Sets up a fresh HeldMovementTracker + HoldRepeatScheduler on the Cucumber
 * World, optionally pressing a key to prime the tracker.
 *
 * @param {object} world   - The Cucumber World (`this` in step definitions).
 * @param {string|null} pressKey - Optional key name to emit keydown for (e.g. 'RIGHT').
 */
function createSchedulerWorld(world, pressKey = null) {
  world.mockKeyboard  = new EventEmitter();
  world.mockEventBus  = new EventEmitter();
  world.fakeScheduler = makeFakeScheduler();
  world.tracker       = new HeldMovementTracker(world.mockKeyboard, world.mockEventBus);
  world.holdRepeat    = new HoldRepeatScheduler(
    world.tracker,
    70,
    world.fakeScheduler.schedule.bind(world.fakeScheduler),
  );
  world.repeatResult = null;
  if (pressKey) {
    world.mockKeyboard.emit(`keydown-${pressKey}`);
  }
}

// ── Given ─────────────────────────────────────────────────────────────────────

Given('the repeat scheduler is ready with no key held', function () {
  createSchedulerWorld(this);
});

Given('the repeat scheduler is ready with the right key held', function () {
  createSchedulerWorld(this, 'RIGHT');
});

// ── When ──────────────────────────────────────────────────────────────────────

When('auto-repeat is checked', function () {
  this.holdRepeat.schedule((dir) => { this.repeatResult = dir; });
});

When('auto-repeat is checked and the repeat delay elapses', function () {
  this.holdRepeat.schedule((dir) => { this.repeatResult = dir; });
  this.fakeScheduler.flush();
});

When('the right key is released', function () {
  this.mockKeyboard.emit('keyup-RIGHT');
});

When('the repeat delay elapses', function () {
  this.fakeScheduler.flush();
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('no repeat callback is pending', function () {
  assert.equal(this.fakeScheduler.pendingCount, 0);
});

Then('a repeat callback is pending', function () {
  assert.ok(this.fakeScheduler.pendingCount > 0, 'expected a pending repeat callback');
});

Then('the repeat fires in the right direction', function () {
  assert.equal(this.repeatResult, DIR.RIGHT);
});

Then('no repeat fires', function () {
  assert.equal(this.repeatResult, null);
});
