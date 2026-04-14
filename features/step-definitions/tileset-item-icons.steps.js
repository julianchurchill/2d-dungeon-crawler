/**
 * Step definitions for tileset-aware item icon scenarios.
 *
 * Each panel (InventoryPanel, ShopPanel, DisplayCasePanel) is constructed with
 * a minimal mock Phaser scene that records every `add.image()` call, and a
 * fresh TilesetManager backed by in-memory storage so the active tileset can
 * be controlled per-scenario.
 */
import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { TilesetManager } from '../../src/systems/TilesetManager.js';
import { InventoryPanel } from '../../src/ui/InventoryPanel.js';
import { ShopPanel } from '../../src/ui/ShopPanel.js';
import { DisplayCasePanel } from '../../src/ui/DisplayCasePanel.js';
import { Player } from '../../src/entities/Player.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { DisplayCase } from '../../src/systems/DisplayCase.js';
import { EventBus } from '../../src/utils/EventBus.js';
import { GameEvents } from '../../src/events/GameEvents.js';

// ── In-memory storage stub ────────────────────────────────────────────────────

/** Creates a minimal localStorage-compatible in-memory store. */
function makeStorage() {
  const data = {};
  return {
    getItem:    (k) => (k in data ? data[k] : null),
    setItem:    (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
  };
}

// ── Fluent Phaser game-object stub ────────────────────────────────────────────

/**
 * Creates a chainable stub that records the most recent texture key set on it.
 *
 * @param {string} [initialKey] - Initial texture key (for image stubs).
 * @returns {object}
 */
function makeFluent(initialKey = '') {
  const obj = { _text: initialKey, _textureKey: initialKey, _visible: true };
  const chain = () => obj;
  obj.setDepth        = chain;
  obj.setScrollFactor = chain;
  obj.setVisible      = (v) => { obj._visible = v; return obj; };
  obj.setStrokeStyle  = chain;
  obj.setInteractive  = chain;
  obj.setFillStyle    = chain;
  obj.setOrigin       = chain;
  obj.setPosition     = chain;
  obj.setSize         = chain;
  obj.setColor        = chain;
  obj.setY            = chain;
  obj.setX            = chain;
  obj.add             = chain;
  obj.destroy         = () => {};
  obj._handlers       = {};
  obj.on              = (event, fn) => { obj._handlers[event] = fn; return obj; };
  obj.setText         = (text) => { obj._text = text; return obj; };
  obj.setTexture      = (key) => { obj._textureKey = key; return obj; };
  obj.setDisplaySize  = chain;
  return obj;
}

/**
 * Creates a minimal graphics stub for panels that call `scene.add.graphics()`.
 *
 * @returns {object}
 */
function makeGraphics() {
  const g = makeFluent();
  g.lineStyle  = () => g;
  g.beginPath  = () => g;
  g.moveTo     = () => g;
  g.lineTo     = () => g;
  g.closePath  = () => g;
  g.strokePath = () => g;
  g.fillPath   = () => g;
  return g;
}

/**
 * Creates a minimal mock Phaser scene that records every `add.image()` call.
 *
 * @returns {{ scene: object, imageKeys: string[] }}
 */
function createMockScene() {
  const imageKeys = [];
  const keyboard = { on: () => {}, off: () => {} };
  const scene = {
    scale: { width: 800, height: 600 },
    add: {
      container: () => makeFluent(),
      rectangle: () => makeFluent(),
      text:      (_x, _y, text) => makeFluent(text),
      graphics:  () => makeGraphics(),
      image:     (_x, _y, key) => {
        const img = makeFluent(key);
        img._textureKey = key;
        img.setTexture = (k) => { img._textureKey = k; imageKeys.push(k); return img; };
        imageKeys.push(key);
        return img;
      },
    },
    input: { keyboard },
  };
  return { scene, imageKeys };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

After(function () {
  EventBus.removeAllListeners(GameEvents.INVENTORY_CHANGED);
  EventBus.removeAllListeners(GameEvents.SELL_PANEL_TOGGLED);
  EventBus.removeAllListeners(GameEvents.DISPLAY_CASE_TOGGLED);
  EventBus.removeAllListeners(GameEvents.DISPLAY_CASE_CHANGED);
});

// ── Given ─────────────────────────────────────────────────────────────────────

Given('the active tileset is {string} for item icon tests', function (tileset) {
  this.storage = makeStorage();
  this.tilesetManager = new TilesetManager(this.storage);
  this.tilesetManager.setTileset(tileset);
});

Given('the inventory panel is showing a health potion for icon testing', function () {
  const { scene, imageKeys } = createMockScene();
  this.imageKeys = imageKeys;
  this.inventoryPanel = new InventoryPanel(scene, this.tilesetManager);
  const player = new Player(0, 0);
  player.addItem(new Item(0, 0, ITEM_TYPES.HEALTH_POTION));
  this.inventoryPanel.show(player.inventory, player);
});

Given('the shop panel is showing a health potion for sale for icon testing', function () {
  const { scene, imageKeys } = createMockScene();
  this.imageKeys = imageKeys;
  this.shopPanel = new ShopPanel(scene, this.tilesetManager);
  const stock = [{ item: new Item(0, 0, ITEM_TYPES.HEALTH_POTION), buyPrice: 10 }];
  const player = new Player(0, 0);
  this.shopPanel.show('potion', stock, [], player);
});

Given('the display case panel is showing a Bone Blade in inventory for icon testing', function () {
  const { scene, imageKeys } = createMockScene();
  this.imageKeys = imageKeys;
  this.displayCasePanel = new DisplayCasePanel(scene, this.tilesetManager);
  const player = new Player(0, 0);
  const boneBlade = new Item(0, 0, ITEM_TYPES.BONE_BLADE);
  player.addItem(boneBlade);
  const displayCase = new DisplayCase();
  this.displayCasePanel.show(displayCase, player.inventory, player);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the inventory panel item icon should use texture {string}', function (expectedKey) {
  assert.ok(
    this.imageKeys.includes(expectedKey),
    `Expected an image with texture "${expectedKey}" but got: [${this.imageKeys.join(', ')}]`,
  );
});

Then('the shop panel item icon should use texture {string}', function (expectedKey) {
  assert.ok(
    this.imageKeys.includes(expectedKey),
    `Expected an image with texture "${expectedKey}" but got: [${this.imageKeys.join(', ')}]`,
  );
});

Then('the display case panel item icon should use texture {string}', function (expectedKey) {
  assert.ok(
    this.imageKeys.includes(expectedKey),
    `Expected an image with texture "${expectedKey}" but got: [${this.imageKeys.join(', ')}]`,
  );
});
