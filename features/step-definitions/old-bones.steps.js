import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'assert';
import { OldBones } from '../../src/entities/OldBones.js';
import { ENEMY_DEFS } from '../../src/entities/EnemyTypes.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { ACHIEVEMENTS } from '../../src/achievements/AchievementDefinitions.js';
import { GameEvents } from '../../src/events/GameEvents.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMap() {
  return { isWalkable: () => true };
}

function makeRng() {
  return {
    next: () => 0.5,
    nextBool: () => false,
    nextInt: (min) => min,
    pick: (arr) => arr[0],
  };
}

const noEntities = () => null;

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

const state = {};

Before(function () {
  Object.keys(state).forEach(k => delete state[k]);
});

// ---------------------------------------------------------------------------
// Given
// ---------------------------------------------------------------------------

Given('an Old Bones boss at position {int}, {int}', function (x, y) {
  state.boss = new OldBones(x, y, makeRng());
});

Given('a boss target player at position {int}, {int}', function (x, y) {
  state.player = { x, y, name: 'Player' };
});

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When('the boss takes {int} damage', function (amount) {
  state.boss.takeDamage(amount);
});

When('the boss takes its turn on an open map', function () {
  state.result = state.boss.takeTurn(state.player, makeMap(), noEntities, makeRng());
});

// Emits on the World's isolated event bus so the achievement system under test
// receives the kill event without polluting the singleton EventBus.
When('the player kills {int} old_bones', function (count) {
  for (let i = 0; i < count; i++) {
    this.eventBus.emit(GameEvents.ENEMY_KILLED, 'old_bones');
  }
});

// ---------------------------------------------------------------------------
// Then — boss construction
// ---------------------------------------------------------------------------

Then('the boss type is {string}', function (type) {
  assert.strictEqual(state.boss.type, type);
});

Then('the boss name is {string}', function (name) {
  assert.strictEqual(state.boss.name, name);
});

Then('the boss is flagged as a boss', function () {
  assert.strictEqual(state.boss.isBoss, true);
});

Then('the boss has not spawned minions yet', function () {
  assert.strictEqual(state.boss.minionsSpawned, false);
});

Then('the boss hp is at least {int}', function (min) {
  assert.ok(state.boss.stats.hp >= min, `Expected hp >= ${min} but got ${state.boss.stats.hp}`);
});

Then('the boss drop gold is greater than 0', function () {
  assert.ok(state.boss.dropGold > 0, `Expected dropGold > 0 but got ${state.boss.dropGold}`);
});

Then('the boss has a drop item', function () {
  assert.ok(state.boss.dropItem != null, 'Expected boss to have a dropItem');
});

// ---------------------------------------------------------------------------
// Then — combat
// ---------------------------------------------------------------------------

Then('the boss is not dead', function () {
  assert.strictEqual(state.boss.isDead(), false);
});

Then('the boss is dead', function () {
  assert.strictEqual(state.boss.isDead(), true);
});

Then('the boss action is {string}', function (action) {
  assert.strictEqual(state.result.action, action);
});

// ---------------------------------------------------------------------------
// Then — items
// ---------------------------------------------------------------------------

Then('the Bone Blade item type is {string}', function (type) {
  assert.strictEqual(ITEM_TYPES.BONE_BLADE.type, type);
});

Then('the Bone Blade attack bonus is greater than 0', function () {
  assert.ok(ITEM_TYPES.BONE_BLADE.attackBonus > 0);
});

Then('the Skeleton Shield item type is {string}', function (type) {
  assert.strictEqual(ITEM_TYPES.SKELETON_SHIELD.type, type);
});

Then('the Skeleton Shield defense bonus is greater than 0', function () {
  assert.ok(ITEM_TYPES.SKELETON_SHIELD.defenseBonus > 0);
});

// ---------------------------------------------------------------------------
// Then — achievement existence
// ---------------------------------------------------------------------------

Then('the {string} achievement is defined', function (id) {
  const found = ACHIEVEMENTS.find(a => a.id === id);
  assert.ok(found, `No achievement with id "${id}"`);
});

// ---------------------------------------------------------------------------
// Then — skeleton minion type
// ---------------------------------------------------------------------------

Then('the {string} enemy type is defined in ENEMY_DEFS', function (type) {
  assert.ok(ENEMY_DEFS[type] != null, `ENEMY_DEFS["${type}"] is not defined`);
});

Then('the skeleton hp is at least {int}', function (min) {
  const hp = ENEMY_DEFS.skeleton.hp;
  assert.ok(hp >= min, `Expected skeleton hp >= ${min} but got ${hp}`);
});
