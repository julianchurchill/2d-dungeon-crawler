import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { InputHandler } from '../../src/systems/InputHandler.js';

function makeMinimalScene() {
  return {};
}

// --- Given ---

Given('an InputHandler bound to a minimal scene context', function () {
  this.inputHandler = new InputHandler(makeMinimalScene());
});

// --- Then ---

Then('the input handler exposes {word}', function (methodName) {
  assert.ok(
    typeof this.inputHandler[methodName] === 'function',
    `Expected InputHandler to have method '${methodName}'`,
  );
});
