/**
 * Step definitions for the "confirm before selling equipped items" feature.
 */
import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { ShopPanel } from '../../src/ui/ShopPanel.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { Player } from '../../src/entities/Player.js';
import { SkillSystem } from '../../src/systems/SkillSystem.js';
import { EventBus } from '../../src/utils/EventBus.js';
import { GameEvents } from '../../src/events/GameEvents.js';

// ── Minimal Phaser scene mock ────────────────────────────────────────────────

function makeFluent(initialText = '') {
  const obj = { _text: initialText, _visible: true, height: 160 };
  const chain = () => obj;
  obj.setDepth = chain; obj.setScrollFactor = chain;
  obj.setVisible = (v) => { obj._visible = v; return obj; };
  obj.setStrokeStyle = chain; obj.setInteractive = chain;
  obj.setFillStyle = chain; obj.setOrigin = chain;
  obj.setPosition = chain; obj.setSize = chain; obj.setAlpha = chain;
  obj.add = chain; obj.remove = chain;
  obj._handlers = {};
  obj.on = (event, fn) => { obj._handlers[event] = fn; return obj; };
  obj.setText = (text) => { obj._text = text; return obj; };
  obj.setColor = chain; obj.setY = chain;
  return obj;
}

function makeGraphics() {
  return { lineStyle: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, strokePath: () => {} };
}

function createMockScene() {
  return {
    scale: { width: 800, height: 600 },
    add: {
      container: () => makeFluent(),
      rectangle: () => makeFluent(),
      text: (_x, _y, text) => makeFluent(text),
      graphics: () => makeGraphics(),
      image: (_x, _y, key) => { const img = makeFluent(key); img.setDisplaySize = () => img; img.setOrigin = () => img; return img; },
    },
  };
}

// ── Shared state ─────────────────────────────────────────────────────────────

/** @type {ShopPanel} */
let panel;
/** @type {string|null} */
let capturedSellItem = null;
/** @type {string|null} */
let capturedMessage = null;

/** Opens a weapon shop panel with the given player and a dummy buy-stock entry. */
function openPanel(player) {
  const buyStock = [{ item: new Item(0, 0, ITEM_TYPES.LONG_SWORD), buyPrice: 30 }];
  panel = new ShopPanel(createMockScene());
  panel.show('weapon', buyStock, player.inventory, player);
  EventBus.on(GameEvents.SELL_ITEM, ({ item }) => { capturedSellItem = item.name; });
  EventBus.on(GameEvents.MESSAGE, (msg) => { capturedMessage = msg; });
  // Navigate cursor to the sell section (index 0 = first sell row)
  panel._cursorIndex = 0;
  panel._updateCursor();
}

// ── Hooks ────────────────────────────────────────────────────────────────────

After(function () {
  EventBus.removeAllListeners(GameEvents.SELL_ITEM);
  EventBus.removeAllListeners(GameEvents.MESSAGE);
  capturedSellItem = null;
  capturedMessage = null;
  panel = null;
});

// ── Given ────────────────────────────────────────────────────────────────────

Given('a sell-confirm shop panel with a non-equipped Short Sword', function () {
  const player = new Player(0, 0, new SkillSystem(null, [], []));
  const sword = new Item(0, 0, ITEM_TYPES.SWORD);
  player.addItem(sword);
  // equippedWeapon intentionally left null — sword is in inventory but not equipped
  openPanel(player);
});

Given('a sell-confirm shop panel with the Short Sword equipped', function () {
  const player = new Player(0, 0, new SkillSystem(null, [], []));
  const sword = new Item(0, 0, ITEM_TYPES.SWORD);
  player.addItem(sword);
  player.equippedWeapon = sword;
  openPanel(player);
});

// ── When ─────────────────────────────────────────────────────────────────────

When('the player presses sell', function () {
  panel.select();
});

When('the player presses sell again', function () {
  panel.select();
});

When('the shop panel cursor is moved', function () {
  panel.navigate(1);
});

// ── Then ─────────────────────────────────────────────────────────────────────

Then('the sell-confirm SELL_ITEM event should have been emitted for {string}', function (itemName) {
  assert.equal(capturedSellItem, itemName,
    `Expected SELL_ITEM for "${itemName}", got "${capturedSellItem}"`);
});

Then('no SELL_ITEM event should have been emitted', function () {
  assert.equal(capturedSellItem, null, 'Expected no SELL_ITEM event to have been emitted');
});

Then('a sell-equipped warning message should be shown', function () {
  assert.ok(capturedMessage, 'Expected a MESSAGE event to have been emitted');
  assert.ok(
    capturedMessage.toLowerCase().includes('equipped'),
    `Expected warning to mention "equipped", got: "${capturedMessage}"`,
  );
});

Then('the pending sell confirmation should be cleared', function () {
  assert.equal(panel._pendingConfirmIndex, -1,
    'Expected _pendingConfirmIndex to be -1 after navigation');
});
