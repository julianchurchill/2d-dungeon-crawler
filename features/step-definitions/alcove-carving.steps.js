/**
 * Step definitions for the Alcove Carving feature.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { DungeonMap } from '../../src/dungeon/DungeonMap.js';
import { AlcoveCarver } from '../../src/dungeon/AlcoveCarver.js';
import { TILE } from '../../src/utils/TileTypes.js';

/** RNG that always returns 0 — every chance check succeeds. */
const ALWAYS_CARVE_RNG = { next: () => 0 };

/** RNG that always returns 1 — every chance check fails. */
const NEVER_CARVE_RNG = { next: () => 1 };

Given('a 20x20 map filled with walls except floor at {int}, {int}', function (fx, fy) {
  this.map = new DungeonMap(20, 20);
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      this.map.setTile(x, y, TILE.WALL);
    }
  }
  this.map.setTile(fx, fy, TILE.FLOOR);
});

Given('a FLOOR tile at {int}, {int}', function (x, y) {
  this.map.setTile(x, y, TILE.FLOOR);
});

Given('a 20x20 map with only a wall at {int}, {int} and floor at {int}, {int}', function (wx, wy, fx, fy) {
  this.map = new DungeonMap(20, 20);
  // All tiles default to EMPTY (0) — mirrors real dungeon tiles beyond room walls
  this.map.setTile(fx, fy, TILE.FLOOR);
  this.map.setTile(wx, wy, TILE.WALL);
});

When('the alcove is carved at {int}, {int} moving in direction {int}, {int} with always-carve RNG',
  function (wx, wy, dx, dy) {
    this.carveError = null;
    try {
      new AlcoveCarver().carve(this.map, wx, wy, dx, dy, ALWAYS_CARVE_RNG);
    } catch (e) {
      this.carveError = e;
    }
  }
);

When('the alcove is carved at {int}, {int} moving in direction {int}, {int} with never-carve RNG',
  function (wx, wy, dx, dy) {
    new AlcoveCarver().carve(this.map, wx, wy, dx, dy, NEVER_CARVE_RNG);
  }
);

Then('the tile at {int}, {int} is FLOOR', function (x, y) {
  assert.equal(this.map.getTile(x, y), TILE.FLOOR,
    `Expected FLOOR at (${x},${y}) but got ${this.map.getTile(x, y)}`);
});

Then('the tile at {int}, {int} is WALL', function (x, y) {
  assert.equal(this.map.getTile(x, y), TILE.WALL,
    `Expected WALL at (${x},${y}) but got ${this.map.getTile(x, y)}`);
});

Then('the tile at {int}, {int} is still FLOOR', function (x, y) {
  assert.equal(this.map.getTile(x, y), TILE.FLOOR,
    `Expected tile at (${x},${y}) to remain FLOOR but got ${this.map.getTile(x, y)}`);
});

Then('at least one tile adjacent to the alcove is BREAKABLE_WALL', function () {
  const DIRS = [
    { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
  ];
  let found = false;
  for (let y = 0; y < 20 && !found; y++) {
    for (let x = 0; x < 20 && !found; x++) {
      if (this.map.getTile(x, y) !== TILE.FLOOR) continue;
      for (const { dx, dy } of DIRS) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < 20 && ny >= 0 && ny < 20) {
          if (this.map.getTile(nx, ny) === TILE.BREAKABLE_WALL) {
            found = true;
            break;
          }
        }
      }
    }
  }
  assert.ok(found, 'Expected at least one BREAKABLE_WALL adjacent to an alcove floor tile');
});

Then('no error is thrown', function () {
  assert.equal(this.carveError, null,
    `Expected no error but got: ${this.carveError}`);
});
