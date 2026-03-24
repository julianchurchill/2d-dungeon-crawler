import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'assert';
import { Enemy } from '../../src/entities/Enemy.js';
import { ENEMY_DEFS } from '../../src/entities/EnemyTypes.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal map stub: every tile walkable unless blocked list says otherwise. */
function makeMap({ blocked = [] } = {}) {
  return {
    isWalkable(x, y) {
      return !blocked.some(b => b.x === x && b.y === y);
    },
  };
}

/** RNG stub that always returns a fixed value. */
function makeRng({ nextVal = 0.5, nextBool = false } = {}) {
  return {
    next: () => nextVal,
    nextBool: () => nextBool,
  };
}

/** getEntityAt stub: returns null (no entities blocking). */
const noEntities = () => null;

// ---------------------------------------------------------------------------
// State shared across steps in a scenario
// ---------------------------------------------------------------------------

const state = {};

Before(function () {
  Object.keys(state).forEach(k => delete state[k]);
});

// ---------------------------------------------------------------------------
// Given
// ---------------------------------------------------------------------------

Given('an enemy of type {string} at position {int}, {int}', function (type, x, y) {
  state.enemy = new Enemy(x, y, type);
  state.type = type;
  state.def = ENEMY_DEFS[type];
});

Given('an enemy target player at position {int}, {int}', function (x, y) {
  state.player = { x, y, name: 'Player' };
});

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When('the enemy takes {int} damage', function (amount) {
  state.actualDamage = state.enemy.takeDamage(amount);
});

When('the enemy takes its turn', function () {
  const rng = makeRng({ nextBool: false });
  state.result = state.enemy.takeTurn(state.player, makeMap(), noEntities, rng);
});

When('the enemy takes its turn on an open map', function () {
  const rng = makeRng({ nextBool: false });
  state.result = state.enemy.takeTurn(state.player, makeMap(), noEntities, rng);
});

When('the enemy takes its turn on an open map with wander suppressed', function () {
  const rng = makeRng({ nextBool: false });
  state.result = state.enemy.takeTurn(state.player, makeMap(), noEntities, rng);
});

When('the enemy takes its turn with wander forced on an open map', function () {
  const rng = makeRng({ nextBool: true, nextVal: 0.5 });
  state.result = state.enemy.takeTurn(state.player, makeMap(), noEntities, rng);
});

When('the enemy takes its turn with wander forced on a fully blocked map', function () {
  // Block all four neighbours of the enemy
  const e = state.enemy;
  const blocked = [
    { x: e.x, y: e.y - 1 },
    { x: e.x, y: e.y + 1 },
    { x: e.x - 1, y: e.y },
    { x: e.x + 1, y: e.y },
  ];
  const rng = makeRng({ nextBool: true, nextVal: 0.5 });
  state.result = state.enemy.takeTurn(state.player, makeMap({ blocked }), noEntities, rng);
});

When('the enemy moves toward the player on an open map', function () {
  state.move = state.enemy._moveToward(
    state.player.x, state.player.y, makeMap(), noEntities,
  );
});

When('the enemy moves toward the player with horizontal blocked', function () {
  // Block the tile directly to the left (dx=-1, dy=0) of the enemy
  const e = state.enemy;
  const blocked = [{ x: e.x - 1, y: e.y }];
  state.move = state.enemy._moveToward(
    state.player.x, state.player.y, makeMap({ blocked }), noEntities,
  );
});

When('the enemy takes its turn with aggro path blocked and wander suppressed', function () {
  // Block the only direct path toward player (dx=-1 from x=3 to x=2)
  const blocked = [{ x: 2, y: 0 }, { x: 3, y: -1 }, { x: 3, y: 1 }];
  const rng = makeRng({ nextBool: false });
  state.result = state.enemy.takeTurn(state.player, makeMap({ blocked }), noEntities, rng);
});

When('the enemy wanders with only the tile above open', function () {
  // Block down, left, right; leave only up (5,4) open.
  // Use nextVal=0.5 so sort comparator always returns 0 → stable order UP,DOWN,LEFT,RIGHT.
  const e = state.enemy;
  const blocked = [
    { x: e.x,     y: e.y + 1 }, // down
    { x: e.x - 1, y: e.y     }, // left
    { x: e.x + 1, y: e.y     }, // right
  ];
  const rng = makeRng({ nextBool: true, nextVal: 0.5 });
  state.result = state.enemy.takeTurn(state.player, makeMap({ blocked }), noEntities, rng);
});

When('the enemy wanders with only the tile to the left open', function () {
  // Block up, down, right; leave only left (4,5) open.
  const e = state.enemy;
  const blocked = [
    { x: e.x,     y: e.y - 1 }, // up
    { x: e.x,     y: e.y + 1 }, // down
    { x: e.x + 1, y: e.y     }, // right
  ];
  const rng = makeRng({ nextBool: true, nextVal: 0.5 });
  state.result = state.enemy.takeTurn(state.player, makeMap({ blocked }), noEntities, rng);
});

When('the enemy moves toward the player with vertical step blocked', function () {
  // distX=1,distY=2 → else branch; primary candidate {dx:0,dy} → block it
  const e = state.enemy;
  const p = state.player;
  const dy = Math.sign(p.y - e.y);
  const blocked = [{ x: e.x, y: e.y + dy }];
  state.move = state.enemy._moveToward(p.x, p.y, makeMap({ blocked }), noEntities);
});

When('the enemy moves toward the player with vertical and horizontal steps blocked', function () {
  // Block both {dx:0,dy} and {dx,dy:0} → only diagonal {dx,dy} remains
  const e = state.enemy;
  const p = state.player;
  const dx = Math.sign(p.x - e.x);
  const dy = Math.sign(p.y - e.y);
  const blocked = [
    { x: e.x,      y: e.y + dy }, // vertical-only
    { x: e.x + dx, y: e.y      }, // horizontal-only
  ];
  state.move = state.enemy._moveToward(p.x, p.y, makeMap({ blocked }), noEntities);
});

When('the enemy moves toward the player with only horizontal step open', function () {
  // distX=distY=1: candidates are [(-1,0), (0,-1), (-1,-1)]; block vertical and diagonal
  const e = state.enemy;
  const blocked = [
    { x: e.x, y: e.y - 1 },     // (0,-1) step blocked
    { x: e.x - 1, y: e.y - 1 }, // diagonal blocked
  ];
  state.move = state.enemy._moveToward(
    state.player.x, state.player.y, makeMap({ blocked }), noEntities,
  );
});

When('the enemy takes its turn with teleport forced on an open map', function () {
  // nextVal 0.1 < teleportChance 0.25 → teleport roll passes; nextBool false → wander off
  const rng = makeRng({ nextVal: 0.1, nextBool: false });
  state.result = state.enemy.takeTurn(state.player, makeMap(), noEntities, rng);
});

When('the enemy takes its turn with teleport suppressed on an open map', function () {
  // nextVal 0.9 >= teleportChance 0.25 → teleport roll fails; nextBool false → wander off
  const rng = makeRng({ nextVal: 0.9, nextBool: false });
  state.result = state.enemy.takeTurn(state.player, makeMap(), noEntities, rng);
});

When('the sprite takes its turn with teleport forced but all range tiles blocked', function () {
  // Block every tile within Manhattan distance 3 of the sprite (excluding origin)
  const e = state.enemy;
  const range = 3;
  const blocked = [];
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (Math.abs(dx) + Math.abs(dy) <= range) {
        blocked.push({ x: e.x + dx, y: e.y + dy });
      }
    }
  }
  const rng = makeRng({ nextVal: 0.1, nextBool: false });
  state.result = state.enemy.takeTurn(state.player, makeMap({ blocked }), noEntities, rng);
});

When('the enemy moves toward the player with all directions blocked', function () {
  const e = state.enemy;
  const blocked = [
    { x: e.x - 1, y: e.y },
    { x: e.x, y: e.y - 1 },
    { x: e.x - 1, y: e.y - 1 },
  ];
  state.move = state.enemy._moveToward(
    state.player.x, state.player.y, makeMap({ blocked }), noEntities,
  );
});

// ---------------------------------------------------------------------------
// Then
// ---------------------------------------------------------------------------

Then('the enemy name is {string}', function (name) {
  assert.strictEqual(state.enemy.name, name);
});

Then('the enemy hp equals the goblin max hp', function () {
  assert.strictEqual(state.enemy.stats.hp, state.def.hp);
});

Then('the enemy attack equals the goblin attack', function () {
  assert.strictEqual(state.enemy.stats.attack, state.def.attack);
});

Then('the enemy defense equals the goblin defense', function () {
  assert.strictEqual(state.enemy.stats.defense, state.def.defense);
});

Then('the enemy xp equals the goblin xp', function () {
  assert.strictEqual(state.enemy.xp, state.def.xp);
});

Then('the enemy aggroRange equals the goblin aggroRange', function () {
  assert.strictEqual(state.enemy.aggroRange, state.def.aggroRange);
});

Then('the enemy id starts with {string}', function (prefix) {
  assert.ok(
    state.enemy.id.startsWith(prefix),
    `Expected id "${state.enemy.id}" to start with "${prefix}"`,
  );
});

Then('the enemy is not dead', function () {
  assert.strictEqual(state.enemy.isDead(), false);
});

Then('the enemy is dead', function () {
  assert.strictEqual(state.enemy.isDead(), true);
});

Then('the enemy hp is reduced by the attack minus goblin defense', function () {
  const expected = state.def.hp - (5 - state.def.defense);
  assert.strictEqual(state.enemy.stats.hp, expected);
});

Then('takeDamage returns the actual damage dealt', function () {
  const expected = Math.max(1, 5 - state.def.defense);
  assert.strictEqual(state.actualDamage, expected);
});

Then('the enemy hp is reduced by 1', function () {
  assert.strictEqual(state.enemy.stats.hp, state.def.hp - 1);
});

Then('the enemy hp is 0', function () {
  assert.strictEqual(state.enemy.stats.hp, 0);
});

Then('the action is {string}', function (action) {
  assert.strictEqual(state.result.action, action);
});

Then('the action is not {string}', function (action) {
  assert.notStrictEqual(state.result.action, action);
});

Then('the target is the player', function () {
  assert.strictEqual(state.result.target, state.player);
});

Then('the move dx is {int}', function (dx) {
  const move = state.move ?? state.result;
  assert.strictEqual(move.dx, dx);
});

Then('the move dy is {int}', function (dy) {
  const move = state.move ?? state.result;
  assert.strictEqual(move.dy, dy);
});

Then('no move is returned', function () {
  assert.strictEqual(state.move, null);
});

Then('the enemy teleport chance is greater than 0', function () {
  assert.ok(state.enemy.teleportChance > 0,
    `Expected teleportChance > 0 but got ${state.enemy.teleportChance}`);
});

Then('the teleport destination is within {int} tiles of the enemy origin', function (range) {
  const dist = Math.abs(state.result.x - state.enemy.x) + Math.abs(state.result.y - state.enemy.y);
  assert.ok(dist > 0 && dist <= range,
    `Expected teleport within ${range} tiles but got dist=${dist}`);
});

Then('the wander move lands on a tile adjacent to the enemy', function () {
  const e = state.enemy;
  const dx = state.result.dx;
  const dy = state.result.dy;
  assert.ok(
    Math.abs(dx) + Math.abs(dy) === 1,
    `Expected wander move of Manhattan distance 1, got dx=${dx} dy=${dy}`,
  );
  // Verify the target tile is one step away from the original position, not two
  assert.ok(dx === 0 || dx === 1 || dx === -1, `dx ${dx} out of range`);
  assert.ok(dy === 0 || dy === 1 || dy === -1, `dy ${dy} out of range`);
});
