import { Given, When, Then, After } from '@cucumber/cucumber';
import { TurnManager } from '../../src/systems/TurnManager.js';
import { setStorage as setSaveStorage } from '../../src/save/SaveGame.js';
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

// ── Ascend placement ──────────────────────────────────────────────────────

/**
 * Builds a minimal scene stub for testing ascend() in isolation.
 * delayedCall fires synchronously so assertions can run without real timers.
 */
function makeAscendScene(stairsPos, stairsUpPos, isTown = false) {
  const player = {
    x: 0, y: 0,
    stats: { hp: 30, maxHp: 30, attack: 5, defense: 2, level: 1, xp: 0, xpToNext: 20, statPoints: 0 },
    gold: 0,
    inventory: [],
    equippedWeapon: null, equippedRangedWeapon: null, equippedArmor: null,
    equippedHelmet: null, equippedChest: null, equippedLegs: null,
    equippedArms: null, equippedBoots: null, equippedRing1: null,
    equippedRing2: null, equippedAmulet: null,
    skillSystem: null,
    runStats: undefined,
  };

  const dungeonMap = {
    width: 10,
    height: 10,
    tiles: new Uint8Array(100).fill(0),
    fovState: new Uint8Array(100).fill(0),
  };

  return {
    player,
    dungeonMap,
    enemies: [],
    items: [],
    npcs: [],
    shops: [],
    turnManager: new TurnManager(),
    rng: {},
    floorManager: {
      ascend: () => ({ stairsPos, stairsUpPos }),
      isTown: () => isTown,
      currentFloor: isTown ? 0 : 2,
    },
    playerSprite: { setPosition: () => {} },
    mapRT: {},
    cameras: { main: { fadeOut: () => {}, fadeIn: () => {} } },
    tweens: {},
    add: {},
    time: { delayedCall: (_ms, cb) => cb() },
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
    _entryTracker: null,
    _runStartItems: new Set(),
    _slot: 0,
    _buildFloor: () => {},
    _updateFOV: () => {},
    _syncRegistry: () => {},
  };
}

Given('a PlayerActionHandler bound to an ascend test scene with stairsPos at {int},{int} and stairsUpPos at {int},{int}',
  function (sx, sy, ux, uy) {
    setSaveStorage(null);
    const scene = makeAscendScene({ x: sx, y: sy }, { x: ux, y: uy }, false);
    this.ascendScene = scene;
    this.handler = new PlayerActionHandler(scene);
  },
);

Given('a PlayerActionHandler bound to a town ascend test scene with stairsPos at {int},{int} and stairsUpPos at {int},{int}',
  function (sx, sy, ux, uy) {
    setSaveStorage(null);
    const scene = makeAscendScene({ x: sx, y: sy }, { x: ux, y: uy }, true);
    this.ascendScene = scene;
    this.handler = new PlayerActionHandler(scene);
  },
);

After(function () {
  setSaveStorage(null);
});

When('ascend is called on the handler', function () {
  this.handler.ascend();
});

Then('the player x should be {int}', function (expected) {
  assert.equal(this.ascendScene.player.x, expected,
    `Expected player.x to be ${expected} but got ${this.ascendScene.player.x}`);
});

Then('the player y should be {int}', function (expected) {
  assert.equal(this.ascendScene.player.y, expected,
    `Expected player.y to be ${expected} but got ${this.ascendScene.player.y}`);
});