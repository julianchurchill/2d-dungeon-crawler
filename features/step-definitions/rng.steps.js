import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { createRNG } from '../../src/utils/RNG.js';

/**
 * Step definitions for the RNG feature.
 * Uses a known seed (42) to produce deterministic, assertable sequences.
 */

let rng;
let result;
let results;

Given('an RNG seeded with {int}', function (seed) {
  rng = createRNG(seed);
  result = undefined;
  results = [];
});

When('next is called', function () {
  result = rng.next();
});

When('next is called {int} times', function (n) {
  results = [];
  for (let i = 0; i < n; i++) results.push(rng.next());
});

When('nextInt is called {int} times with min {int} and max {int}', function (n, min, max) {
  results = [];
  for (let i = 0; i < n; i++) results.push(rng.nextInt(min, max));
});

When('nextInt is called with min {int} and max {int}', function (min, max) {
  result = rng.nextInt(min, max);
});

When('nextBool is called with chance equal to the first next value', function () {
  const chance = rng.next();
  rng = createRNG(42); // reset so nextBool uses same first value
  result = rng.nextBool(chance);
});

When('nextBool is called with chance slightly above the first next value', function () {
  const chance = rng.next() + 0.001;
  rng = createRNG(42);
  result = rng.nextBool(chance);
});

When('nextBool is called with chance {float}', function (chance) {
  result = rng.nextBool(chance);
});

When('pick is called {int} times on a {int}-element array', function (n, size) {
  const arr = Array.from({ length: size }, (_, i) => i);
  results = [];
  for (let i = 0; i < n; i++) results.push(rng.pick(arr));
});

When('pick is called on array {string}, {string}, {string}', function (a, b, c) {
  result = rng.pick([a, b, c]);
});

Then('the result is between 0 and 1', function () {
  assert.ok(result >= 0 && result < 1, `Expected 0 <= ${result} < 1`);
});

Then('the sequence matches the expected values for seed 42', function () {
  // Pre-computed from the Mulberry32 implementation with seed 42
  const expected = [0.6011037519201636, 0.44829055899754167, 0.8524657934904099];
  assert.deepStrictEqual(results, expected);
});

Then('every result is between {int} and {int} inclusive', function (min, max) {
  for (const v of results) {
    assert.ok(v >= min && v <= max, `Value ${v} is outside [${min}, ${max}]`);
  }
});

Then('the result is {int}', function (expected) {
  assert.strictEqual(result, expected);
});

Then('the result is false', function () {
  assert.strictEqual(result, false);
});

Then('the result is true', function () {
  assert.strictEqual(result, true);
});

Then('every result is a defined element', function () {
  for (const v of results) {
    assert.notStrictEqual(v, undefined, 'pick returned undefined');
  }
});

Then('the result is {string}', function (expected) {
  assert.strictEqual(result, expected);
});
