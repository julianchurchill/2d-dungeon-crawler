/**
 * Step definitions for the inventory-toggle feature.
 *
 * Tests the pure `applyInventoryToggle` helper by supplying mock state
 * callbacks and checking which transitions were triggered.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { applyInventoryToggle } from '../../src/systems/InventoryToggle.js';
import { TURN_STATE } from '../../src/systems/TurnManager.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('the turn state is PLAYER_INPUT', function () {
  this.turnState = TURN_STATE.PLAYER_INPUT;
  this.setInventoryCalled = false;
  this.setPlayerInputCalled = false;
  this.openInventoryEmitted = false;
});

Given('the turn state is INVENTORY', function () {
  this.turnState = TURN_STATE.INVENTORY;
  this.setInventoryCalled = false;
  this.setPlayerInputCalled = false;
  this.openInventoryEmitted = false;
});

Given('the turn state is PLAYER_ACTING', function () {
  this.turnState = TURN_STATE.PLAYER_ACTING;
  this.setInventoryCalled = false;
  this.setPlayerInputCalled = false;
  this.openInventoryEmitted = false;
});

Given('the turn state is ENEMY_ACTING', function () {
  this.turnState = TURN_STATE.ENEMY_ACTING;
  this.setInventoryCalled = false;
  this.setPlayerInputCalled = false;
  this.openInventoryEmitted = false;
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the inventory toggle fires', function () {
  const toggled = applyInventoryToggle(
    this.turnState,
    () => { this.setInventoryCalled = true; },
    () => { this.setPlayerInputCalled = true; },
  );
  this.openInventoryEmitted = toggled;
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the inventory should have opened', function () {
  assert.equal(this.openInventoryEmitted, true);
  assert.equal(this.setInventoryCalled, true);
});

Then('the turn state should be INVENTORY', function () {
  assert.equal(this.setInventoryCalled, true);
});

Then('the inventory should have closed', function () {
  assert.equal(this.openInventoryEmitted, true);
  assert.equal(this.setPlayerInputCalled, true);
});

Then('the turn state should be PLAYER_INPUT', function () {
  assert.equal(this.setPlayerInputCalled, true);
});

Then('the inventory should not have opened', function () {
  assert.equal(this.openInventoryEmitted, false);
});
