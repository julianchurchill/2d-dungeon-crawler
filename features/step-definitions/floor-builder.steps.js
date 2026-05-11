import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { FloorBuilder } from '../../src/systems/FloorBuilder.js';

/**
 * A minimal scene-context stub sufficient to construct a FloorBuilder
 * without importing Phaser or wiring real game state.
 */
function makeMinimalScene() {
  return {};
}

// --- Given ---

Given('a FloorBuilder bound to a minimal scene context', function () {
  this.builder = new FloorBuilder(makeMinimalScene());
});

// --- Then ---

Then('the builder exposes {word}', function (methodName) {
  assert.ok(
    typeof this.builder[methodName] === 'function',
    `Expected FloorBuilder to have method '${methodName}'`,
  );
});
