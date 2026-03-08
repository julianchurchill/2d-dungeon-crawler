import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AchievementSystem } from '../../src/achievements/AchievementSystem.js';
import { ACHIEVEMENTS } from '../../src/achievements/AchievementDefinitions.js';
import { getProgress, completeAchievement } from '../../src/achievements/AchievementStore.js';

/**
 * Step definitions for the achievement system.
 *
 * Each scenario uses its own isolated store (a plain object) so tests
 * cannot bleed state into one another.  The AchievementSystem and store
 * functions all accept an injectable store parameter for this purpose.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the Goblin Killer definition from the default achievement list. */
function goblinKillerDef() {
  return ACHIEVEMENTS.find(a => a.id === 'goblin_killer');
}

/** Returns the Burrower definition from the default achievement list. */
function burrowerDef() {
  return ACHIEVEMENTS.find(a => a.id === 'burrower');
}

// ── Given ────────────────────────────────────────────────────────────────────

Given('the achievement system is initialised', function () {
  // Isolated store per scenario — no singleton pollution.
  this.store = {};
  this.system = new AchievementSystem(ACHIEVEMENTS, this.store);
});

Given('the Goblin Killer achievement has already been completed', function () {
  this.store = {};
  this.system = new AchievementSystem(ACHIEVEMENTS, this.store);
  // Pre-complete the achievement so we can verify it is not completed again.
  completeAchievement('goblin_killer', this.store);
  // Already completed once; subsequent kills must not increment this count.
  this.completionCount = 1;
});

// ── When ─────────────────────────────────────────────────────────────────────

When('the player kills a goblin', function () {
  const completed = this.system.onEnemyKilled('goblin');
  this.completionCount = (this.completionCount || 0) + completed.length;
});

When('the player kills {int} goblins', function (count) {
  for (let i = 0; i < count; i++) {
    const completed = this.system.onEnemyKilled('goblin');
    this.completionCount = (this.completionCount || 0) + completed.length;
  }
});

When('the player kills another goblin', function () {
  const completed = this.system.onEnemyKilled('goblin');
  this.completionCount += completed.length;
});

When('the player reaches dungeon floor {int}', function (floor) {
  this.completionCount = (this.completionCount || 0) + this.system.onFloorReached(floor).length;
});

// ── Then ─────────────────────────────────────────────────────────────────────

Then('the Goblin Killer achievement progress should be {int}', function (expected) {
  const { count } = getProgress('goblin_killer', this.store);
  assert.strictEqual(count, expected);
});

Then('the Goblin Killer achievement should be completed', function () {
  const { completed } = getProgress('goblin_killer', this.store);
  assert.strictEqual(completed, true);
});

Then('the Goblin Killer achievement completion count should still be {int}', function (expected) {
  // completionCount tracks how many times the system returned the achievement
  // as newly-completed — it must never exceed 1.
  assert.strictEqual(this.completionCount, expected);
});

Then('the Goblin Killer progress text should include {string}', function (expected) {
  const text = this.system.formatProgress(goblinKillerDef());
  assert.ok(text.includes(expected), `Expected "${text}" to include "${expected}"`);
});

Then('the Goblin Killer progress text should not include {string}', function (unexpected) {
  const text = this.system.formatProgress(goblinKillerDef());
  assert.ok(!text.includes(unexpected), `Expected "${text}" not to include "${unexpected}"`);
});

Then('the Burrower achievement should be completed', function () {
  const { completed } = getProgress('burrower', this.store);
  assert.strictEqual(completed, true);
});

Then('the Burrower achievement should not be completed', function () {
  const { completed } = getProgress('burrower', this.store);
  assert.strictEqual(completed, false);
});
