import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { AchievementSystem } from '../../src/achievements/AchievementSystem.js';
import { ACHIEVEMENTS } from '../../src/achievements/AchievementDefinitions.js';
import { getProgress, completeAchievement } from '../../src/achievements/AchievementStore.js';
import { GameEvents } from '../../src/events/GameEvents.js';

/**
 * Step definitions for the achievement system.
 *
 * Each scenario injects a fresh EventEmitter as the event bus so tests are
 * fully isolated from the singleton EventBus and from each other.
 * The store is also a plain object injected per scenario.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a minimal EventEmitter-compatible bus for test injection.
 * Uses Node's built-in EventEmitter, which matches the Phaser mock used
 * during testing.
 *
 * @returns {EventEmitter}
 */
function makeEventBus() {
  return new EventEmitter();
}

// ── Given ────────────────────────────────────────────────────────────────────

Given('the achievement system is initialised', function () {
  // Isolated store and bus per scenario — no singleton pollution.
  this.store = {};
  this.eventBus = makeEventBus();
  this.system = new AchievementSystem(ACHIEVEMENTS, this.store, this.eventBus);
  this.unlockedAchievements = [];
  this.eventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, (a) => this.unlockedAchievements.push(a));
});

Given('the Goblin Killer achievement has already been completed', function () {
  this.store = {};
  this.eventBus = makeEventBus();
  this.system = new AchievementSystem(ACHIEVEMENTS, this.store, this.eventBus);
  // Track new unlocks fired through the bus (not the pre-existing completion).
  this.unlockedAchievements = [];
  this.eventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, (a) => this.unlockedAchievements.push(a));
  // Pre-complete the achievement directly so the system skips it on the next event.
  completeAchievement('goblin_killer', this.store);
  // completionCount starts at 1 to represent the already-completed state.
  this.completionCount = 1;
});

// ── When ─────────────────────────────────────────────────────────────────────

When('the player kills a goblin', function () {
  this.eventBus.emit(GameEvents.ENEMY_KILLED, 'goblin');
});

When('the player kills {int} goblins', function (count) {
  for (let i = 0; i < count; i++) {
    this.eventBus.emit(GameEvents.ENEMY_KILLED, 'goblin');
  }
});

When('the player kills another goblin', function () {
  this.eventBus.emit(GameEvents.ENEMY_KILLED, 'goblin');
});

When('the player reaches dungeon floor {int}', function (floor) {
  this.eventBus.emit(GameEvents.FLOOR_CHANGED, floor);
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
  // completionCount starts at 1 (pre-existing) plus any new ACHIEVEMENT_UNLOCKED
  // events fired through the bus.  Must never exceed 1.
  const total = this.completionCount + this.unlockedAchievements.filter(a => a.id === 'goblin_killer').length;
  assert.strictEqual(total, expected);
});

Then('the Goblin Killer progress text should include {string}', function (expected) {
  const def = ACHIEVEMENTS.find(a => a.id === 'goblin_killer');
  const text = this.system.formatProgress(def);
  assert.ok(text.includes(expected), `Expected "${text}" to include "${expected}"`);
});

Then('the Goblin Killer progress text should not include {string}', function (unexpected) {
  const def = ACHIEVEMENTS.find(a => a.id === 'goblin_killer');
  const text = this.system.formatProgress(def);
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

Then('the Burrower progress text should include {string}', function (expected) {
  const def = ACHIEVEMENTS.find(a => a.id === 'burrower');
  const text = this.system.formatProgress(def);
  assert.ok(text.includes(expected), `Expected "${text}" to include "${expected}"`);
});
