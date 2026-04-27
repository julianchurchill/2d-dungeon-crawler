/**
 * Step definitions for the Save Game feature.
 *
 * Uses minimal duck-typed mocks for Player and FloorManager so the tests
 * exercise SaveGame in isolation without Phaser dependencies.
 */
import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {
  saveGame,
  loadGame,
  hasSave,
  deleteSave,
  setStorage as setSaveStorage,
} from '../../src/save/SaveGame.js';

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Creates a fake storage object with the same interface as localStorage.
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

/**
 * Builds a minimal Player mock.
 * @param {object} opts
 * @returns {object}
 */
function makePlayer({ hp = 30, maxHp = 30, gold = 0, inventory = [], equipped = {}, skills = null } = {}) {
  return {
    stats: { hp, maxHp, attack: 5, defense: 2, level: 1, xp: 0, xpToNext: 20, statPoints: 0 },
    gold,
    inventory,
    equippedWeapon:       equipped.weapon       ?? null,
    equippedRangedWeapon: equipped.rangedWeapon ?? null,
    equippedArmor:        equipped.armor        ?? null,
    equippedHelmet:       equipped.helmet       ?? null,
    equippedChest:        equipped.chest        ?? null,
    equippedLegs:         equipped.legs         ?? null,
    equippedArms:         equipped.arms         ?? null,
    equippedBoots:        equipped.boots        ?? null,
    equippedRing1:        equipped.ring1        ?? null,
    equippedRing2:        equipped.ring2        ?? null,
    equippedAmulet:       equipped.amulet       ?? null,
    skillSystem: skills,
  };
}

// ── Hooks ─────────────────────────────────────────────────────────────────

After(function () {
  setSaveStorage(null);
});

// ── Steps ─────────────────────────────────────────────────────────────────

Given('an empty save storage', function () {
  this.fakeStorage = makeFakeStorage();
  setSaveStorage(this.fakeStorage);
});

Given('a player on floor {int} with {int} of {int} HP and {int} gold',
  function (floor, hp, maxHp, gold) {
    this.player = makePlayer({ hp, maxHp, gold });
    this.floorManager = { currentFloor: floor };
  });

Given('the player has {int} of item {string} in their inventory', function (count, id) {
  this.player.inventory.push({ id, count });
});

Given('the player has item {string} equipped as weapon', function (id) {
  this.player.equippedWeapon = { id };
});

Given('the player has an active skill {string} with critChance {float}',
  function (id, critChance) {
    this.player.skillSystem = {
      _activeSkills:   [{ id, _baseCritChance: critChance }],
      _inactiveSkills: [],
    };
  });

When('the game is saved', function () {
  saveGame(this.player, this.floorManager);
});

When('the save is deleted', function () {
  deleteSave();
});

Then('hasSave should return false', function () {
  assert.equal(hasSave(), false, 'Expected hasSave() to return false');
});

Then('hasSave should return true', function () {
  assert.equal(hasSave(), true, 'Expected hasSave() to return true');
});

Then('the loaded save should have floor {int}', function (floor) {
  const save = loadGame();
  assert.equal(save.floor, floor, `Expected floor ${floor} but got ${save.floor}`);
});

Then('the loaded save should have hp {int} and maxHp {int} and gold {int}',
  function (hp, maxHp, gold) {
    const save = loadGame();
    assert.equal(save.player.stats.hp, hp,
      `Expected hp ${hp} but got ${save.player.stats.hp}`);
    assert.equal(save.player.stats.maxHp, maxHp,
      `Expected maxHp ${maxHp} but got ${save.player.stats.maxHp}`);
    assert.equal(save.player.gold, gold,
      `Expected gold ${gold} but got ${save.player.gold}`);
  });

Then('the loaded save should include {int} of item {string} in inventory',
  function (count, id) {
    const save = loadGame();
    const entry = save.player.inventory.find(i => i.id === id);
    assert.ok(entry, `Expected item "${id}" in saved inventory`);
    assert.equal(entry.count, count,
      `Expected count ${count} for "${id}" but got ${entry.count}`);
  });

Then('the loaded save should have {string} equipped as weapon', function (id) {
  const save = loadGame();
  assert.equal(save.player.equipped.weapon, id,
    `Expected weapon "${id}" but got "${save.player.equipped.weapon}"`);
});

Then('the loaded save should have an active skill {string} with critChance {float}',
  function (id, critChance) {
    const save = loadGame();
    const skill = save.player.activeSkills.find(s => s.id === id);
    assert.ok(skill, `Expected active skill "${id}" in saved data`);
    assert.equal(skill.critChance, critChance,
      `Expected critChance ${critChance} but got ${skill.critChance}`);
  });
