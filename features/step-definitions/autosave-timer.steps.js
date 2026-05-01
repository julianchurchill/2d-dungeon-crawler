/**
 * Step definitions for the Autosave Timer feature.
 *
 * Uses a fake scheduler so tests control when the timer fires without
 * waiting for real time.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AutosaveTimer } from '../../src/save/AutosaveTimer.js';

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Returns a fake scheduler whose tick() manually fires the stored callback,
 * and a cancel() that clears it.
 */
function makeFakeScheduler() {
  const s = {
    _callback: null,
    _active:   false,
    schedule(callback, _intervalMs) {
      s._callback = callback;
      s._active   = true;
      return 'fake-id';
    },
    cancel(_id) {
      s._active   = false;
      s._callback = null;
    },
    tick() {
      if (s._active && s._callback) s._callback();
    },
  };
  return s;
}

// ── Steps ─────────────────────────────────────────────────────────────────

Given('an autosave timer with an interval of {int} ms', function (intervalMs) {
  this.scheduler = makeFakeScheduler();
  this.intervalMs = intervalMs;
});

Given('a fake save callback', function () {
  this.saveCallCount = 0;
  this.onSave = () => { this.saveCallCount++; };
});

When('the timer is started', function () {
  if (!this.timer) {
    this.timer = new AutosaveTimer(this.intervalMs, this.onSave, this.scheduler);
  }
  this.timer.start();
});

When('the interval elapses {int} time(s)', function (n) {
  for (let i = 0; i < n; i++) this.scheduler.tick();
});

When('the interval elapses once', function () {
  this.scheduler.tick();
});

When('the timer is stopped', function () {
  this.timer.stop();
});

Then('the save callback should have been called {int} time(s)', function (n) {
  assert.equal(this.saveCallCount, n,
    `Expected save callback to be called ${n} time(s) but was called ${this.saveCallCount}`);
});
