/**
 * Step definitions for the inventory-toggle feature.
 *
 * Tests the pure `applyInventoryToggle` helper using a real TurnManager
 * so that state transitions are verified directly on the manager.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { applyInventoryToggle } from '../../src/systems/InventoryToggle.js';
import { TurnManager, TURN_STATE } from '../../src/systems/TurnManager.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('the turn state is PLAYER_INPUT', function () {
  this.turnManager = new TurnManager();
  this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
});

Given('the turn state is INVENTORY', function () {
  this.turnManager = new TurnManager();
  this.turnManager.setState(TURN_STATE.INVENTORY);
});

Given('the turn state is PLAYER_ACTING', function () {
  this.turnManager = new TurnManager();
  this.turnManager.setState(TURN_STATE.PLAYER_ACTING);
});

Given('the turn state is ENEMY_ACTING', function () {
  this.turnManager = new TurnManager();
  this.turnManager.setState(TURN_STATE.ENEMY_ACTING);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the inventory toggle fires', function () {
  this.openInventoryEmitted = applyInventoryToggle(this.turnManager);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the inventory should have opened', function () {
  assert.equal(this.openInventoryEmitted, true);
  assert.equal(this.turnManager.state, TURN_STATE.INVENTORY);
});

Then('the turn state should be INVENTORY', function () {
  assert.equal(this.turnManager.state, TURN_STATE.INVENTORY);
});

Then('the inventory should have closed', function () {
  assert.equal(this.openInventoryEmitted, true);
  assert.equal(this.turnManager.state, TURN_STATE.PLAYER_INPUT);
});

Then('the turn state should be PLAYER_INPUT', function () {
  assert.equal(this.turnManager.state, TURN_STATE.PLAYER_INPUT);
});

Then('the inventory should not have opened', function () {
  assert.equal(this.openInventoryEmitted, false);
});
