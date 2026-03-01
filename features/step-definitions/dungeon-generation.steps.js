import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { BSPDungeonGenerator } from '../../src/dungeon/BSPDungeonGenerator.js';
import { createRNG } from '../../src/utils/RNG.js';
import { TILE } from '../../src/utils/TileTypes.js';

function generateDungeon(seed) {
  const rng = createRNG(seed);
  const generator = new BSPDungeonGenerator();
  return generator.generate(rng);
}

function mapsAreIdentical(map1, map2) {
  if (map1.width !== map2.width || map1.height !== map2.height) return false;
  return map1.tiles.every((v, i) => v === map2.tiles[i]);
}

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

// --- Given ---

Given('a dungeon generated with seed {int}', function (seed) {
  this.dungeonResult = generateDungeon(seed);
});

// --- When ---

When('a dungeon is generated with seed {int}', function (seed) {
  this.dungeonResult = generateDungeon(seed);
});

When('another dungeon is generated with seed {int}', function (seed) {
  this.dungeonResult2 = generateDungeon(seed);
});

// --- Then ---

Then('the map should contain floor tiles', function () {
  const { map } = this.dungeonResult;
  let hasFloor = false;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.getTile(x, y) === TILE.FLOOR) { hasFloor = true; break; }
    }
    if (hasFloor) break;
  }
  assert.ok(hasFloor, 'Expected map to contain at least one floor tile');
});

Then('the map should contain stairs leading down', function () {
  const { map } = this.dungeonResult;
  let hasStairs = false;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.getTile(x, y) === TILE.STAIRS_DOWN) { hasStairs = true; break; }
    }
    if (hasStairs) break;
  }
  assert.ok(hasStairs, 'Expected map to contain stairs leading down');
});

Then('the start position should be on a walkable tile', function () {
  const { map, startPos } = this.dungeonResult;
  assert.ok(
    map.isWalkable(startPos.x, startPos.y),
    `Expected start position (${startPos.x}, ${startPos.y}) to be walkable`
  );
});

Then('both maps should be identical', function () {
  assert.ok(
    mapsAreIdentical(this.dungeonResult.map, this.dungeonResult2.map),
    'Expected maps generated with the same seed to be identical'
  );
});

Then('the maps should be different', function () {
  assert.ok(
    !mapsAreIdentical(this.dungeonResult.map, this.dungeonResult2.map),
    'Expected maps generated with different seeds to differ'
  );
});

Then('the stairs should be reachable from the start position', function () {
  const { map, startPos, stairsPos } = this.dungeonResult;
  assert.ok(
    isReachable(map, startPos, stairsPos),
    `Expected stairs at (${stairsPos.x}, ${stairsPos.y}) to be reachable from start (${startPos.x}, ${startPos.y})`
  );
});
