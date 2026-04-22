import { Given, When, Then, defineStep } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { devOptions, isSpawnConfigValid } from '../../src/systems/DevOptions.js';
import { buildSpawnTableFromWeights, ENEMY_DEFS } from '../../src/entities/EnemyTypes.js';

// ─── Setting spawn overrides ──────────────────────────────────────────────

defineStep('the dev spawn weights are set to goblin {int} orc {int} troll {int}',
  function (goblin, orc, troll) {
    devOptions.spawnWeights = { goblin, orc, troll };
  });

defineStep('the dev min enemies per room is set to {int}', function (min) {
  devOptions.minEnemiesPerRoom = min;
});

defineStep('the dev max enemies per room is set to {int}', function (max) {
  devOptions.maxEnemiesPerRoom = max;
});

// ─── Assertions on devOptions spawn fields ────────────────────────────────

Then('the dev spawn weights should be null', function () {
  assert.equal(devOptions.spawnWeights, null);
});

Then('the dev min enemies per room should be null', function () {
  assert.equal(devOptions.minEnemiesPerRoom, null);
});

Then('the dev max enemies per room should be null', function () {
  assert.equal(devOptions.maxEnemiesPerRoom, null);
});

Then('the dev spawn weights should be goblin {int} orc {int} troll {int}',
  function (goblin, orc, troll) {
    assert.deepEqual(devOptions.spawnWeights, { goblin, orc, troll });
  });

Then('the dev min enemies per room should be {int}', function (expected) {
  assert.equal(devOptions.minEnemiesPerRoom, expected);
});

Then('the dev max enemies per room should be {int}', function (expected) {
  assert.equal(devOptions.maxEnemiesPerRoom, expected);
});

// ─── isSpawnConfigValid ───────────────────────────────────────────────────

Then('the spawn table config should be valid', function () {
  assert.ok(isSpawnConfigValid(devOptions), 'Expected spawn config to be valid');
});

Then('the spawn table config should be invalid', function () {
  assert.ok(!isSpawnConfigValid(devOptions), 'Expected spawn config to be invalid');
});

// ─── Boss quantities ──────────────────────────────────────────────────────

defineStep('the dev boss quantities are set to old_bones {int}', function (count) {
  devOptions.bossQuantities = { old_bones: count };
});

Then('the dev boss quantities should be null', function () {
  assert.equal(devOptions.bossQuantities, null);
});

Then('the dev boss quantities should be old_bones {int}', function (count) {
  assert.deepEqual(devOptions.bossQuantities, { old_bones: count });
});

Then('the {string} enemy type should be flagged as a boss in ENEMY_DEFS', function (type) {
  assert.ok(ENEMY_DEFS[type]?.isBoss === true, `Expected ENEMY_DEFS["${type}"].isBoss to be true`);
});

// ─── Champion quantities ──────────────────────────────────────────────────

defineStep('the dev champion quantities are set to goblin {int}', function (count) {
  devOptions.championQuantities = { goblin: count };
});

Then('the dev champion quantities should be null', function () {
  assert.equal(devOptions.championQuantities, null);
});

Then('the dev champion quantities should be goblin {int}', function (count) {
  assert.deepEqual(devOptions.championQuantities, { goblin: count });
});

// ─── buildSpawnTableFromWeights ───────────────────────────────────────────

When('a spawn table is built from goblin {int} orc {int} troll {int}',
  function (goblin, orc, troll) {
    this.spawnTable = buildSpawnTableFromWeights({ goblin, orc, troll });
  });

Then('the spawn table should contain {int} goblins', function (count) {
  const actual = this.spawnTable.filter(t => t === 'goblin').length;
  assert.equal(actual, count);
});

Then('the spawn table should contain {int} orc', function (count) {
  const actual = this.spawnTable.filter(t => t === 'orc').length;
  assert.equal(actual, count);
});

Then('the spawn table should contain {int} trolls', function (count) {
  const actual = this.spawnTable.filter(t => t === 'troll').length;
  assert.equal(actual, count);
});

Then('the spawn table should have {int} entries total', function (total) {
  assert.equal(this.spawnTable.length, total);
});
