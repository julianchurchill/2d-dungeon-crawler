import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { FloorBuilder } from '../../src/systems/FloorBuilder.js';
import { DungeonMap } from '../../src/dungeon/DungeonMap.js';
import { UNIQUE_ROOM_DEFS } from '../../src/dungeon/UniqueRoomDefinitions.js';
import { TILE } from '../../src/utils/TileTypes.js';
import { tilesetManager } from '../../src/systems/TilesetManager.js';

/**
 * A minimal scene-context stub sufficient to construct a FloorBuilder
 * without importing Phaser or wiring real game state.
 */
function makeMinimalScene() {
  return {};
}

// --- Given ---

Given('a FloorBuilder bound to a minimal scene context', function () {
  this.builder = new FloorBuilder(makeMinimalScene());
});

Given('a FloorBuilder with a spying mapRT and a room suitable for the necropolis library', function () {
  this.drawFrameCalls = [];

  const mapSize = 30;
  const dungeonMap = new DungeonMap(mapSize, mapSize);

  // Carve a 10x8 room at (5,5): floor interior, wall border.
  const room = { x: 5, y: 5, w: 10, h: 8 };
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      dungeonMap.setTile(x, y, TILE.FLOOR);
    }
  }
  // Surround the room with walls (1-tile border).
  for (let x = room.x - 1; x <= room.x + room.w; x++) {
    dungeonMap.setTile(x, room.y - 1, TILE.WALL);
    dungeonMap.setTile(x, room.y + room.h, TILE.WALL);
  }
  for (let y = room.y; y < room.y + room.h; y++) {
    dungeonMap.setTile(room.x - 1, y, TILE.WALL);
    dungeonMap.setTile(room.x + room.w, y, TILE.WALL);
  }

  const drawFrameCalls = this.drawFrameCalls;

  this.builder = new FloorBuilder({
    dungeonMap,
    mapRT: {
      drawFrame(key, frame, x, y) { drawFrameCalls.push({ key, frame, x, y }); },
    },
  });
  this.uniqueRoom = room;
});

// --- When ---

When('the necropolis library unique room is spawned', function () {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === 'necropolis_library');
  assert.ok(def, 'necropolis_library definition not found');
  this.builder._paintUniqueRoomTiles(this.uniqueRoom, def);
});

// --- Then ---

Then('the builder exposes {word}', function (methodName) {
  assert.ok(
    typeof this.builder[methodName] === 'function',
    `Expected FloorBuilder to have method '${methodName}'`,
  );
});

Then('drawFrame should have been called with the necropolis library floor key', function () {
  const expectedKey = tilesetManager.getTileKey('tile_floor_necropolis_library');
  const called = this.drawFrameCalls.some(c => c.key === expectedKey);
  assert.ok(
    called,
    `Expected drawFrame to have been called with '${expectedKey}', ` +
    `but calls were: ${JSON.stringify(this.drawFrameCalls.map(c => c.key))}`,
  );
});

Then('drawFrame should have been called with the necropolis library wall key', function () {
  const expectedKey = tilesetManager.getTileKey('tile_wall_necropolis_library');
  const called = this.drawFrameCalls.some(c => c.key === expectedKey);
  assert.ok(
    called,
    `Expected drawFrame to have been called with '${expectedKey}', ` +
    `but calls were: ${JSON.stringify(this.drawFrameCalls.map(c => c.key))}`,
  );
});
