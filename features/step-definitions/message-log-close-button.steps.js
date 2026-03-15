/**
 * Step definitions for message log close button feature.
 *
 * Tests the pure `getMessageLogHeaderText(isTouchDev)` function directly,
 * which has no Phaser dependency and can be exercised in Node.js.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getMessageLogHeaderText } from '../../src/ui/MessageLog.js';

// ── When ──────────────────────────────────────────────────────────────────────

When('the message log panel header text is requested for a non-touch device', function () {
  this.headerText = getMessageLogHeaderText(false);
});

When('the message log panel header text is requested for a touch device', function () {
  this.headerText = getMessageLogHeaderText(true);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the header text should include the ESC close hint', function () {
  assert.ok(this.headerText.includes('ESC'), `Expected header to include 'ESC', got: "${this.headerText}"`);
});

Then('the header text should not include the ESC close hint', function () {
  assert.ok(!this.headerText.includes('ESC'), `Expected header not to include 'ESC', got: "${this.headerText}"`);
});
