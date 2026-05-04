/**
 * Step definitions for the Global Stats feature.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {
  loadGlobalStats,
  recordGlobalFloorReached,
  recordGlobalKill,
  recordGlobalBossKill,
  recordGlobalConsumableUsed,
  recordGlobalWallBroken,
  recordGlobalGoldGained,
  recordGlobalGoldSpent,
  getGlobalStats,
  setGlobalStorage,
  resetGlobalStats,
  clearGlobalStatsMemory,
} from '../../src/save/GlobalStatsStore.js';
import { formatGlobalStats } from '../../src/ui/RunStatsFormatter.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a fake localStorage-compatible storage object.
 * @returns {{ getItem: Function, setItem: Function, removeItem: Function }}
 */
function makeFakeStorage() {
  const data = {};
  return {
    getItem:    (key)        => data[key] ?? null,
    setItem:    (key, value) => { data[key] = String(value); },
    removeItem: (key)        => { delete data[key]; },
  };
}

// Reset the store after every scenario so state doesn't bleed between tests.
import { After } from '@cucumber/cucumber';
After(function () {
  resetGlobalStats();
  setGlobalStorage(null);
});

// ── Given ─────────────────────────────────────────────────────────────────────

Given('an empty global stats storage', function () {
  this.globalStorage = makeFakeStorage();
  setGlobalStorage(this.globalStorage);
  resetGlobalStats();
});

Given('global stats with {int} unique boss killed of type {string}', function (count, type) {
  this.globalStorage = makeFakeStorage();
  setGlobalStorage(this.globalStorage);
  resetGlobalStats();
  for (let i = 0; i < count; i++) recordGlobalBossKill(type);
});

Given('global stats with no bosses killed', function () {
  this.globalStorage = makeFakeStorage();
  setGlobalStorage(this.globalStorage);
  resetGlobalStats();
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the global stats are loaded', function () {
  loadGlobalStats();
});

When('the global floor {int} is recorded', function (floor) {
  recordGlobalFloorReached(floor);
});

When('a global kill of type {string} is recorded', function (type) {
  recordGlobalKill(type);
});

When('a global boss kill of type {string} is recorded', function (type) {
  recordGlobalBossKill(type);
});

When('a global consumable {string} use is recorded', function (id) {
  recordGlobalConsumableUsed(id);
});

When('a global wall broken is recorded', function () {
  recordGlobalWallBroken();
});

When('{int} global gold gained is recorded', function (amount) {
  recordGlobalGoldGained(amount);
});

When('{int} global gold spent is recorded', function (amount) {
  recordGlobalGoldSpent(amount);
});

When('the global stats are reloaded', function () {
  // Simulate a page reload: discard in-memory state without clearing storage,
  // then reload from it.
  clearGlobalStatsMemory();
  loadGlobalStats();
});

When('the global stats are formatted', function () {
  this.formattedGlobal = formatGlobalStats(getGlobalStats());
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the global deepest floor is {int}', function (expected) {
  assert.equal(getGlobalStats().deepestFloor, expected);
});

Then('the global walls broken is {int}', function (expected) {
  assert.equal(getGlobalStats().wallsBroken, expected);
});

Then('the global gold gained is {int}', function (expected) {
  assert.equal(getGlobalStats().goldGained, expected);
});

Then('the global gold spent is {int}', function (expected) {
  assert.equal(getGlobalStats().goldSpent, expected);
});

Then('the global kills map is empty', function () {
  assert.deepEqual(getGlobalStats().kills, {});
});

Then('the global consumables map is empty', function () {
  assert.deepEqual(getGlobalStats().consumablesUsed, {});
});

Then('the global unique bosses killed is empty', function () {
  assert.equal(getGlobalStats().uniqueBossesKilled.length, 0);
});

Then('the global kill count for {string} is {int}', function (type, expected) {
  assert.equal(getGlobalStats().kills[type] ?? 0, expected);
});

Then('the global consumable count for {string} is {int}', function (id, expected) {
  assert.equal(getGlobalStats().consumablesUsed[id] ?? 0, expected);
});

Then('the global unique bosses killed count is {int}', function (expected) {
  assert.equal(getGlobalStats().uniqueBossesKilled.length, expected);
});

Then('the global unique bosses killed includes {string}', function (type) {
  assert.ok(
    getGlobalStats().uniqueBossesKilled.includes(type),
    `Expected uniqueBossesKilled to include "${type}" but got: ${JSON.stringify(getGlobalStats().uniqueBossesKilled)}`,
  );
});

Then('the unique bosses section contains {string}', function (label) {
  const found = this.formattedGlobal.uniqueBossesKilled.some(r => r.label === label || r.label.includes(label));
  assert.ok(found, `Expected uniqueBossesKilled section to contain "${label}" but got: ${JSON.stringify(this.formattedGlobal.uniqueBossesKilled)}`);
});
