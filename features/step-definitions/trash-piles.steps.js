/**
 * Step definitions for trash pile tile placement.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { TILE } from '../../src/utils/TileTypes.js';
import { DungeonMap } from '../../src/dungeon/DungeonMap.js';
import { TrashPilePlacer } from '../../src/dungeon/TrashPilePlacer.js';

const TRASH_TILES = [TILE.TRASH_PILE_1, TILE.TRASH_PILE_2, TILE.TRASH_PILE_3];

// ── Given ────────────────────────────────────────────────────────────────────

Given('a dungeon map with trash pile variant {int} at position {int},{int}', function (variant, x, y) {
  this.map = new DungeonMap(20, 20);
  this.map.setTile(x, y, TRASH_TILES[variant - 1]);
  this.testX = x;
  this.testY = y;
});

Given('a room from {int},{int} to {int},{int} on a dungeon map', function (x1, y1, x2, y2) {
  this.map = new DungeonMap(30, 30);
  this.room = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  this.map.carveRoom(x1, y1, this.room.w, this.room.h);
  this.map.buildWalls();
});

Given('a room from {int},{int} to {int},{int} on a dungeon map with a corridor at x={int} y={int}', function (x1, y1, x2, y2, cx, cy) {
  this.map = new DungeonMap(30, 30);
  this.room = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  this.map.carveRoom(x1, y1, this.room.w, this.room.h);
  // Carve a one-tile corridor extending to the right from the room edge
  this.map.setTile(cx, cy, TILE.FLOOR);
  this.corridorX = cx;
  this.corridorY = cy;
  this.map.buildWalls();
});

Given('a large room from {int},{int} to {int},{int} on a dungeon map', function (x1, y1, x2, y2) {
  this.map = new DungeonMap(30, 30);
  this.room = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  this.map.carveRoom(x1, y1, this.room.w, this.room.h);
  this.map.buildWalls();
});

// ── When ─────────────────────────────────────────────────────────────────────

When('the trash pile placer places piles in the room', function () {
  // Snapshot which tiles were FLOOR before placement
  this.wasFloor = new Set();
  for (let y = 0; y < this.map.height; y++) {
    for (let x = 0; x < this.map.width; x++) {
      if (this.map.getTile(x, y) === TILE.FLOOR) this.wasFloor.add(`${x},${y}`);
    }
  }
  const rng = { _n: 0, next() { this._n = (this._n * 1664525 + 1013904223) & 0xffffffff; return (this._n >>> 0) / 0x100000000; } };
  // Force the placer to place piles (rng.next() returns < 0.4 on first call)
  const placer = new TrashPilePlacer();
  placer.placeTrash(this.map, [this.room], rng);
  this.placedTrash = [];
  for (let y = 0; y < this.map.height; y++) {
    for (let x = 0; x < this.map.width; x++) {
      if (TRASH_TILES.includes(this.map.getTile(x, y))) this.placedTrash.push({ x, y });
    }
  }
});

When('the trash pile placer places many piles in the room', function () {
  // Deterministic LCG RNG — run 10 passes to ensure all 3 variants are placed.
  let seed = 42;
  const rng = {
    next() {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0x100000000;
    },
  };
  const placer = new TrashPilePlacer();
  for (let i = 0; i < 30; i++) {
    placer.placeTrash(this.map, [this.room], rng);
  }
  this.placedTrash = [];
  for (let y = 0; y < this.map.height; y++) {
    for (let x = 0; x < this.map.width; x++) {
      const t = this.map.getTile(x, y);
      if (TRASH_TILES.includes(t)) this.placedTrash.push({ x, y, type: t });
    }
  }
});

// ── Then ─────────────────────────────────────────────────────────────────────

Then('position {int},{int} is not walkable', function (x, y) {
  assert.equal(this.map.isWalkable(x, y), false,
    `Expected position ${x},${y} to be non-walkable`);
});

Then('position {int},{int} is not opaque', function (x, y) {
  assert.equal(this.map.isOpaque(x, y), false,
    `Expected position ${x},${y} to be non-opaque`);
});

Then('every trash pile was on a floor tile before placement', function () {
  for (const { x, y } of this.placedTrash) {
    assert.ok(this.wasFloor.has(`${x},${y}`),
      `Trash pile at ${x},${y} was not placed on a floor tile`);
  }
});

Then('no trash pile is adjacent to the corridor entry at x={int} y={int}', function (cx, cy) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const { x, y } of this.placedTrash) {
    for (const [dx, dy] of dirs) {
      assert.ok(!(x + dx === cx && y + dy === cy),
        `Trash pile at ${x},${y} is adjacent to the corridor tile at ${cx},${cy}`);
    }
  }
});

Then('all three trash pile variants were placed', function () {
  const types = new Set(this.placedTrash.map(p => this.map.getTile(p.x, p.y)));
  for (const t of TRASH_TILES) {
    assert.ok(types.has(t), `Trash pile variant tile ${t} was never placed`);
  }
});
