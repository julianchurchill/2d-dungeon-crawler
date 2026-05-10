/**
 * Step definitions for the Hidden Passage feature.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { DungeonMap } from '../../src/dungeon/DungeonMap.js';
import { HiddenPassagePlacer, checkDraftProximity } from '../../src/dungeon/HiddenPassagePlacer.js';
import { getHiddenRoomLoot } from '../../src/items/LootTables.js';
import { TILE } from '../../src/utils/TileTypes.js';

/** RNG that always returns 0 — every chance check succeeds. */
const ALWAYS_RNG = { next: () => 0 };

/** RNG that always returns 1 — every chance check fails. */
const NEVER_RNG  = { next: () => 1 };

// ── Shared helpers ──────────────────────────────────────────────────────────

/**
 * Builds a 30x20 map with a rectangular floor region and a single breakable
 * wall tile on the right edge of that region.
 */
function makeMapWithRoom(x1, y1, x2, y2, bwx, bwy) {
  const map = new DungeonMap(30, 20);
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      map.setTile(x, y, TILE.FLOOR);
    }
  }
  // Surround with WALL tiles, mirroring buildWalls output.
  for (let y = y1 - 1; y <= y2 + 1; y++) {
    for (let x = x1 - 1; x <= x2 + 1; x++) {
      if (map.getTile(x, y) === TILE.EMPTY) {
        map.setTile(x, y, TILE.WALL);
      }
    }
  }
  map.setTile(bwx, bwy, TILE.BREAKABLE_WALL);
  return map;
}

// ── Room-carving steps ──────────────────────────────────────────────────────

Given(
  'a 30x20 map with a room floor from {int},{int} to {int},{int} and a breakable wall at {int},{int}',
  function (x1, y1, x2, y2, bwx, bwy) {
    this.map      = makeMapWithRoom(x1, y1, x2, y2, bwx, bwy);
    this.bwx      = bwx;
    this.bwy      = bwy;
    this.passages = null;
  },
);

Given('a FLOOR tile at {int},{int}', function (x, y) {
  this.map.setTile(x, y, TILE.FLOOR);
});

When('the hidden passage placer runs with always-succeed RNG', function () {
  this.passages = new HiddenPassagePlacer().place(this.map, ALWAYS_RNG, false);
});

When('the hidden passage placer runs with never-succeed RNG', function () {
  this.passages = new HiddenPassagePlacer().place(this.map, NEVER_RNG, false);
});

When('the hidden passage placer runs with force and never-succeed RNG', function () {
  this.passages = new HiddenPassagePlacer().place(this.map, NEVER_RNG, true);
});

Then('floor tiles exist beyond the wall at {int},{int} in the outward direction', function (wx, wy) {
  // Floor is to the left of the wall, so outward is right (+x).
  let found = false;
  for (let x = wx + 1; x < this.map.width; x++) {
    if (this.map.getTile(x, wy) === TILE.FLOOR)        { found = true; break; }
    if (this.map.getTile(x, wy) === TILE.WALL)         break;
    if (this.map.getTile(x, wy) === TILE.EMPTY)        break;
  }
  assert.ok(found, `Expected a FLOOR tile beyond the hidden passage wall at (${wx},${wy})`);
});

Then('the tile at {int},{int} is HIDDEN_PASSAGE_WALL', function (x, y) {
  assert.equal(
    this.map.getTile(x, y), TILE.HIDDEN_PASSAGE_WALL,
    `Expected HIDDEN_PASSAGE_WALL at (${x},${y}) but got ${this.map.getTile(x, y)}`,
  );
});

Then('the tile at {int},{int} is still BREAKABLE_WALL', function (x, y) {
  assert.equal(
    this.map.getTile(x, y), TILE.BREAKABLE_WALL,
    `Expected tile at (${x},${y}) to remain BREAKABLE_WALL but got ${this.map.getTile(x, y)}`,
  );
});

Then('all hidden room FLOOR tiles beyond x {int} are within the map bounds', function (minX) {
  for (let y = 0; y < this.map.height; y++) {
    for (let x = minX + 1; x < 30; x++) {
      if (this.map.getTile(x, y) === TILE.FLOOR) {
        assert.ok(this.map.inBounds(x, y),
          `Hidden room floor tile at (${x},${y}) is out of bounds`);
      }
    }
  }
});

Then('the result contains {int} passage with wallX {int} and wallY {int}',
  function (count, wallX, wallY) {
    assert.equal(this.passages.length, count,
      `Expected ${count} passage(s) but got ${this.passages.length}`);
    const match = this.passages.find(p => p.wallX === wallX && p.wallY === wallY);
    assert.ok(match, `Expected a passage entry at wallX=${wallX}, wallY=${wallY}`);
  },
);

// ── Draft proximity steps ───────────────────────────────────────────────────

Given('a dungeon map with a HIDDEN_PASSAGE_WALL at {int},{int}', function (x, y) {
  this.map = new DungeonMap(30, 20);
  this.map.setTile(x, y, TILE.HIDDEN_PASSAGE_WALL);
  this.triggeredWalls = null;
});

Given('the draft-shown set is empty', function () {
  this.shownSet = new Set();
});

Given('the draft-shown set already contains wall {int},{int}', function (x, y) {
  this.shownSet = new Set([`${x},${y}`]);
});

When('proximity is checked for a player at {int},{int}', function (px, py) {
  this.triggeredWalls = checkDraftProximity(this.map, px, py, this.shownSet);
});

Then('the draft message is triggered for the wall at {int},{int}', function (x, y) {
  assert.ok(
    this.triggeredWalls.some(w => w.x === x && w.y === y),
    `Expected draft triggered for wall (${x},${y}) but got: ${JSON.stringify(this.triggeredWalls)}`,
  );
});

Then('no draft message is triggered', function () {
  assert.equal(this.triggeredWalls.length, 0,
    `Expected no draft messages but got: ${JSON.stringify(this.triggeredWalls)}`);
});

// ── Loot steps ──────────────────────────────────────────────────────────────

When('hidden room loot is drawn for floor {int}', function (floor) {
  this.lootResult = getHiddenRoomLoot(floor, ALWAYS_RNG);
});

Then('the result is a non-null item definition', function () {
  assert.ok(this.lootResult != null, 'Expected a non-null item definition');
  assert.ok(this.lootResult.id,      'Expected item definition to have an id');
  assert.ok(this.lootResult.name,    'Expected item definition to have a name');
});
