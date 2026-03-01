import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { DungeonMap } from '../../src/dungeon/DungeonMap.js';
import { computeFOV } from '../../src/fov/ShadowcastFOV.js';
import { TILE, FOV_STATE } from '../../src/utils/TileTypes.js';

const MAP_SIZE = 50;

function buildOpenMap() {
  const map = new DungeonMap(MAP_SIZE, MAP_SIZE);
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      map.setTile(x, y, TILE.FLOOR);
    }
  }
  return map;
}

function applyFOV(map, originX, originY, radius) {
  // First mark all currently VISIBLE tiles as EXPLORED
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.getFovState(x, y) === FOV_STATE.VISIBLE) {
        map.setFovState(x, y, FOV_STATE.EXPLORED);
      }
    }
  }
  computeFOV(
    originX, originY, radius,
    (x, y) => map.isOpaque(x, y),
    (x, y) => map.setFovState(x, y, FOV_STATE.VISIBLE)
  );
}

// --- Given ---

Given('an open dungeon map', function () {
  this.fovMap = buildOpenMap();
});

Given('an open dungeon map with a wall at {int}, {int}', function (wx, wy) {
  this.fovMap = buildOpenMap();
  this.fovMap.setTile(wx, wy, TILE.WALL);
});

Given('FOV has been computed from position {int}, {int} with radius {int}', function (x, y, r) {
  applyFOV(this.fovMap, x, y, r);
});

// --- When ---

When('FOV is computed from position {int}, {int} with radius {int}', function (x, y, r) {
  applyFOV(this.fovMap, x, y, r);
});

// --- Then ---

Then('tile {int}, {int} should be visible', function (x, y) {
  const state = this.fovMap.getFovState(x, y);
  assert.equal(
    state, FOV_STATE.VISIBLE,
    `Expected tile (${x}, ${y}) to be VISIBLE, got state ${state}`
  );
});

Then('tile {int}, {int} should not be visible', function (x, y) {
  const state = this.fovMap.getFovState(x, y);
  assert.notEqual(
    state, FOV_STATE.VISIBLE,
    `Expected tile (${x}, ${y}) NOT to be visible, but it was`
  );
});

Then('tile {int}, {int} should be explored but not currently visible', function (x, y) {
  const state = this.fovMap.getFovState(x, y);
  assert.equal(
    state, FOV_STATE.EXPLORED,
    `Expected tile (${x}, ${y}) to be EXPLORED, got state ${state}`
  );
});
