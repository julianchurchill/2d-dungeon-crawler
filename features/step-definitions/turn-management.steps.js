import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { TurnManager, TURN_STATE } from '../../src/systems/TurnManager.js';

// --- Given ---

Given('a new turn manager', function () {
  this.turnManager = new TurnManager();
});

// --- When ---

When('the player starts acting', function () {
  this.turnManager.setState(TURN_STATE.PLAYER_ACTING);
});

When('the enemy turn begins', function () {
  this.turnManager.setState(TURN_STATE.ENEMY_ACTING);
});

When('the enemy turn ends', function () {
  this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
});

When('game over occurs', function () {
  this.turnManager.setState(TURN_STATE.GAME_OVER);
});

When('the inventory is opened', function () {
  this.turnManager.setState(TURN_STATE.INVENTORY);
});

// --- Then ---

Then('the turn state should be {string}', function (expectedState) {
  assert.equal(this.turnManager.state, expectedState);
});

Then('the game should be accepting player input', function () {
  assert.ok(
    this.turnManager.isAcceptingInput(),
    `Expected game to accept input, but state is "${this.turnManager.state}"`
  );
});

Then('the game should not be accepting player input', function () {
  assert.ok(
    !this.turnManager.isAcceptingInput(),
    `Expected game NOT to accept input, but state is "${this.turnManager.state}"`
  );
});
