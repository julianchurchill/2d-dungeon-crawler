/**
 * Step definitions for the combined ShopPanel.
 *
 * ShopPanel is a Phaser UI component, so we supply a minimal mock scene that
 * satisfies the calls made inside _build(). This lets us test the panel's
 * logic in Node.js without a real Phaser renderer.
 */
import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { ShopPanel } from '../../src/ui/ShopPanel.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { Player } from '../../src/entities/Player.js';
import { EventBus } from '../../src/utils/EventBus.js';
import { GameEvents } from '../../src/events/GameEvents.js';

// ── Minimal Phaser scene mock ────────────────────────────────────────────────

/**
 * Creates a fluent stub object where every method returns itself,
 * except setText() which records the latest text.
 *
 * @param {string} [initialText]
 * @returns {object}
 */
function makeFluent(initialText = '') {
  const obj = { _text: initialText, _visible: true, height: 160 };
  const chain = () => obj;
  obj.setDepth = chain;
  obj.setScrollFactor = chain;
  obj.setVisible = (v) => { obj._visible = v; return obj; };
  obj.setStrokeStyle = chain;
  obj.setInteractive = chain;
  obj.setFillStyle = chain;
  obj.setOrigin = chain;
  obj.setPosition = chain;
  obj.setSize = chain;
  obj.setAlpha = chain;
  obj.add = chain;
  obj.remove = chain;
  obj._handlers = {};
  obj.on = (event, fn) => { obj._handlers[event] = fn; return obj; };
  obj.setText = (text) => { obj._text = text; return obj; };
  obj.setColor = chain;
  obj.setY = chain;
  return obj;
}

/**
 * Creates a minimal mock of a Phaser.Graphics object.
 *
 * @returns {object}
 */
function makeGraphics() {
  return {
    lineStyle: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    strokePath: () => {},
  };
}

/**
 * Creates a minimal mock Phaser.Scene sufficient for ShopPanel._build().
 *
 * @returns {object}
 */
function createMockScene() {
  return {
    scale: { width: 800, height: 600 },
    add: {
      container: () => makeFluent(),
      rectangle: () => makeFluent(),
      text: (_x, _y, text) => makeFluent(text),
      graphics: () => makeGraphics(),
    },
  };
}

// ── Shared state ─────────────────────────────────────────────────────────────

/** @type {ShopPanel} */
let panel;
/** @type {Player} */
let player;
/** @type {Array<{item: Item, buyPrice: number}>} */
let shopStock;
/** @type {Item[]} */
let inventory;
/** @type {string|null} */
let capturedSellItem = null;
/** @type {string|null} */
let capturedBuyItem = null;

// ── Hooks ────────────────────────────────────────────────────────────────────

After(function () {
  EventBus.removeAllListeners(GameEvents.SELL_ITEM);
  EventBus.removeAllListeners(GameEvents.BUY_ITEM);
  capturedSellItem = null;
  capturedBuyItem = null;
  panel = null;
});

// ── Given ────────────────────────────────────────────────────────────────────

Given('a weapon shop with stock containing a {string} for {int} gold', function (itemName, price) {
  // Build a minimal shop item matching the given name
  const typeDef = Object.values(ITEM_TYPES).find(t => t.name === itemName)
    ?? { id: 'custom', name: itemName, type: 'weapon', sellPrice: 10, textureKey: 'item_weapon' };
  const item = new Item(0, 0, typeDef);
  shopStock = [{ item, buyPrice: price }];
});

Given('a weapon shop with no stock', function () {
  shopStock = [];
});

Given('a player with a {string} in their inventory and {int} gold', function (itemName, gold) {
  player = new Player(0, 0);
  player.gold = gold;
  const typeDef = Object.values(ITEM_TYPES).find(t => t.name === itemName)
    ?? { id: 'custom', name: itemName, type: 'weapon', sellPrice: 10, textureKey: 'item_weapon' };
  const item = new Item(0, 0, typeDef);
  player.addItem(item);
  inventory = player.inventory;
});

Given('a player with no matching inventory items and {int} gold', function (gold) {
  player = new Player(0, 0);
  player.gold = gold;
  inventory = [];
});

// ── When ─────────────────────────────────────────────────────────────────────

When('the shop panel is shown', function () {
  panel = new ShopPanel(createMockScene());
  panel.show('weapon', shopStock, inventory, player);
});

When('the cursor is on the sell row for {string}', function (itemName) {
  // Cursor starts at index 0; find the sell row index for this item
  const idx = panel._sellGroups.findIndex(g => g.item.name === itemName);
  assert.ok(idx >= 0, `No sell row found for "${itemName}"`);
  // Navigate to that index (from 0)
  for (let i = 0; i < idx; i++) panel.navigate(1);
});

When('the cursor is navigated past the sell section to the buy row for {string}', function (itemName) {
  // Navigate past all sell rows to reach the buy section
  const sellCount = panel._sellGroups.length;
  const buyIdx = panel._buyStock.findIndex(s => s.item.name === itemName);
  assert.ok(buyIdx >= 0, `No buy row found for "${itemName}"`);
  const targetIndex = sellCount + buyIdx;
  for (let i = 0; i < targetIndex; i++) panel.navigate(1);
});

When('the player selects it', function () {
  EventBus.on(GameEvents.SELL_ITEM, ({ item }) => { capturedSellItem = item.name; });
  EventBus.on(GameEvents.BUY_ITEM, ({ shopItem }) => { capturedBuyItem = shopItem.item.name; });
  panel.select();
});

When('the panel gold is updated to {int}', function (gold) {
  panel.updateGold(gold);
});

// ── Then ─────────────────────────────────────────────────────────────────────

Then('the panel should show {string} in the sell section', function (itemName) {
  const found = panel._sellGroups.some(g => g.item.name === itemName);
  assert.ok(found, `Expected sell section to contain "${itemName}"`);
});

Then('the panel should show {string} in the buy section', function (itemName) {
  const found = panel._buyStock.some(s => s.item.name === itemName);
  assert.ok(found, `Expected buy section to contain "${itemName}"`);
});

Then('the sell section should appear before the buy section', function () {
  // The combined row list is: sell rows first, then buy rows.
  // _sellGroups.length sell rows come before _buyStock.length buy rows.
  // We verify the structural invariant: sell rows are at lower cursor indices.
  const totalSell = panel._sellGroups.length;
  const totalBuy = panel._buyStock.length;
  assert.ok(totalSell >= 0 && totalBuy >= 0, 'Expected valid row counts');
  // Navigate to last sell row and confirm cursor section is 'sell'
  if (totalSell > 0) {
    // Reset to cursor 0
    panel._cursorIndex = 0;
    assert.strictEqual(panel._cursorSection(), 'sell', 'Index 0 should be in sell section');
  }
  if (totalBuy > 0 && totalSell > 0) {
    panel._cursorIndex = totalSell;
    assert.strictEqual(panel._cursorSection(), 'buy', `Index ${totalSell} should be in buy section`);
  }
});

Then('the panel gold display should show {int}', function (gold) {
  assert.ok(
    panel._goldLabel._text.includes(String(gold)),
    `Expected gold display to include "${gold}", got "${panel._goldLabel._text}"`,
  );
});

Then('a SELL_ITEM event should have been emitted for {string}', function (itemName) {
  assert.strictEqual(capturedSellItem, itemName, `Expected SELL_ITEM for "${itemName}"`);
});

Then('a BUY_ITEM event should have been emitted for {string}', function (itemName) {
  assert.strictEqual(capturedBuyItem, itemName, `Expected BUY_ITEM for "${itemName}"`);
});

Then('the panel should indicate there is nothing to sell', function () {
  assert.ok(
    panel._emptySellText._visible,
    'Expected the empty-sell message to be visible',
  );
});

Then('the panel should indicate there is nothing to buy', function () {
  assert.ok(
    panel._emptyBuyText._visible,
    'Expected the empty-buy message to be visible',
  );
});
