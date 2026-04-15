/**
 * Step definitions for the LookCursor feature.
 *
 * LookCursor is tested in isolation with a minimal dungeon map stub and a
 * Phaser scene mock so no renderer is needed.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { LookCursor } from '../../src/ui/LookCursor.js';
import { FOV_STATE } from '../../src/utils/TileTypes.js';

// ── Map stub ──────────────────────────────────────────────────────────────────

/**
 * Builds a minimal dungeon map stub.
 *
 * @param {number} w
 * @param {number} h
 * @param {Set<string>|null} visibleSet - Tile keys ("x,y") that are VISIBLE.
 *   Pass null to make every in-bounds tile visible.
 * @returns {object}
 */
function makeMapStub(w, h, visibleSet = null) {
  return {
    width:  w,
    height: h,
    inBounds: (x, y) => x >= 0 && y >= 0 && x < w && y < h,
    getFovState: (x, y) => {
      if (visibleSet === null) return FOV_STATE.VISIBLE;
      return visibleSet.has(`${x},${y}`) ? FOV_STATE.VISIBLE : FOV_STATE.EXPLORED;
    },
  };
}

// ── Phaser scene mock ─────────────────────────────────────────────────────────

/** Fluent stub — all methods return itself. */
function makeFluent() {
  const obj = { _visible: false };
  const chain = () => obj;
  obj.setDepth    = chain;
  obj.setVisible  = (v) => { obj._visible = v; return obj; };
  obj.setPosition = chain;
  obj.setAlpha    = chain;
  obj.clear       = chain;
  obj.lineStyle   = chain;
  obj.strokeRect  = chain;
  obj.fillStyle   = chain;
  obj.fillRect    = chain;
  return obj;
}

function createMockScene() {
  return {
    add: {
      graphics: () => makeFluent(),
    },
  };
}

// ── Steps ─────────────────────────────────────────────────────────────────────

Given('a LookCursor', function () {
  this.map = makeMapStub(20, 20);
  this.lookCursor = new LookCursor(createMockScene(), this.map, 16);
});

Given('a LookCursor on a 20x20 map with all tiles visible', function () {
  this.map = makeMapStub(20, 20, null);
  this.lookCursor = new LookCursor(createMockScene(), this.map, 16);
});

Given('a LookCursor on a 20x20 map where only tile {int}, {int} is visible',
  function (tx, ty) {
    this.map = makeMapStub(20, 20, new Set([`${tx},${ty}`]));
    this.lookCursor = new LookCursor(createMockScene(), this.map, 16);
  });

When('the look cursor is activated at tile {int}, {int}', function (x, y) {
  this.lookCursor.activate(x, y);
});

When('the look cursor moves right',  function () { this.lookCursor.move(1,  0); });
When('the look cursor moves left',   function () { this.lookCursor.move(-1, 0); });
When('the look cursor moves up',     function () { this.lookCursor.move(0, -1); });
When('the look cursor moves down',   function () { this.lookCursor.move(0,  1); });

When('the look cursor is deactivated', function () {
  this.lookCursor.deactivate();
});

Then('the look cursor should be active', function () {
  assert.ok(this.lookCursor.active, 'Expected LookCursor to be active');
});

Then('the look cursor should not be active', function () {
  assert.ok(!this.lookCursor.active, 'Expected LookCursor to be inactive');
});

Then('the look cursor x should be {int}', function (expected) {
  assert.equal(this.lookCursor.x, expected,
    `Expected cursor x=${expected} but got ${this.lookCursor.x}`);
});

Then('the look cursor y should be {int}', function (expected) {
  assert.equal(this.lookCursor.y, expected,
    `Expected cursor y=${expected} but got ${this.lookCursor.y}`);
});
