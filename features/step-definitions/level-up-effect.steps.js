import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';
import { EventBus } from '../../src/utils/EventBus.js';

// Clean up the specific listener after each scenario in this file so other
// tests are not affected by leftover level-up event captures.
After(function () {
  EventBus.removeAllListeners('player-level-up');
});

Given('a player who needs 20 XP to reach the next level', function () {
  this.player = new Player(0, 0);
  // Player starts with xpToNext = 20, which matches the scenario.
  this.levelUpEvents = [];
  EventBus.on('player-level-up', (level) => this.levelUpEvents.push(level));
});

When('the player gains {int} XP and the game processes the level-up', function (xp) {
  // Mirror what GameScene._playerAttack does: call gainXP and, if the player
  // levelled up, emit the event.  This tests the contract without requiring
  // a full Phaser scene.
  const leveled = this.player.gainXP(xp);
  if (leveled) {
    EventBus.emit('player-level-up', this.player.stats.level);
  }
});

Then('a level-up event should have been emitted for level {int}', function (expected) {
  assert.ok(
    this.levelUpEvents.includes(expected),
    `Expected a player-level-up event for level ${expected} but got: [${this.levelUpEvents}]`
  );
});

Then('no level-up event should have been emitted', function () {
  assert.equal(
    this.levelUpEvents.length,
    0,
    `Expected no level-up events but got: [${this.levelUpEvents}]`
  );
});
