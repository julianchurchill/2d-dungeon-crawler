/**
 * Step definitions for the d-pad run cancellation feature.
 *
 * Tests the pure `wrapWithRunCancel` helper by supplying a mock
 * RunMovementController and checking whether cancel() was called and whether
 * the wrapped action was invoked with the correct arguments.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { wrapWithRunCancel } from '../../src/systems/MobileMenuHandler.js';
import { DIR } from '../../src/utils/Direction.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('a run is active on the run controller', function () {
  this.cancelCalled = false;
  this.runController = {
    isRunning: () => true,
    cancel: () => { this.cancelCalled = true; },
  };
  this.actionCalled = false;
  this.actionArgs = null;
});

Given('no run is active on the run controller', function () {
  this.cancelCalled = false;
  this.runController = {
    isRunning: () => false,
    cancel: () => { this.cancelCalled = true; },
  };
  this.actionCalled = false;
  this.actionArgs = null;
});

// ── When ──────────────────────────────────────────────────────────────────────

When('a mobile action wrapped with run-cancel fires', function () {
  const wrapped = wrapWithRunCancel(this.runController, (...args) => {
    this.actionCalled = true;
    this.actionArgs = args;
  });
  wrapped();
});

When('a mobile direction action wrapped with run-cancel fires with UP', function () {
  const wrapped = wrapWithRunCancel(this.runController, (...args) => {
    this.actionCalled = true;
    this.actionArgs = args;
  });
  wrapped(DIR.UP);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the run should be stopped', function () {
  assert.equal(this.cancelCalled, true);
});

Then('the wrapped action should have executed', function () {
  assert.equal(this.actionCalled, true);
});

Then('the wrapped action should have received the UP direction', function () {
  assert.deepEqual(this.actionArgs, [DIR.UP]);
});
