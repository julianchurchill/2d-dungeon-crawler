import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS } from '../../src/achievements/AchievementDefinitions.js';

/**
 * Step definitions for the achievements screen display list.
 *
 * Reuses the "the achievement system is initialised" Given and the
 * "the player kills N goblins" When steps from achievements.steps.js,
 * which are registered globally in the same Cucumber run.
 */

When('the achievements display list is retrieved', function () {
  this.displayList = this.system.getDisplayList();
});

Then('the display list should contain {int} entries', function (expected) {
  assert.equal(this.displayList.length, expected,
    `Expected ${expected} entries but got ${this.displayList.length}`);
});

Then('the {string} entry should show {string}', function (id, text) {
  const entry = this.displayList.find(e => e.id === id);
  assert.ok(entry, `No display entry found with id "${id}"`);
  assert.ok(entry.text.includes(text),
    `Expected entry text "${entry.text}" to include "${text}"`);
});

Then('the {string} entry should not show {string}', function (id, text) {
  const entry = this.displayList.find(e => e.id === id);
  assert.ok(entry, `No display entry found with id "${id}"`);
  assert.ok(!entry.text.includes(text),
    `Expected entry text "${entry.text}" not to include "${text}"`);
});

Then('the {string} entry should be marked as completed', function (id) {
  const entry = this.displayList.find(e => e.id === id);
  assert.ok(entry, `No display entry found with id "${id}"`);
  assert.strictEqual(entry.completed, true,
    `Expected entry "${id}" to be marked as completed`);
});

Then('the {string} entry should not be marked as completed', function (id) {
  const entry = this.displayList.find(e => e.id === id);
  assert.ok(entry, `No display entry found with id "${id}"`);
  assert.strictEqual(entry.completed, false,
    `Expected entry "${id}" not to be marked as completed`);
});
