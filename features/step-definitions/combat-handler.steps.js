import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { CombatHandler } from '../../src/systems/CombatHandler.js';

/**
 * A minimal scene-context stub sufficient to construct a CombatHandler
 * without importing Phaser or wiring real game state.
 */
function makeMinimalScene() {
  return {};
}

// --- Given ---

Given('a CombatHandler bound to a minimal scene context', function () {
  this.combatHandler = new CombatHandler(makeMinimalScene());
});

// --- Then ---

Then('the combat handler exposes {word}', function (methodName) {
  assert.ok(
    typeof this.combatHandler[methodName] === 'function',
    `Expected CombatHandler to have method '${methodName}'`,
  );
});
