/**
 * Step definitions for the mobile menu button feature.
 *
 * Tests the pure `handleMobileMenuPress` function by supplying
 * mock callbacks and checking which one was called.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { handleMobileMenuPress } from '../../src/systems/MobileMenuHandler.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('the message log is closed', function () {
  this.messageLogOpen = false;
  this.logClosed = false;
  this.achievementsOpened = false;
});

Given('the message log is open', function () {
  this.messageLogOpen = true;
  this.logClosed = false;
  this.achievementsOpened = false;
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the mobile menu button is pressed', function () {
  handleMobileMenuPress(
    this.messageLogOpen,
    () => { this.logClosed = true; },
    () => { this.achievementsOpened = true; },
  );
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the achievements screen should open', function () {
  assert.equal(this.achievementsOpened, true);
});

Then('the message log should close', function () {
  assert.equal(this.logClosed, true);
});

Then('the achievements screen should not open', function () {
  assert.equal(this.achievementsOpened, false);
});
