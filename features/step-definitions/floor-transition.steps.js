import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { TurnManager, TURN_STATE } from '../../src/systems/TurnManager.js';
import { startFloorTransition } from '../../src/systems/FloorTransition.js';

Given('the turn manager is in the PLAYER_INPUT state', function () {
  this.turnManager = new TurnManager();
  // TurnManager starts in PLAYER_INPUT by default.
});

Given('the turn manager is in the TRANSITIONING state', function () {
  this.turnManager = new TurnManager();
  this.turnManager.setState(TURN_STATE.TRANSITIONING);
});

Given('the turn manager is in the ENEMY_ACTING state', function () {
  this.turnManager = new TurnManager();
  this.turnManager.setState(TURN_STATE.ENEMY_ACTING);
});

When('a floor transition is started', function () {
  this.transitionResult = startFloorTransition(this.turnManager);
});

Then('the floor transition should have been accepted', function () {
  assert.ok(this.transitionResult, 'Expected floor transition to be accepted but it was rejected');
});

Then('the floor transition should have been rejected', function () {
  assert.ok(!this.transitionResult, 'Expected floor transition to be rejected but it was accepted');
});

Then('the turn manager state should be TRANSITIONING', function () {
  assert.equal(this.turnManager.state, TURN_STATE.TRANSITIONING,
    `Expected turn manager state to be TRANSITIONING but got ${this.turnManager.state}`);
});
