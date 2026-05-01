/**
 * Step definitions for the Export / Import Save String feature.
 *
 * Reuses 'an empty save storage', 'a player on floor...', and slot steps
 * from existing step files.
 */
import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { exportSave, importSave } from '../../src/save/SaveGame.js';

Then('exporting slot {int} should return null', function (slot) {
  assert.equal(exportSave(slot), null);
});

Then('exporting slot {int} should return a non-empty string', function (slot) {
  const result = exportSave(slot);
  assert.ok(result !== null && result !== '',
    `Expected a non-empty export string for slot ${slot}`);
});

Then('importing {string} into slot {int} should return false', function (str, slot) {
  assert.equal(importSave(slot, str), false);
});

When('the save from slot {int} is exported and imported into slot {int}',
  function (fromSlot, toSlot) {
    const encoded = exportSave(fromSlot);
    assert.ok(encoded, `Expected a non-null export string from slot ${fromSlot}`);
    const ok = importSave(toSlot, encoded);
    assert.ok(ok, `Expected importSave to return true for slot ${toSlot}`);
  });
