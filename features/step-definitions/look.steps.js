/**
 * Step definitions for the Look feature.
 *
 * LookPanel is a Phaser UI component, so the scene is mocked with fluent
 * stubs that capture text and visibility state for assertion.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { LookPanel } from '../../src/ui/LookPanel.js';
import { TILE } from '../../src/utils/TileTypes.js';

// ── Minimal Phaser scene mock ─────────────────────────────────────────────

/**
 * Creates a fluent stub that records setText calls and visibility changes.
 * @returns {object}
 */
function makeFluent() {
  const obj = { _text: '', _visible: true };
  const chain = () => obj;
  obj.setDepth        = chain;
  obj.setScrollFactor = chain;
  obj.setVisible      = (v) => { obj._visible = v; return obj; };
  obj._x = 0;
  obj._y = 0;
  obj.setPosition = (x, y) => { obj._x = x; obj._y = y; return obj; };
  obj.setScale        = chain;
  obj.setStrokeStyle  = chain;
  obj.setInteractive  = chain;
  obj.setFillStyle    = chain;
  obj.setOrigin       = chain;
  obj.setSize         = chain;
  obj.setAlpha        = chain;
  obj.setWordWrapWidth = chain;
  obj.add             = chain;
  obj._handlers       = {};
  obj.on              = (ev, fn) => { obj._handlers[ev] = fn; return obj; };
  obj.setText         = (t) => { obj._text = String(t); return obj; };
  obj.setColor        = chain;
  obj.destroy         = () => {};
  return obj;
}

/**
 * Builds a minimal Phaser.Scene mock for LookPanel construction.
 * @returns {object}
 */
function createMockScene() {
  const texts = [];
  return {
    scale: { width: 800, height: 600 },
    add: {
      container: () => {
        const c = makeFluent();
        c._children = [];
        c.add = (child) => { c._children.push(child); return c; };
        return c;
      },
      rectangle: () => makeFluent(),
      text: (_x, _y, initial) => {
        const t = makeFluent();
        t._text = typeof initial === 'string' ? initial : '';
        texts.push(t);
        return t;
      },
    },
    _texts: texts,
  };
}

// ── Steps ─────────────────────────────────────────────────────────────────

Given('a LookPanel', function () {
  this.mockScene = createMockScene();
  this.lookPanel = new LookPanel(this.mockScene);
});

When('the look panel is shown for an enemy named {string} with {int} of {int} HP',
  function (name, hp, maxHp) {
    this.lookPanel.showEnemy({ name, stats: { hp, maxHp } });
  });

When('the look panel is shown for an item named {string} described as {string}',
  function (name, description) {
    this.lookPanel.showItem({ name, description });
  });

When('the look panel is shown for a floor tile', function () {
  this.lookPanel.showTile(TILE.FLOOR);
});

When('the look panel is shown for a wall tile', function () {
  this.lookPanel.showTile(TILE.WALL);
});

When('the look panel is shown for a door tile', function () {
  this.lookPanel.showTile(TILE.DOOR);
});

When('the look panel is shown for a stairs down tile', function () {
  this.lookPanel.showTile(TILE.STAIRS_DOWN);
});

When('the look panel is shown for a stairs up tile', function () {
  this.lookPanel.showTile(TILE.STAIRS_UP);
});

When('the look panel is hidden', function () {
  this.lookPanel.hide();
});

Then('the look panel should be visible', function () {
  assert.ok(this.lookPanel.visible, 'Expected LookPanel to be visible');
});

Then('the look panel should not be visible', function () {
  assert.ok(!this.lookPanel.visible, 'Expected LookPanel to be hidden');
});

Then('the look panel should display the name {string}', function (expected) {
  assert.equal(this.lookPanel._nameText._text, expected,
    `Expected name text "${expected}" but got "${this.lookPanel._nameText._text}"`);
});

Then('the look panel should display the detail {string}', function (expected) {
  assert.equal(this.lookPanel._detailText._text, expected,
    `Expected detail text "${expected}" but got "${this.lookPanel._detailText._text}"`);
});

Then('the panel position x should be {int}', function (expected) {
  assert.equal(this.lookPanel._container._x, expected,
    `Expected panel x ${expected} but got ${this.lookPanel._container._x}`);
});

Then('the panel position y should be {int}', function (expected) {
  assert.equal(this.lookPanel._container._y, expected,
    `Expected panel y ${expected} but got ${this.lookPanel._container._y}`);
});
