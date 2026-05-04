/**
 * Step definitions for the Run Stats feature.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';
import {
  saveGame,
  loadGame,
  setStorage as setSaveStorage,
} from '../../src/save/SaveGame.js';

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

// ── Given ─────────────────────────────────────────────────────────────────────

Given('a fresh player', function () {
  this.player = new Player(0, 0);
});

Given(
  'a fresh player with run stats: floor {int}, {int} goblin kills, {int} health_potions used, {int} wall broken, {int} gold gained, {int} gold spent',
  function (floor, kills, potions, walls, goldGained, goldSpent) {
    this.player = new Player(0, 0);
    this.player.recordFloorReached(floor);
    for (let i = 0; i < kills; i++) this.player.recordKill('goblin');
    for (let i = 0; i < potions; i++) this.player.recordConsumableUsed('health_potion');
    for (let i = 0; i < walls; i++) this.player.recordWallBroken();
    this.player.recordGoldGained(goldGained);
    this.player.recordGoldSpent(goldSpent);
  },
);

Given('a legacy save in slot {int} with no runStats field', function (slot) {
  this.fakeStorage = makeFakeStorage();
  setSaveStorage(this.fakeStorage);
  const legacy = {
    floor: 1,
    player: {
      stats: { hp: 30, maxHp: 30, attack: 5, defense: 2, level: 1, xp: 0, xpToNext: 20, statPoints: 0 },
      gold: 0,
      inventory: [],
      equipped: {},
      activeSkills: [],
      inactiveSkills: [],
    },
    floorState: null,
  };
  this.fakeStorage.setItem(`save_game_${slot}`, JSON.stringify(legacy));
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the player records floor {int}', function (floor) {
  this.player.recordFloorReached(floor);
});

When('the player records a kill of type {string}', function (type) {
  this.player.recordKill(type);
});

When('the player records use of consumable {string}', function (id) {
  this.player.recordConsumableUsed(id);
});

When('the player records a wall broken', function () {
  this.player.recordWallBroken();
});

When('the player records {int} gold gained', function (amount) {
  this.player.recordGoldGained(amount);
});

When('the player records {int} gold spent', function (amount) {
  this.player.recordGoldSpent(amount);
});

When('the player is saved to slot {int} on floor {int}', function (slot, floor) {
  saveGame(this.player, { currentFloor: floor }, null, slot);
});

When('the save is loaded from slot {int}', function (slot) {
  this.loaded = loadGame(slot);
});

// ── Then (live player) ────────────────────────────────────────────────────────

Then('the run stats deepest floor is {int}', function (expected) {
  assert.equal(this.player.runStats.deepestFloor, expected);
});

Then('the run stats kills map is empty', function () {
  assert.deepEqual(this.player.runStats.kills, {});
});

Then('the run stats consumables map is empty', function () {
  assert.deepEqual(this.player.runStats.consumablesUsed, {});
});

Then('the run stats walls broken is {int}', function (expected) {
  assert.equal(this.player.runStats.wallsBroken, expected);
});

Then('the run stats gold gained is {int}', function (expected) {
  assert.equal(this.player.runStats.goldGained, expected);
});

Then('the run stats gold spent is {int}', function (expected) {
  assert.equal(this.player.runStats.goldSpent, expected);
});

Then('the run stats kill count for {string} is {int}', function (type, expected) {
  assert.equal(this.player.runStats.kills[type] ?? 0, expected);
});

Then('the run stats usage count for {string} is {int}', function (id, expected) {
  assert.equal(this.player.runStats.consumablesUsed[id] ?? 0, expected);
});

// ── Then (loaded save) ────────────────────────────────────────────────────────

Then('the loaded run stats deepest floor is {int}', function (expected) {
  assert.equal(this.loaded.player.runStats?.deepestFloor ?? 1, expected);
});

Then('the loaded run stats kill count for {string} is {int}', function (type, expected) {
  assert.equal(this.loaded.player.runStats?.kills?.[type] ?? 0, expected);
});

Then('the loaded run stats usage count for {string} is {int}', function (id, expected) {
  assert.equal(this.loaded.player.runStats?.consumablesUsed?.[id] ?? 0, expected);
});

Then('the loaded run stats walls broken is {int}', function (expected) {
  assert.equal(this.loaded.player.runStats?.wallsBroken ?? 0, expected);
});

Then('the loaded run stats gold gained is {int}', function (expected) {
  assert.equal(this.loaded.player.runStats?.goldGained ?? 0, expected);
});

Then('the loaded run stats gold spent is {int}', function (expected) {
  assert.equal(this.loaded.player.runStats?.goldSpent ?? 0, expected);
});
