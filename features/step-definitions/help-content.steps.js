/**
 * Step definitions for the in-game help content feature.
 *
 * Tests the pure `getHelpContent` helper by supplying a touch-device flag
 * and checking that the returned text contains the appropriate control
 * descriptions.
 */
import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getHelpContent } from '../../src/systems/HelpContent.js';

// Given 'the device is a touch device' and 'the device is not a touch device'
// are already defined in inventory-close-button.steps.js

// ── When ──────────────────────────────────────────────────────────────────────

When('the help content is retrieved', function () {
  // Flatten all section headings and lines into one string for easy assertions.
  const sections = getHelpContent(this.isTouchDev);
  this.helpText = sections
    .map(s => [s.heading, ...s.lines].join(' '))
    .join(' ');
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the help content should mention {string}', function (phrase) {
  assert.ok(
    this.helpText.includes(phrase),
    `Expected help text to include "${phrase}" but got:\n${this.helpText}`,
  );
});

Then('the help content should not mention {string}', function (phrase) {
  assert.ok(
    !this.helpText.includes(phrase),
    `Expected help text NOT to include "${phrase}" but got:\n${this.helpText}`,
  );
});
