import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { GameLifecycleHandler } from '../../src/systems/GameLifecycleHandler.js';

function makeMinimalScene() {
  return {};
}

// --- Given ---

Given('a GameLifecycleHandler bound to a minimal scene context', function () {
  this.gameLifecycleHandler = new GameLifecycleHandler(makeMinimalScene());
});

// --- Then ---

Then('the game lifecycle handler exposes {word}', function (methodName) {
  assert.ok(
    typeof this.gameLifecycleHandler[methodName] === 'function',
    `Expected GameLifecycleHandler to have method '${methodName}'`,
  );
});
