import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { SkillEventHandler } from '../../src/systems/SkillEventHandler.js';

function makeMinimalScene() {
  return {};
}

// --- Given ---

Given('a SkillEventHandler bound to a minimal scene context', function () {
  this.skillEventHandler = new SkillEventHandler(makeMinimalScene());
});

// --- Then ---

Then('the skill event handler exposes {word}', function (methodName) {
  assert.ok(
    typeof this.skillEventHandler[methodName] === 'function',
    `Expected SkillEventHandler to have method '${methodName}'`,
  );
});
