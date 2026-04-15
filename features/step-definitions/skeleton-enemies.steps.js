import { Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { ENEMY_DEFS } from '../../src/entities/EnemyTypes.js';

/**
 * Verifies a named string property on an enemy definition.
 *
 * @param {string} type - Enemy type key in ENEMY_DEFS.
 * @param {string} prop - Property name to check.
 * @param {string} value - Expected string value.
 */
Then('the {word} enemy has name {string}', function (type, value) {
  assert.ok(ENEMY_DEFS[type], `No enemy definition found for type "${type}"`);
  assert.equal(ENEMY_DEFS[type].name, value);
});

/**
 * Verifies the hp stat on an enemy definition.
 *
 * @param {string} type - Enemy type key in ENEMY_DEFS.
 * @param {number} value - Expected hp value.
 */
Then('the {word} enemy has hp {int}', function (type, value) {
  assert.ok(ENEMY_DEFS[type], `No enemy definition found for type "${type}"`);
  assert.equal(ENEMY_DEFS[type].hp, value);
});

/**
 * Verifies the attack stat on an enemy definition.
 *
 * @param {string} type - Enemy type key in ENEMY_DEFS.
 * @param {number} value - Expected attack value.
 */
Then('the {word} enemy has attack {int}', function (type, value) {
  assert.ok(ENEMY_DEFS[type], `No enemy definition found for type "${type}"`);
  assert.equal(ENEMY_DEFS[type].attack, value);
});

/**
 * Verifies the defense stat on an enemy definition.
 *
 * @param {string} type - Enemy type key in ENEMY_DEFS.
 * @param {number} value - Expected defense value.
 */
Then('the {word} enemy has defense {int}', function (type, value) {
  assert.ok(ENEMY_DEFS[type], `No enemy definition found for type "${type}"`);
  assert.equal(ENEMY_DEFS[type].defense, value);
});

/**
 * Verifies the xp reward on an enemy definition.
 *
 * @param {string} type - Enemy type key in ENEMY_DEFS.
 * @param {number} value - Expected xp value.
 */
Then('the {word} enemy has xp {int}', function (type, value) {
  assert.ok(ENEMY_DEFS[type], `No enemy definition found for type "${type}"`);
  assert.equal(ENEMY_DEFS[type].xp, value);
});

/**
 * Verifies the teleportChance on an enemy definition.
 *
 * @param {string} type - Enemy type key in ENEMY_DEFS.
 * @param {number} value - Expected teleportChance value.
 */
Then('the {word} enemy has teleportChance {float}', function (type, value) {
  assert.ok(ENEMY_DEFS[type], `No enemy definition found for type "${type}"`);
  assert.equal(ENEMY_DEFS[type].teleportChance, value);
});

/**
 * Verifies the teleportRange on an enemy definition.
 *
 * @param {string} type - Enemy type key in ENEMY_DEFS.
 * @param {number} value - Expected teleportRange value.
 */
Then('the {word} enemy has teleportRange {int}', function (type, value) {
  assert.ok(ENEMY_DEFS[type], `No enemy definition found for type "${type}"`);
  assert.equal(ENEMY_DEFS[type].teleportRange, value);
});
