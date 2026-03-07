/**
 * Step definitions for InventoryPanel display behaviour.
 *
 * InventoryPanel is a Phaser UI component, so we supply a minimal mock
 * scene that satisfies the calls made inside _build(). This lets us test
 * the panel's refresh logic in Node.js without a real Phaser renderer.
 */
import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { InventoryPanel } from '../../src/ui/InventoryPanel.js';
import { Player } from '../../src/entities/Player.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { InventorySystem } from '../../src/systems/InventorySystem.js';
import { EventBus } from '../../src/utils/EventBus.js';
import { GameEvents } from '../../src/events/GameEvents.js';

// ── Minimal Phaser scene mock ────────────────────────────────────────────────

/**
 * Creates a fluent stub object where every method returns itself,
 * except setText() which records the current display text.
 *
 * @param {string} [initialText] - Initial text value for text objects.
 * @returns {object} Stub with chainable Phaser-like methods.
 */
function makeFluent(initialText = '') {
  const obj = { _text: initialText };
  const chain = () => obj;
  obj.setDepth = chain;
  obj.setScrollFactor = chain;
  obj.setVisible = (v) => { obj._visible = v; return obj; };
  obj.setStrokeStyle = chain;
  obj.setInteractive = chain;
  obj.setFillStyle = chain;
  obj.setOrigin = chain;
  obj.setPosition = chain;
  obj.add = chain;
  obj._handlers = {};
  obj.on = (event, fn) => { obj._handlers[event] = fn; return obj; };
  obj.setText = (text) => { obj._text = text; return obj; };
  return obj;
}

/**
 * Creates a minimal mock of a Phaser.Scene sufficient for InventoryPanel.
 * Includes a mock keyboard so _addKeyListeners / _removeKeyListeners can run
 * without errors.
 *
 * @returns {{ scale: object, add: object, input: object }} Mock scene object.
 */
function createMockScene() {
  const keyboard = { on: () => {}, off: () => {} };
  return {
    scale: { width: 800, height: 600 },
    add: {
      container: () => makeFluent(),
      rectangle: () => makeFluent(),
      text: (_x, _y, text) => makeFluent(text),
    },
    input: { keyboard },
  };
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Remove the inventory-changed listeners registered during this scenario
 * to prevent listener accumulation across the test suite.
 */
After(function () {
  EventBus.removeAllListeners(GameEvents.INVENTORY_CHANGED);
});

// ── Given ────────────────────────────────────────────────────────────────────

Given('the inventory panel is open showing a player with a short sword in inventory', function () {
  this.player = new Player(0, 0);
  this.player.addItem(new Item(0, 0, ITEM_TYPES.SWORD));
  this.inventoryPanel = new InventoryPanel(createMockScene());
  this.inventoryPanel.show(this.player.inventory, this.player);
});

Given('the inventory panel is open showing a player with leather armor in inventory', function () {
  this.player = new Player(0, 0);
  this.player.addItem(new Item(0, 0, ITEM_TYPES.LEATHER_ARMOR));
  this.inventoryPanel = new InventoryPanel(createMockScene());
  this.inventoryPanel.show(this.player.inventory, this.player);
});

// ── When ─────────────────────────────────────────────────────────────────────

When('the player equips the short sword via the inventory panel', function () {
  InventorySystem.useItem(this.player, 0);
});

When('the player equips the leather armor via the inventory panel', function () {
  InventorySystem.useItem(this.player, 0);
});

// ── Then ─────────────────────────────────────────────────────────────────────

Then('the inventory panel should show {string} as the equipped weapon', function (expectedName) {
  const text = this.inventoryPanel._equippedText._text;
  assert.ok(
    text.includes(expectedName),
    `Expected equipped text "${text}" to include weapon name "${expectedName}"`,
  );
});

Then('the inventory panel should show {string} as the equipped armor', function (expectedName) {
  const text = this.inventoryPanel._equippedText._text;
  assert.ok(
    text.includes(expectedName),
    `Expected equipped text "${text}" to include armor name "${expectedName}"`,
  );
});
