import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { PlayerActionHandler } from '../../src/systems/PlayerActionHandler.js';

/**
 * A minimal scene-context stub sufficient to construct a PlayerActionHandler
 * without importing Phaser or wiring real game state.
 */
function makeMinimalScene() {
  return {
    player: {},
    dungeonMap: {},
    enemies: [],
    items: [],
    shops: [],
    turnManager: {},
    rng: {},
    floorManager: {},
    playerSprite: {},
    mapRT: {},
    cameras: { main: {} },
    tweens: {},
    add: {},
    time: {},
    scene: {},
    heldMovement: {},
    _runController: {},
    _lookCursor: null,
    _aimingRanged: false,
    _activeShop: null,
    _dungeonSnapshot: null,
    _hiddenPassages: [],
    _hiddenPassageDraftShown: new Set(),
    _isChallengeFloor: false,
    _entryTracker: {},
    _runStartItems: new Set(),
    _slot: 0,
  };
}

// --- Given ---

Given('a PlayerActionHandler bound to a minimal scene context', function () {
  this.handler = new PlayerActionHandler(makeMinimalScene());
});

// --- Then ---

Then('the handler exposes {word}', function (methodName) {
  assert.ok(
    typeof this.handler[methodName] === 'function',
    `Expected PlayerActionHandler to have method '${methodName}'`,
  );
});
