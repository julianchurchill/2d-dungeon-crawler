import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { PlayerActionHandler } from '../../src/systems/PlayerActionHandler.js';
import { TurnManager, TURN_STATE } from '../../src/systems/TurnManager.js';
import { setStorage as setSaveStorage } from '../../src/save/SaveGame.js';
import { Player } from '../../src/entities/Player.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';

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

// ── Ascend placement (issue #240) ─────────────────────────────────────────

/**
 * Minimal scene stub for testing ascend() in isolation.
 * delayedCall fires synchronously so assertions run without real timers.
 * setSaveStorage(null) ensures saveGame() is a no-op during the test.
 */
function makeAscendScene(stairsPos, stairsUpPos) {
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
  return {
    player,
    dungeonMap: { width: 10, height: 10, tiles: new Uint8Array(100).fill(0), fovState: new Uint8Array(100).fill(0) },
    enemies: [], items: [], npcs: [], shops: [],
    turnManager: new TurnManager(),
    rng: {},
    floorManager: {
      ascend:       () => ({ stairsPos, stairsUpPos }),
      isTown:       () => false,
      currentFloor: 2,
    },
    playerSprite:  { setPosition: () => {} },
    mapRT: {}, cameras: { main: { fadeOut: () => {}, fadeIn: () => {} } },
    tweens: {}, add: {}, scene: {}, heldMovement: {}, _runController: {},
    time:          { delayedCall: (_ms, cb) => cb() },
    _lookCursor:   null, _aimingRanged: false, _activeShop: null,
    _dungeonSnapshot: null, _hiddenPassages: [], _hiddenPassageDraftShown: new Set(),
    _isChallengeFloor: false, _entryTracker: null, _runStartItems: new Set(), _slot: 0,
    _buildFloor:   () => {},
    _updateFOV:    () => {},
    _syncRegistry: () => {},
  };
}

After(function () {
  setSaveStorage(null);
});

Given('a PlayerActionHandler bound to an ascend test scene with stairsPos at {int},{int} and stairsUpPos at {int},{int}',
  function (sx, sy, ux, uy) {
    setSaveStorage(null);
    this.ascendScene = makeAscendScene({ x: sx, y: sy }, { x: ux, y: uy });
    this.handler = new PlayerActionHandler(this.ascendScene);
  },
);

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

// ── Equip from inventory (issue #241) ─────────────────────────────────────

/**
 * Minimal scene stub for testing useInventoryItem() with a non-consumable.
 * Tracks whether _startEnemyTurns() was called so the test can assert it wasn't.
 */
function makeEquipScene(player) {
  const turnManager = new TurnManager();
  turnManager.setState(TURN_STATE.INVENTORY);
  let enemyTurnsStarted = false;
  const scene = {
    player,
    rng: {},
    dungeonMap: { isWalkable: () => true },
    _getEntityAt: () => null,
    floorManager: { isTown: () => false },
    turnManager,
    _syncRegistry:    () => {},
    _gameOver:        () => {},
    _startEnemyTurns: () => { enemyTurnsStarted = true; },
    // Unused by useInventoryItem but required for construction:
    enemies: [], items: [], shops: [], npcs: [], mapRT: {},
    cameras: { main: {} }, tweens: {}, add: {}, time: {}, scene: {},
    heldMovement: {}, _runController: {}, playerSprite: {},
    _lookCursor: null, _aimingRanged: false, _activeShop: null,
    _dungeonSnapshot: null, _hiddenPassages: [], _hiddenPassageDraftShown: new Set(),
    _isChallengeFloor: false, _entryTracker: {}, _runStartItems: new Set(), _slot: 0,
  };
  scene._enemyTurnsStarted = () => enemyTurnsStarted;
  return scene;
}

Given('a PlayerActionHandler with a weapon in inventory and turn state INVENTORY', function () {
  const player = new Player(0, 0);
  player.addItem(new Item(0, 0, ITEM_TYPES.SWORD));
  this.equipScene = makeEquipScene(player);
  this.handler = new PlayerActionHandler(this.equipScene);
});

When('the player uses inventory item at index {int}', function (index) {
  this.handler.useInventoryItem(index);
});

Then('the turn state should still be INVENTORY', function () {
  assert.equal(this.equipScene.turnManager.state, TURN_STATE.INVENTORY,
    `Expected turn state to remain INVENTORY but got ${this.equipScene.turnManager.state}`);
});

Then('enemy turns should not have started', function () {
  assert.ok(!this.equipScene._enemyTurnsStarted(),
    'Expected _startEnemyTurns() not to have been called after equipping');
});