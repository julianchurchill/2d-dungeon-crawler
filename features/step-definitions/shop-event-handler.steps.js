import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { ShopEventHandler } from '../../src/systems/ShopEventHandler.js';

function makeMinimalScene() {
  return {};
}

// --- Given ---

Given('a ShopEventHandler bound to a minimal scene context', function () {
  this.shopEventHandler = new ShopEventHandler(makeMinimalScene());
});

// --- Then ---

Then('the shop event handler exposes {word}', function (methodName) {
  assert.ok(
    typeof this.shopEventHandler[methodName] === 'function',
    `Expected ShopEventHandler to have method '${methodName}'`,
  );
});
