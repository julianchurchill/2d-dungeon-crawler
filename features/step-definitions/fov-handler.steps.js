import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { FovHandler } from '../../src/systems/FovHandler.js';

function makeMinimalScene() {
  return {};
}

// --- Given ---

Given('a FovHandler bound to a minimal scene context', function () {
  this.fovHandler = new FovHandler(makeMinimalScene());
});

// --- Then ---

Then('the fov handler exposes {word}', function (methodName) {
  assert.ok(
    typeof this.fovHandler[methodName] === 'function',
    `Expected FovHandler to have method '${methodName}'`,
  );
});
