import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {
  getProgress,
  completeAchievement,
  uncompleteAchievement,
} from '../../src/achievements/AchievementStore.js';

/**
 * Step definitions for the dev-mode achievement toggle.
 *
 * Reuses the "the achievement system is initialised" Given and kill/event
 * When steps from achievements.steps.js (registered globally in the same run).
 * The steps here simulate exactly what the dev-mode checkbox click handler
 * in AchievementsScene does: call completeAchievement or uncompleteAchievement
 * on the singleton store and assert the resulting state.
 */

When('the dev toggle completes the {string} achievement', function (id) {
  completeAchievement(id, this.store);
});

When('the dev toggle uncompletes the {string} achievement', function (id) {
  uncompleteAchievement(id, this.store);
});

Then('the {string} progress should be marked as completed', function (id) {
  const { completed } = getProgress(id, this.store);
  assert.strictEqual(completed, true,
    `Expected achievement "${id}" to be completed`);
});

Then('the {string} progress should not be marked as completed', function (id) {
  const { completed } = getProgress(id, this.store);
  assert.strictEqual(completed, false,
    `Expected achievement "${id}" not to be completed`);
});

Then('the {string} progress count should be {int}', function (id, expected) {
  const { count } = getProgress(id, this.store);
  assert.strictEqual(count, expected,
    `Expected progress count for "${id}" to be ${expected} but got ${count}`);
});
