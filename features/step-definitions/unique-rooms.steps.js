import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { UniqueRoomRegistry } from '../../src/dungeon/UniqueRoomRegistry.js';
import { UNIQUE_ROOM_DEFS } from '../../src/dungeon/UniqueRoomDefinitions.js';
import { TILE } from '../../src/utils/TileTypes.js';
import { DungeonMap } from '../../src/dungeon/DungeonMap.js';
import { placeDecorations } from '../../src/dungeon/RoomDecorationPlacer.js';
import { UniqueRoomEntryTracker } from '../../src/dungeon/UniqueRoomEntryTracker.js';

// ─── Given ────────────────────────────────────────────────────────────────

Given('a fresh unique room registry', function () {
  this.registry = new UniqueRoomRegistry();
});

Given('a fresh unique room registry with {string} marked as seen', function (id) {
  this.registry = new UniqueRoomRegistry();
  this.registry.markSeen(id);
});

// ─── When ─────────────────────────────────────────────────────────────────

When('{string} is marked as seen in the registry', function (id) {
  this.registry.markSeen(id);
});

When('the registry is reset', function () {
  this.registry.reset();
});

When('eligible unique rooms are fetched for floor {int}', function (floor) {
  this.eligible = this.registry.getEligible(floor, UNIQUE_ROOM_DEFS);
});

When('eligible unique rooms are fetched for floor {int} with force {string}',
  function (floor, forceId) {
    this.eligible = this.registry.getEligible(floor, UNIQUE_ROOM_DEFS, forceId);
  });

// ─── Then ─────────────────────────────────────────────────────────────────

Then('the registry should record {string} as seen', function (id) {
  assert.ok(this.registry.hasBeenSeen(id),
    `Expected registry to have "${id}" marked as seen`);
});

Then('the registry should not record {string} as seen', function (id) {
  assert.ok(!this.registry.hasBeenSeen(id),
    `Expected registry NOT to have "${id}" marked as seen`);
});

Then('the room {string} should be eligible', function (id) {
  const found = this.eligible.some(d => d.id === id);
  assert.ok(found, `Expected room "${id}" to be in the eligible list`);
});

Then('the room {string} should not be eligible', function (id) {
  const found = this.eligible.some(d => d.id === id);
  assert.ok(!found, `Expected room "${id}" NOT to be in the eligible list`);
});

Then('the {string} definition should have at least 1 item', function (id) {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
  assert.ok(def, `No definition found for id "${id}"`);
  assert.ok(def.items && def.items.length >= 1,
    `Expected "${id}" to have at least 1 item but got ${def.items?.length ?? 0}`);
});

Then('the {string} definition should have a minimum floor above 0', function (id) {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
  assert.ok(def, `No definition found for id "${id}"`);
  assert.ok(def.minFloor > 0,
    `Expected "${id}" minFloor > 0 but got ${def.minFloor}`);
});

Then('the {string} definition should have a non-empty entry message', function (id) {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
  assert.ok(def, `No definition found for id "${id}"`);
  assert.ok(typeof def.entryMessage === 'string' && def.entryMessage.length > 0,
    `Expected "${id}" to have a non-empty entryMessage`);
});

Then('the {string} definition should have a non-empty floor key', function (id) {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
  assert.ok(def, `No definition found for id "${id}"`);
  assert.ok(typeof def.floorKey === 'string' && def.floorKey.length > 0,
    `Expected "${id}" to have a non-empty floorKey`);
});

Then('the {string} floor key should differ from the default floor key', function (id) {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
  assert.ok(def, `No definition found for id "${id}"`);
  assert.notEqual(def.floorKey, 'tile_floor',
    `Expected "${id}" floorKey to differ from "tile_floor"`);
});

Then('the {string} definition should have a non-empty wall key', function (id) {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
  assert.ok(def, `No definition found for id "${id}"`);
  assert.ok(typeof def.wallKey === 'string' && def.wallKey.length > 0,
    `Expected "${id}" to have a non-empty wallKey`);
});

Then('the {string} wall key should differ from the default wall key', function (id) {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
  assert.ok(def, `No definition found for id "${id}"`);
  assert.notEqual(def.wallKey, 'tile_wall',
    `Expected "${id}" wallKey to differ from "tile_wall"`);
});

// ─── Decoration tile types ─────────────────────────────────────────────────

Then('the WEAPON_MOUNT tile type should be a non-zero integer', function () {
  assert.ok(typeof TILE.WEAPON_MOUNT === 'number' && TILE.WEAPON_MOUNT !== 0,
    `Expected TILE.WEAPON_MOUNT to be a non-zero integer but got ${TILE.WEAPON_MOUNT}`);
});

Then('the WEAPON_MOUNT tile type should differ from the WALL tile type', function () {
  assert.notEqual(TILE.WEAPON_MOUNT, TILE.WALL,
    'Expected TILE.WEAPON_MOUNT to differ from TILE.WALL');
});

Then('the BOOKCASE tile type should be a non-zero integer', function () {
  assert.ok(typeof TILE.BOOKCASE === 'number' && TILE.BOOKCASE !== 0,
    `Expected TILE.BOOKCASE to be a non-zero integer but got ${TILE.BOOKCASE}`);
});

Then('the BOOKCASE tile type should differ from the WALL tile type', function () {
  assert.notEqual(TILE.BOOKCASE, TILE.WALL,
    'Expected TILE.BOOKCASE to differ from TILE.WALL');
});

// ─── Decoration placement — corridor avoidance ────────────────────────────

Given('a {int}x{int} dungeon map with room at x {int} y {int} width {int} height {int}',
  function (mapW, mapH, rx, ry, rw, rh) {
    this.testMap = new DungeonMap(mapW, mapH);
    this.testRoom = { x: rx, y: ry, w: rw, h: rh };
    // Carve room floor tiles
    for (let ty = ry; ty < ry + rh; ty++) {
      for (let tx = rx; tx < rx + rw; tx++) {
        this.testMap.setTile(tx, ty, TILE.FLOOR);
      }
    }
  });

Given('a corridor floor tile at x {int} y {int} entering the room from the west',
  function (x, y) {
    this.testMap.setTile(x, y, TILE.FLOOR);
  });

When('BOOKCASE edge_rows decorations with spacing {int} are placed for the room',
  function (spacing) {
    placeDecorations(this.testMap, this.testRoom,
      { tileType: 'BOOKCASE', placement: 'edge_rows', spacing });
  });

When('WEAPON_MOUNT inner_corners decorations are placed for the room', function () {
  placeDecorations(this.testMap, this.testRoom,
    { tileType: 'WEAPON_MOUNT', placement: 'inner_corners' });
});

Then('no decoration should exist at x {int} y {int}', function (x, y) {
  const tile = this.testMap.getTile(x, y);
  assert.ok(tile !== TILE.WEAPON_MOUNT && tile !== TILE.BOOKCASE,
    `Expected no decoration at (${x},${y}) but found tile type ${tile}`);
});

// ─── Decoration tile types ─────────────────────────────────────────────────

Given('a dungeon map with a WEAPON_MOUNT tile at x {int} y {int}', function (x, y) {
  this.testMap = new DungeonMap(20, 20);
  this.testMap.setTile(x, y, TILE.WEAPON_MOUNT);
  this.testX = x;
  this.testY = y;
});

Given('a dungeon map with a BOOKCASE tile at x {int} y {int}', function (x, y) {
  this.testMap = new DungeonMap(20, 20);
  this.testMap.setTile(x, y, TILE.BOOKCASE);
  this.testX = x;
  this.testY = y;
});

Then('the tile at x {int} y {int} should not be walkable', function (x, y) {
  assert.ok(!this.testMap.isWalkable(x, y),
    `Expected tile at (${x},${y}) to be non-walkable`);
});

Then('the tile at x {int} y {int} should be opaque', function (x, y) {
  assert.ok(this.testMap.isOpaque(x, y),
    `Expected tile at (${x},${y}) to be opaque`);
});

Then('the {string} definition should specify WEAPON_MOUNT decorations', function (id) {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
  assert.ok(def, `No definition found for id "${id}"`);
  assert.ok(def.decorations && def.decorations.tileType === 'WEAPON_MOUNT',
    `Expected "${id}" decorations.tileType to be "WEAPON_MOUNT"`);
});

Then('the {string} definition should specify BOOKCASE decorations', function (id) {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
  assert.ok(def, `No definition found for id "${id}"`);
  assert.ok(def.decorations && def.decorations.tileType === 'BOOKCASE',
    `Expected "${id}" decorations.tileType to be "BOOKCASE"`);
});

// ─── UniqueRoomEntryTracker ────────────────────────────────────────────────

Given('a unique room entry tracker with room at x {int} y {int} width {int} height {int} for {string}',
  function (rx, ry, rw, rh, id) {
    const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
    this.tracker = new UniqueRoomEntryTracker();
    this.tracker.setRoom({ x: rx, y: ry, w: rw, h: rh }, def);
    this.lastMessages = null;
  });

When('the player is checked at x {int} y {int}', function (px, py) {
  this.lastMessages = this.tracker.checkEntry(px, py);
});

Then('no entry messages should be returned', function () {
  assert.equal(this.lastMessages, null,
    `Expected no entry messages but got ${JSON.stringify(this.lastMessages)}`);
});

Then('entry messages should be returned', function () {
  assert.ok(this.lastMessages && this.lastMessages.length > 0,
    'Expected entry messages to be returned but got none');
});

Then('exactly 1 entry message should be returned', function () {
  assert.ok(this.lastMessages && this.lastMessages.length === 1,
    `Expected exactly 1 entry message but got ${this.lastMessages?.length ?? 0}`);
});

Then('the entry message should contain {string}', function (text) {
  assert.ok(this.lastMessages && this.lastMessages[0].includes(text),
    `Expected entry message to contain "${text}" but got: ${this.lastMessages?.[0]}`);
});
