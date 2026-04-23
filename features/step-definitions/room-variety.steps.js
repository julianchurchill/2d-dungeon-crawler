import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { DungeonMap } from '../../src/dungeon/DungeonMap.js';
import { RoomShaper } from '../../src/dungeon/RoomShaper.js';
import { BSPDungeonGenerator } from '../../src/dungeon/BSPDungeonGenerator.js';
import { createRNG } from '../../src/utils/RNG.js';
import { TILE } from '../../src/utils/TileTypes.js';

// ─── Helpers ──────────────────────────────────────────────────────────────

function isReachable(map, from, to) {
  const visited = new Set();
  const queue = [`${from.x},${from.y}`];
  visited.add(queue[0]);
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  while (queue.length > 0) {
    const key = queue.shift();
    const [x, y] = key.split(',').map(Number);
    if (x === to.x && y === to.y) return true;
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      const nKey = `${nx},${ny}`;
      if (!visited.has(nKey) && map.isWalkable(nx, ny)) {
        visited.add(nKey);
        queue.push(nKey);
      }
    }
  }
  return false;
}

// ─── When ─────────────────────────────────────────────────────────────────

When(
  'a cross room is carved into a blank {int}x{int} map at x {int} y {int} with size {int} x {int}',
  function (mapW, mapH, rx, ry, rw, rh) {
    this.testMap = new DungeonMap(mapW, mapH);
    const room = {
      x: rx, y: ry, w: rw, h: rh,
      cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2),
    };
    RoomShaper.carveCross(this.testMap, room);
  });

When(
  'a chamfered room is carved into a blank {int}x{int} map at x {int} y {int} with size {int} x {int}',
  function (mapW, mapH, rx, ry, rw, rh) {
    this.testMap = new DungeonMap(mapW, mapH);
    const room = {
      x: rx, y: ry, w: rw, h: rh,
      cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2),
    };
    RoomShaper.carveChamfered(this.testMap, room);
  });

When(
  'an L-shaped room orientation {int} is carved into a blank {int}x{int} map at x {int} y {int} with size {int} x {int}',
  function (orientation, mapW, mapH, rx, ry, rw, rh) {
    this.testMap = new DungeonMap(mapW, mapH);
    const room = {
      x: rx, y: ry, w: rw, h: rh,
      cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2),
      lOrientation: orientation,
    };
    RoomShaper.carveL(this.testMap, room);
  });

When(
  'a rectangular room with pillars is carved into a blank {int}x{int} map at x {int} y {int} with size {int} x {int}',
  function (mapW, mapH, rx, ry, rw, rh) {
    this.testMap = new DungeonMap(mapW, mapH);
    const room = {
      x: rx, y: ry, w: rw, h: rh,
      cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2),
    };
    this.testMap.carveRoom(rx, ry, rw, rh);
    RoomShaper.addPillars(this.testMap, room);
    this.testMap.buildWalls();
  });

// ─── Then ─────────────────────────────────────────────────────────────────

Then('the tile at x {int} y {int} should be a floor tile', function (x, y) {
  const tile = this.testMap.getTile(x, y);
  assert.strictEqual(tile, TILE.FLOOR,
    `Expected tile at (${x},${y}) to be FLOOR (${TILE.FLOOR}) but got ${tile}`);
});

Then('the tile at x {int} y {int} should not be a floor tile', function (x, y) {
  const tile = this.testMap.getTile(x, y);
  assert.notStrictEqual(tile, TILE.FLOOR,
    `Expected tile at (${x},${y}) NOT to be FLOOR but it was`);
});

Then('dungeons with seeds {int} to {int} should all have stairs reachable from start',
  function (seedFrom, seedTo) {
    const generator = new BSPDungeonGenerator();
    for (let seed = seedFrom; seed <= seedTo; seed++) {
      const rng = createRNG(seed);
      const { map, startPos, stairsPos } = generator.generate(rng);
      assert.ok(
        isReachable(map, startPos, stairsPos),
        `Seed ${seed}: stairs at (${stairsPos.x},${stairsPos.y}) not reachable from (${startPos.x},${startPos.y})`,
      );
    }
  });

Then('dungeons with seeds {int} to {int} should all have walkable start positions',
  function (seedFrom, seedTo) {
    const generator = new BSPDungeonGenerator();
    for (let seed = seedFrom; seed <= seedTo; seed++) {
      const rng = createRNG(seed);
      const { map, startPos } = generator.generate(rng);
      assert.ok(
        map.isWalkable(startPos.x, startPos.y),
        `Seed ${seed}: start position (${startPos.x},${startPos.y}) is not walkable`,
      );
    }
  });
