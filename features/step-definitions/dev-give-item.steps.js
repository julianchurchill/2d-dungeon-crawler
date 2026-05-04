/**
 * Step definitions for the Dev-mode give item feature.
 *
 * Tests the devGiveItem() helper in isolation — no Phaser scene required.
 */
import { Given, When, Then, defineStep } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { devGiveItem } from '../../src/systems/DevOptions.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { Item } from '../../src/items/Item.js';

// ── State helpers ─────────────────────────────────────────────────────────────

Given('the player inventory is full', function () {
  const typeDef = ITEM_TYPES.SWORD;
  for (let i = 0; i < this.player.maxInventory; i++) {
    this.player.inventory.push(new Item(0, 0, typeDef));
  }
});

// ── When ──────────────────────────────────────────────────────────────────────

defineStep('the dev gives the player a {string}', function (key) {
  this.devGiveResult = devGiveItem(this.player, key);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the dev give item result should be false', function () {
  assert.equal(this.devGiveResult, false);
});

Then('the player inventory should contain 1 stack of {string}', function (key) {
  const typeDef = ITEM_TYPES[key];
  assert.ok(typeDef, `Unknown item key: ${key}`);
  const matches = this.player.inventory.filter(i => i.id === typeDef.id);
  assert.equal(matches.length, 1, `Expected 1 stack of ${key}, found ${matches.length}`);
});

Then('the {string} stack count should be {int}', function (key, expectedCount) {
  const typeDef = ITEM_TYPES[key];
  assert.ok(typeDef, `Unknown item key: ${key}`);
  const stack = this.player.inventory.find(i => i.id === typeDef.id);
  assert.ok(stack, `No stack of ${key} found in inventory`);
  assert.equal(stack.count, expectedCount);
});
