import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { SpriteAnimator } from '../../src/systems/SpriteAnimator.js';

function makeMinimalScene() {
  return {};
}

// --- Given ---

Given('a SpriteAnimator bound to a minimal scene context', function () {
  this.spriteAnimator = new SpriteAnimator(makeMinimalScene());
});

// --- Then ---

Then('the sprite animator exposes {word}', function (methodName) {
  assert.ok(
    typeof this.spriteAnimator[methodName] === 'function',
    `Expected SpriteAnimator to have method '${methodName}'`,
  );
});
