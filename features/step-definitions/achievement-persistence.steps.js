/**
 * Step definitions for the Achievement Persistence feature.
 *
 * Uses a fake in-memory storage object (matching the localStorage interface)
 * so tests can run without a browser environment.
 */
import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {
  resetAchievementStore,
  incrementProgress,
  getProgress,
  setStorage,
  loadAchievementStore,
} from '../../src/achievements/AchievementStore.js';

// ── Helpers ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'achievements';

/**
 * Creates a fake storage object with the same interface as localStorage.
 * @returns {{ getItem: Function, setItem: Function, removeItem: Function, _data: Object }}
 */
function makeFakeStorage() {
  const data = {};
  return {
    _data: data,
    getItem:    (key)        => data[key] ?? null,
    setItem:    (key, value) => { data[key] = String(value); },
    removeItem: (key)        => { delete data[key]; },
  };
}

// Reset the module-level _storage after each scenario so it doesn't leak
// into unrelated step files that call mutating store functions.
After(function () {
  setStorage(null);
});

// ── Steps ─────────────────────────────────────────────────────────────────

Given('an empty achievement store with a fake storage', function () {
  this.store = {};
  this.fakeStorage = makeFakeStorage();
  setStorage(this.fakeStorage);
  resetAchievementStore(this.store);
});

Given('a fake storage containing saved achievement progress for {string} with count {int}',
  function (id, count) {
    this.store = {};
    this.fakeStorage = makeFakeStorage();
    const saved = { [id]: { count, completed: false } };
    this.fakeStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    setStorage(this.fakeStorage);
  });

When('progress is incremented for {string}', function (id) {
  incrementProgress(id, 1, this.store);
});

When('the achievement store is loaded from storage', function () {
  loadAchievementStore(this.store);
});

When('the achievement store is reset', function () {
  resetAchievementStore(this.store);
});

Then('the storage should contain the serialised achievement state', function () {
  const raw = this.fakeStorage.getItem(STORAGE_KEY);
  assert.ok(raw !== null, 'Expected storage to contain achievement data but it was empty');
  const parsed = JSON.parse(raw);
  assert.ok(typeof parsed === 'object' && parsed !== null, 'Storage value should be a JSON object');
});

Then('the achievement store should have count {int} for {string}', function (count, id) {
  const progress = getProgress(id, this.store);
  assert.equal(progress.count, count,
    `Expected count ${count} for "${id}" but got ${progress.count}`);
});

Then('the storage entry should be empty', function () {
  const raw = this.fakeStorage.getItem(STORAGE_KEY);
  assert.ok(raw === null || raw === '{}',
    `Expected storage to be empty but got: ${raw}`);
});
