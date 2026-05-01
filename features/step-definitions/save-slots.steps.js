/**
 * Step definitions for the Multiple Save Slots feature.
 *
 * Reuses 'an empty save storage' and 'a player on floor...' from the
 * shared save-game steps so no duplicate step definitions are introduced.
 */
import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {
  saveGame,
  loadGame,
  hasSave,
  deleteSave,
  listSaves,
} from '../../src/save/SaveGame.js';

When('the game is saved to slot {int}', function (slot) {
  saveGame(this.player, this.floorManager, null, slot);
});

When('slot {int} is deleted', function (slot) {
  deleteSave(slot);
});

Then('slot {int} should have a save', function (slot) {
  assert.ok(hasSave(slot), `Expected slot ${slot} to have a save`);
});

Then('slot {int} should not have a save', function (slot) {
  assert.equal(hasSave(slot), false, `Expected slot ${slot} to have no save`);
});

Then('loading slot {int} should return floor {int}', function (slot, floor) {
  const save = loadGame(slot);
  assert.ok(save, `Expected a save in slot ${slot}`);
  assert.equal(save.floor, floor);
});

Then('the save in slot {int} should include a savedAt timestamp', function (slot) {
  const save = loadGame(slot);
  assert.ok(save, `Expected a save in slot ${slot}`);
  assert.ok(save.savedAt, 'Expected save to have a savedAt field');
  assert.ok(!isNaN(Date.parse(save.savedAt)), 'Expected savedAt to be a valid date string');
});

Then('listSaves should return {int} entries', function (count) {
  const saves = listSaves();
  assert.equal(saves.length, count);
});

Then('the entry for slot {int} should not be empty', function (slot) {
  const entry = listSaves()[slot];
  assert.ok(entry, `Expected an entry for slot ${slot}`);
  assert.equal(entry.empty, false, `Expected slot ${slot} entry to not be empty`);
});

Then('the entry for slot {int} should have floor {int}', function (slot, floor) {
  const entry = listSaves()[slot];
  assert.ok(entry, `Expected an entry for slot ${slot}`);
  assert.equal(entry.floor, floor);
});

Then('the entry for slot {int} should be empty', function (slot) {
  const entry = listSaves()[slot];
  assert.ok(entry, `Expected an entry for slot ${slot}`);
  assert.equal(entry.empty, true, `Expected slot ${slot} entry to be empty`);
});

Then('the entry for slot {int} should include level {int}', function (slot, level) {
  const entry = listSaves()[slot];
  assert.ok(entry, `Expected an entry for slot ${slot}`);
  assert.equal(entry.level, level);
});
