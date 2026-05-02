/**
 * Step definitions for the Save Floor State feature.
 *
 * Uses minimal duck-typed mocks for DungeonMap, enemies, items, and
 * UniqueRoomRegistry so the tests exercise SaveGame in isolation.
 */
import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {
  setStorage as setSaveStorage,
  serializeFloor,
  saveGame,
  loadGame,
} from '../../src/save/SaveGame.js';
import { DungeonMap } from '../../src/dungeon/DungeonMap.js';
import { FOV_STATE } from '../../src/utils/TileTypes.js';

// ── Helpers ───────────────────────────────────────────────────────────────

function makePlayer({ x = 0, y = 0, hp = 30, maxHp = 30, gold = 0 } = {}) {
  return {
    x, y,
    stats: { hp, maxHp, attack: 5, defense: 2, level: 1, xp: 0, xpToNext: 20, statPoints: 0 },
    gold,
    inventory: [],
    equippedWeapon: null, equippedRangedWeapon: null, equippedArmor: null,
    equippedHelmet: null, equippedChest: null, equippedLegs: null,
    equippedArms: null, equippedBoots: null, equippedRing1: null,
    equippedRing2: null, equippedAmulet: null,
    skillSystem: null,
  };
}

function makeDungeonMap(width, height) {
  return {
    width,
    height,
    tiles: new Uint8Array(width * height).fill(0),
    fovState: new Uint8Array(width * height).fill(0),
  };
}

function makeRegistry() {
  return {
    _seen:    new Set(),
    _entered: new Set(),
  };
}

// ── Hooks ─────────────────────────────────────────────────────────────────

After(function () {
  setSaveStorage(null);
});

// ── Steps ─────────────────────────────────────────────────────────────────

Given('a dungeon map {int} wide and {int} tall with tile {int} at position {int},{int}',
  function (width, height, tileValue, tx, ty) {
    this.dungeonMap = makeDungeonMap(width, height);
    this.dungeonMap.tiles[ty * width + tx] = tileValue;
    this.enemies = this.enemies ?? [];
    this.floorItems = this.floorItems ?? [];
    this.registry = this.registry ?? makeRegistry();
  });

Given('a player at position {int},{int} on floor {int} with {int} HP and {int} gold',
  function (px, py, floor, hp, gold) {
    this.player = makePlayer({ x: px, y: py, hp, gold });
    this.floorManager = { currentFloor: floor };
    this.enemies = this.enemies ?? [];
    this.floorItems = this.floorItems ?? [];
    this.registry = this.registry ?? makeRegistry();
  });

Given('an enemy of type {string} at {int},{int} with {int} of {int} HP on the floor',
  function (type, x, y, hp, maxHp) {
    this.enemies.push({
      type, x, y,
      stats: { hp, maxHp, attack: 3, defense: 1 },
      xp: 10,
      isChampion: false,
      isBoss: false,
      segments: null,
    });
  });

Given('a champion enemy of type {string} at {int},{int} with drop item {string}',
  function (type, x, y, dropItemId) {
    this.enemies.push({
      type, x, y,
      stats: { hp: 12, maxHp: 12, attack: 4, defense: 2 },
      xp: 20,
      isChampion: true,
      isBoss: false,
      segments: null,
      dropItem: { id: dropItemId },
    });
  });

Given('a creeping mass with segments at {int},{int} and {int},{int}',
  function (x1, y1, x2, y2) {
    this.enemies.push({
      type: 'creeping_mass',
      x: x1, y: y1,
      stats: { hp: 30, maxHp: 30, attack: 6, defense: 1 },
      xp: 60,
      isChampion: false,
      isBoss: false,
      segments: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
    });
  });

Given('an item {string} at {int},{int} with count {int} on the floor',
  function (id, x, y, count) {
    this.floorItems.push({ id, x, y, count });
  });

Given('the unique room {string} has been seen', function (roomId) {
  this.registry._seen.add(roomId);
});

Given('the unique room {string} has been entered', function (roomId) {
  this.registry._entered.add(roomId);
});

When('the floor state is serialised', function () {
  this.floorState = serializeFloor(
    this.dungeonMap,
    this.enemies ?? [],
    this.floorItems ?? [],
    this.player,
    this.registry ?? makeRegistry(),
  );
});

When('the game is saved with floor state', function () {
  const floorData = serializeFloor(
    this.dungeonMap,
    this.enemies ?? [],
    this.floorItems ?? [],
    this.player,
    this.registry ?? makeRegistry(),
  );
  saveGame(this.player, this.floorManager, floorData);
});

Then('the floor state should have width {int} and height {int}', function (width, height) {
  assert.equal(this.floorState.width, width);
  assert.equal(this.floorState.height, height);
});

Then('the floor state tile at position {int},{int} should be {int}',
  function (tx, ty, expected) {
    const idx = ty * this.floorState.width + tx;
    assert.equal(this.floorState.tiles[idx], expected,
      `Expected tile ${expected} at ${tx},${ty} but got ${this.floorState.tiles[idx]}`);
  });

Then('the floor state should contain an enemy of type {string} at {int},{int} with hp {int}',
  function (type, x, y, hp) {
    const found = this.floorState.enemies.find(e => e.type === type && e.x === x && e.y === y);
    assert.ok(found, `Expected enemy "${type}" at ${x},${y} in floor state`);
    assert.equal(found.hp, hp, `Expected hp ${hp} but got ${found.hp}`);
  });

Then('the floor state should contain a champion enemy of type {string} at {int},{int}',
  function (type, x, y) {
    const found = this.floorState.enemies.find(e => e.type === type && e.x === x && e.y === y);
    assert.ok(found, `Expected champion "${type}" at ${x},${y}`);
    assert.equal(found.isChampion, true, 'Expected isChampion to be true');
  });

Then('that champion\'s drop item id should be {string}', function (id) {
  const champ = this.floorState.enemies.find(e => e.isChampion);
  assert.ok(champ, 'No champion found in floor state');
  assert.equal(champ.dropItemId, id, `Expected dropItemId "${id}" but got "${champ.dropItemId}"`);
});

Then('the floor state should contain a creeping_mass with {int} segments', function (count) {
  const mass = this.floorState.enemies.find(e => e.type === 'creeping_mass');
  assert.ok(mass, 'Expected a creeping_mass in floor state');
  assert.equal(mass.segments.length, count,
    `Expected ${count} segments but got ${mass.segments.length}`);
});

Then('the floor state should contain item {string} at {int},{int}', function (id, x, y) {
  const found = this.floorState.items.find(i => i.id === id && i.x === x && i.y === y);
  assert.ok(found, `Expected item "${id}" at ${x},${y} in floor state`);
});

Then('the floor state should record player position as {int},{int}', function (x, y) {
  assert.equal(this.floorState.playerX, x);
  assert.equal(this.floorState.playerY, y);
});

Then('the floor state unique rooms seen should include {string}', function (roomId) {
  assert.ok(this.floorState.uniqueRooms.seen.includes(roomId),
    `Expected "${roomId}" in uniqueRooms.seen`);
});

Then('the floor state unique rooms entered should include {string}', function (roomId) {
  assert.ok(this.floorState.uniqueRooms.entered.includes(roomId),
    `Expected "${roomId}" in uniqueRooms.entered`);
});

Then('the loaded save should contain floor state data', function () {
  const save = loadGame();
  assert.ok(save, 'Expected a saved game to exist');
  assert.ok(save.floorState, 'Expected save to contain floorState');
  assert.ok(save.floorState.tiles, 'Expected floorState to contain tiles');
});

// ── FOV state serialization ───────────────────────────────────────────────────

Given('a real dungeon map {int} wide and {int} tall with explored tile at {int},{int}',
  function (width, height, tx, ty) {
    const map = new DungeonMap(width, height);
    map.setFovState(tx, ty, FOV_STATE.EXPLORED);
    this.dungeonMap = map;
    this.player     = this.player ?? makePlayer();
    this.enemies    = [];
    this.floorItems = [];
    this.registry   = this.registry ?? makeRegistry();
  });

Then('the floor state fovState at {int},{int} should be EXPLORED', function (x, y) {
  const idx = y * this.floorState.width + x;
  assert.equal(this.floorState.fovState[idx], FOV_STATE.EXPLORED,
    `Expected fovState[${x},${y}] to be EXPLORED (1) but got ${this.floorState.fovState?.[idx]}`);
});

Then('the floor state fovState at {int},{int} should be UNEXPLORED', function (x, y) {
  const idx = y * this.floorState.width + x;
  assert.equal(this.floorState.fovState[idx], FOV_STATE.UNEXPLORED,
    `Expected fovState[${x},${y}] to be UNEXPLORED (0) but got ${this.floorState.fovState?.[idx]}`);
});

Then('a DungeonMap restored from the floor state has EXPLORED fovState at {int},{int}',
  function (x, y) {
    assert.ok(this.floorState.fovState, 'Expected fovState to be present in floor state');
    const restoredMap = new DungeonMap(this.floorState.width, this.floorState.height);
    for (let i = 0; i < this.floorState.fovState.length; i++) {
      restoredMap.fovState[i] = this.floorState.fovState[i];
    }
    assert.equal(restoredMap.getFovState(x, y), FOV_STATE.EXPLORED,
      `Expected restored fovState at ${x},${y} to be EXPLORED`);
  });
