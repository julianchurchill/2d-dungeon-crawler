/**
 * Step definitions for EquipmentPanel display behaviour.
 *
 * EquipmentPanel is a Phaser UI component, so we supply a minimal mock
 * scene that satisfies the Phaser API calls made inside _build().
 */
import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { EquipmentPanel } from '../../src/ui/EquipmentPanel.js';
import { Player } from '../../src/entities/Player.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { EventBus } from '../../src/utils/EventBus.js';
import { GameEvents } from '../../src/events/GameEvents.js';

// ── Minimal Phaser scene mock ────────────────────────────────────────────────

/**
 * Creates a fluent stub whose every method returns itself,
 * with setText() recording the last text value for assertions.
 *
 * @param {string} [initialText]
 * @returns {object}
 */
function makeFluent(initialText = '') {
  const obj = { _text: initialText };
  const chain = () => obj;
  obj.setDepth        = chain;
  obj.setScrollFactor = chain;
  obj.setVisible      = (v) => { obj._visible = v; return obj; };
  obj.setStrokeStyle  = chain;
  obj.setInteractive  = chain;
  obj.setFillStyle    = chain;
  obj.setOrigin       = chain;
  obj.setPosition     = chain;
  obj.add             = chain;
  obj._handlers       = {};
  obj.on              = (event, fn) => { obj._handlers[event] = fn; return obj; };
  obj.setText         = (text) => { obj._text = text; return obj; };
  return obj;
}

/**
 * Creates a minimal Phaser.Scene mock sufficient for EquipmentPanel.
 *
 * @returns {{ scale: object, add: object }}
 */
function createMockScene() {
  return {
    scale: { width: 800, height: 600 },
    add: {
      container:  () => makeFluent(),
      rectangle:  () => makeFluent(),
      text:       (_x, _y, text) => makeFluent(text),
      image:      (_x, _y, key) => {
        const img = makeFluent(key);
        img.setDisplaySize = () => img;
        img.setTexture = (k) => { img._textureKey = k; return img; };
        return img;
      },
    },
  };
}

/**
 * Minimal TilesetManager stub — prefixes the key with 'classic_' to simulate
 * the real singleton behaviour without touching localStorage or Phaser textures.
 *
 * @returns {{ getTileKey: (key: string) => string }}
 */
function createMockTilesetManager() {
  return { getTileKey: (key) => `classic_${key}` };
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/** Clean up INVENTORY_CHANGED listeners after each scenario. */
After(function () {
  EventBus.removeAllListeners(GameEvents.INVENTORY_CHANGED);
});

// ── Given ────────────────────────────────────────────────────────────────────

Given('an equipment panel with an unequipped player', function () {
  this.player = new Player(0, 0);
  this.equipmentPanel = new EquipmentPanel(createMockScene(), createMockTilesetManager());
});

Given('an equipment panel with a player who has a short sword equipped', function () {
  this.player = new Player(0, 0);
  this.player.equippedWeapon = new Item(0, 0, ITEM_TYPES.SWORD);
  this.equipmentPanel = new EquipmentPanel(createMockScene(), createMockTilesetManager());
});

Given('an equipment panel with a player who has leather armor equipped', function () {
  this.player = new Player(0, 0);
  this.player.equippedArmor = new Item(0, 0, ITEM_TYPES.LEATHER_ARMOR);
  this.equipmentPanel = new EquipmentPanel(createMockScene(), createMockTilesetManager());
});

Given('an equipment panel with a player who has a short bow equipped', function () {
  this.player = new Player(0, 0);
  this.player.equippedRangedWeapon = new Item(0, 0, ITEM_TYPES.SHORT_BOW);
  this.equipmentPanel = new EquipmentPanel(createMockScene(), createMockTilesetManager());
});

// ── When ─────────────────────────────────────────────────────────────────────

When('the equipment panel is shown', function () {
  this.equipmentPanel.show(this.player);
});

When('the equipment panel is hidden', function () {
  this.equipmentPanel.hide();
});

When('a short sword is equipped via the inventory changed event', function () {
  this.player.equippedWeapon = new Item(0, 0, ITEM_TYPES.SWORD);
  EventBus.emit(GameEvents.INVENTORY_CHANGED, this.player.inventory);
});

When('leather armor is equipped via the inventory changed event', function () {
  this.player.equippedArmor = new Item(0, 0, ITEM_TYPES.LEATHER_ARMOR);
  EventBus.emit(GameEvents.INVENTORY_CHANGED, this.player.inventory);
});

When('a short bow is equipped via the inventory changed event', function () {
  this.player.equippedRangedWeapon = new Item(0, 0, ITEM_TYPES.SHORT_BOW);
  EventBus.emit(GameEvents.INVENTORY_CHANGED, this.player.inventory);
});

// ── Then ─────────────────────────────────────────────────────────────────────

Then('the equipment panel is visible', function () {
  assert.ok(this.equipmentPanel.visible, 'Expected equipment panel to be visible');
});

Then('the equipment panel is not visible', function () {
  assert.ok(!this.equipmentPanel.visible, 'Expected equipment panel to be hidden');
});

Then('the weapon slot label is {string}', function (expected) {
  const text = this.equipmentPanel._weaponLabel._text;
  assert.equal(text, expected, `Expected weapon label "${expected}" but got "${text}"`);
});

Then('the shield slot label is {string}', function (expected) {
  const text = this.equipmentPanel._shieldLabel._text;
  assert.equal(text, expected, `Expected shield label "${expected}" but got "${text}"`);
});

Then('the weapon slot icon is not visible', function () {
  assert.equal(this.equipmentPanel._weaponIcon._visible, false, 'Expected weapon icon to be hidden');
});

Then('the shield slot icon is not visible', function () {
  assert.equal(this.equipmentPanel._shieldIcon._visible, false, 'Expected shield icon to be hidden');
});

Then('the weapon slot icon is visible', function () {
  assert.equal(this.equipmentPanel._weaponIcon._visible, true, 'Expected weapon icon to be visible');
});

Then('the shield slot icon is visible', function () {
  assert.equal(this.equipmentPanel._shieldIcon._visible, true, 'Expected shield icon to be visible');
});

Then('the weapon slot icon texture contains {string}', function (expected) {
  const key = this.equipmentPanel._weaponIcon._textureKey ?? '';
  assert.ok(key.includes(expected), `Expected weapon icon texture to contain "${expected}" but got "${key}"`);
});

Then('the shield slot icon texture contains {string}', function (expected) {
  const key = this.equipmentPanel._shieldIcon._textureKey ?? '';
  assert.ok(key.includes(expected), `Expected shield icon texture to contain "${expected}" but got "${key}"`);
});

Then('the ranged slot label is {string}', function (expected) {
  const text = this.equipmentPanel._rangedLabel._text;
  assert.equal(text, expected, `Expected ranged label "${expected}" but got "${text}"`);
});

Then('the ranged slot icon is not visible', function () {
  assert.equal(this.equipmentPanel._rangedIcon._visible, false, 'Expected ranged icon to be hidden');
});

Then('the ranged slot icon is visible', function () {
  assert.equal(this.equipmentPanel._rangedIcon._visible, true, 'Expected ranged icon to be visible');
});

Then('the ranged slot icon texture contains {string}', function (expected) {
  const key = this.equipmentPanel._rangedIcon._textureKey ?? '';
  assert.ok(key.includes(expected), `Expected ranged icon texture to contain "${expected}" but got "${key}"`);
});
