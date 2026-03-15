/**
 * Step definitions for the inventory close button feature.
 *
 * Tests the pure `getInventoryPanelTitle` function by supplying a
 * touch-device flag and checking the returned string.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getInventoryPanelTitle } from '../../src/ui/InventoryPanel.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('the device is not a touch device', function () {
  this.isTouchDev = false;
});

Given('the device is a touch device', function () {
  this.isTouchDev = true;
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the inventory panel title text is retrieved', function () {
  this.titleText = getInventoryPanelTitle(this.isTouchDev);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the title should include {string}', function (hint) {
  assert.ok(this.titleText.includes(hint), `Expected "${this.titleText}" to include "${hint}"`);
});

Then('the title should not include {string}', function (hint) {
  assert.ok(!this.titleText.includes(hint), `Expected "${this.titleText}" NOT to include "${hint}"`);
});
