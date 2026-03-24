import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {
  getProgress,
  uncompleteAchievement,
} from '../../src/achievements/AchievementStore.js';
import { ACHIEVEMENTS } from '../../src/achievements/AchievementDefinitions.js';
import { devCompleteAchievement } from '../../src/achievements/devCompleteAchievement.js';
import { GameEvents } from '../../src/events/GameEvents.js';

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
  devCompleteAchievement(id, this.store, ACHIEVEMENTS, this.eventBus);
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

Then('an ACHIEVEMENT_UNLOCKED event should have been emitted for {string}', function (id) {
  const emitted = (this.unlockedAchievements ?? []).some(a => a.id === id);
  assert.strictEqual(emitted, true,
    `Expected ACHIEVEMENT_UNLOCKED to have been emitted for "${id}"`);
});

Then('no ACHIEVEMENT_UNLOCKED event should have been emitted', function () {
  const count = (this.unlockedAchievements ?? []).length;
  assert.strictEqual(count, 0,
    `Expected no ACHIEVEMENT_UNLOCKED events but got ${count}`);
});
