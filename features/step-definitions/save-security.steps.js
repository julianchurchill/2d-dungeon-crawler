/**
 * Step definitions for the Save Security feature.
 */
import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { applyPlayerStats, importSave, setStorage } from '../../src/save/SaveGame.js';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeFakeStorage() {
  const data = {};
  return {
    getItem:    (key)        => data[key] ?? null,
    setItem:    (key, value) => { data[key] = String(value); },
    removeItem: (key)        => { delete data[key]; },
  };
}

/** Encodes a plain object as the game's exportSave format. */
function encode(obj) {
  return btoa(encodeURIComponent(JSON.stringify(obj)));
}

function minimalValidSave(overrides = {}) {
  return {
    floor: 1,
    player: { stats: { hp: 30, maxHp: 30, attack: 5, defense: 2, level: 1, xp: 0, xpToNext: 20, statPoints: 0 }, gold: 0 },
    floorState: {
      width: 10,
      height: 10,
      tiles: new Array(100).fill(0),
      fovState: new Array(100).fill(0),
      playerX: 5,
      playerY: 5,
      enemies: [],
      items: [],
      uniqueRooms: { seen: [], entered: [] },
    },
    ...overrides,
  };
}

After(function () {
  setStorage(null);
});

// ── Player stats restore ──────────────────────────────────────────────────────

Given('saved player stats with an extra key {string} set to {int}', function (key, value) {
  this.savedStats = {
    hp: 25, maxHp: 30, attack: 6, defense: 3,
    level: 2, xp: 10, xpToNext: 40, statPoints: 1,
    [key]: value,
  };
  this.targetStats = {
    hp: 30, maxHp: 30, attack: 5, defense: 2,
    level: 1, xp: 0, xpToNext: 20, statPoints: 0,
  };
});

Given('saved player stats with a {string} key containing a poisoned field', function (key) {
  // JSON.parse produces a plain object with __proto__ as own key, not prototype mutation.
  this.savedStats = JSON.parse(`{"${key}":{"poisoned":true},"hp":20,"maxHp":30,"attack":5,"defense":2,"level":1,"xp":0,"xpToNext":20,"statPoints":0}`);
  this.targetStats = {
    hp: 30, maxHp: 30, attack: 5, defense: 2,
    level: 1, xp: 0, xpToNext: 20, statPoints: 0,
  };
});

When('the saved stats are applied to a fresh player', function () {
  applyPlayerStats(this.targetStats, this.savedStats);
});

Then('the player stats should not contain key {string}', function (key) {
  assert.ok(!Object.prototype.hasOwnProperty.call(this.targetStats, key),
    `Expected player stats not to contain key "${key}" but it was present`);
});

Then('Object.prototype should not have been polluted by the stats restore', function () {
  assert.equal(({}).poisoned, undefined,
    'Object.prototype was polluted by applyPlayerStats');
});

// ── importSave validation ─────────────────────────────────────────────────────

Then('importing a crafted save with floor {int} into slot {int} should return false',
  function (floor, slot) {
    this.fakeStorage = makeFakeStorage();
    setStorage(this.fakeStorage);
    const save = minimalValidSave({ floor });
    assert.equal(importSave(slot, encode(save)), false,
      `Expected importSave to reject a save with floor=${floor}`);
  });

Then('importing a crafted save where playerX {int} exceeds map width {int} into slot {int} should return false',
  function (playerX, width, slot) {
    this.fakeStorage = makeFakeStorage();
    setStorage(this.fakeStorage);
    const save = minimalValidSave();
    save.floorState.playerX = playerX;
    save.floorState.width = width;
    assert.equal(importSave(slot, encode(save)), false,
      `Expected importSave to reject playerX=${playerX} for width=${width}`);
  });

Then('importing a crafted save where tiles length {int} mismatches {int}x{int} map into slot {int} should return false',
  function (tilesLen, width, height, slot) {
    this.fakeStorage = makeFakeStorage();
    setStorage(this.fakeStorage);
    const save = minimalValidSave();
    save.floorState.width = width;
    save.floorState.height = height;
    save.floorState.tiles = new Array(tilesLen).fill(0);
    assert.equal(importSave(slot, encode(save)), false,
      `Expected importSave to reject tiles.length=${tilesLen} for ${width}x${height} map`);
  });

Then('importing a well-formed crafted save into slot {int} should return true',
  function (slot) {
    this.fakeStorage = makeFakeStorage();
    setStorage(this.fakeStorage);
    const save = minimalValidSave();
    assert.equal(importSave(slot, encode(save)), true,
      'Expected importSave to accept a well-formed save');
  });
