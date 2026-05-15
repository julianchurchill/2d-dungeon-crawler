import { Given, When, Then } from '@cucumber/cucumber';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import assert from 'node:assert/strict';
import { CombatHandler } from '../../src/systems/CombatHandler.js';

/**
 * A minimal scene-context stub sufficient to construct a CombatHandler
 * without importing Phaser or wiring real game state.
 */
function makeMinimalScene() {
  return {};
}

// --- Given ---

Given('a CombatHandler bound to a minimal scene context', function () {
  this.combatHandler = new CombatHandler(makeMinimalScene());
});

// --- Then ---

Then('the combat handler exposes {word}', function (methodName) {
  assert.ok(
    typeof this.combatHandler[methodName] === 'function',
    `Expected CombatHandler to have method '${methodName}'`,
  );
});

// ── Drop item type definition (issue #244) ────────────────────────────────

/**
 * Builds a minimal scene stub for testing applyChampionLoot / applyBossLoot.
 * _placeItem is a spy that records the typeDef argument so the test can
 * assert it is a plain type definition, not an Item instance.
 */
function makeLootScene() {
  const scene = {
    player: { gold: 0, recordGoldGained: () => {} },
    items: [],
    _floorBuilder: {
      _lastPlacedTypeDef: undefined,
      _placeItem(_x, _y, typeDef) { this._lastPlacedTypeDef = typeDef; },
    },
  };
  return scene;
}

Given('a CombatHandler with a champion carrying a SWORD drop item', function () {
  this.lootScene = makeLootScene();
  this.combatHandler = new CombatHandler(this.lootScene);
  this.lootTarget = {
    x: 3, y: 4,
    name: 'Troll Champion',
    dropItem: new Item(3, 4, ITEM_TYPES.SWORD),
  };
});

Given('a CombatHandler with a boss carrying a SWORD drop item', function () {
  this.lootScene = makeLootScene();
  this.combatHandler = new CombatHandler(this.lootScene);
  this.lootTarget = {
    x: 5, y: 6,
    name: 'Old Bones',
    dropGold: 0,
    dropItem: new Item(5, 6, ITEM_TYPES.SWORD),
  };
});

Given('a CombatHandler with a champion carrying a raw SWORD type definition as drop item', function () {
  this.lootScene = makeLootScene();
  this.combatHandler = new CombatHandler(this.lootScene);
  this.lootTarget = {
    x: 3, y: 4,
    name: 'Troll Champion',
    dropItem: ITEM_TYPES.SWORD,
  };
});

Given('a CombatHandler with a boss carrying a raw SWORD type definition as drop item', function () {
  this.lootScene = makeLootScene();
  this.combatHandler = new CombatHandler(this.lootScene);
  this.lootTarget = {
    x: 5, y: 6,
    name: 'Old Bones',
    dropGold: 0,
    dropItem: ITEM_TYPES.SWORD,
  };
});

When('applyChampionLoot is called with the champion', function () {
  this.combatHandler.applyChampionLoot(this.lootTarget);
});

When('applyBossLoot is called with the boss', function () {
  this.combatHandler.applyBossLoot(this.lootTarget);
});

Then('the argument passed to _placeItem should not be an Item instance', function () {
  const placed = this.lootScene._floorBuilder._lastPlacedTypeDef;
  assert.ok(placed !== undefined, 'Expected _placeItem to have been called');
  assert.ok(
    !(placed instanceof Item),
    `Expected a plain type definition but got an Item instance (id: ${placed?.id})`,
  );
});
