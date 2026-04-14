import { Given, When, Then, After } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { Player } from '../../src/entities/Player.js';
import { DisplayCase } from '../../src/systems/DisplayCase.js';
import { DisplayCasePanel } from '../../src/ui/DisplayCasePanel.js';
import { EventBus } from '../../src/utils/EventBus.js';
import { GameEvents } from '../../src/events/GameEvents.js';

// ── Minimal Phaser scene mock for panel position tests ──────────────────────

/**
 * Creates a fluent stub where all methods return itself.
 * setSize records width/height so the panel height can be read back.
 *
 * @param {function} [onSetPosition] - Called with (x, y) whenever setPosition fires.
 * @returns {object}
 */
function makeFluent(onSetPosition) {
  const obj = { _text: '', _visible: true, width: 0, height: 0 };
  const chain = () => obj;
  obj.setDepth    = chain;
  obj.setVisible  = (v) => { obj._visible = v; return obj; };
  obj.setStrokeStyle = chain;
  obj.setInteractive = chain;
  obj.setFillStyle = chain;
  obj.setOrigin   = chain;
  obj.setPosition = onSetPosition
    ? (x, y) => { onSetPosition(x, y); return obj; }
    : chain;
  obj.setSize     = (w, h) => { obj.width = w; obj.height = h; return obj; };
  obj.add         = chain;
  obj.remove      = chain;
  obj.destroy     = () => {};
  obj._handlers   = {};
  obj.on          = (ev, fn) => { obj._handlers[ev] = fn; return obj; };
  obj.setText     = (t) => { obj._text = t; return obj; };
  obj.setColor    = chain;
  obj.setY        = chain;
  return obj;
}

/**
 * Creates a minimal Phaser.Scene mock for DisplayCasePanel construction,
 * capturing the container's setPosition calls via the provided callback.
 *
 * @param {number} width
 * @param {number} height
 * @param {function} onSetPosition - Called with (x, y) on each setPosition.
 * @returns {object}
 */
function createMockScene(width, height, onSetPosition) {
  return {
    scale: { width, height },
    add: {
      container: () => makeFluent(onSetPosition),
      rectangle: () => makeFluent(),
      text: (_x, _y, t) => makeFluent(),
      image: (_x, _y, key) => {
        const img = makeFluent();
        img.setDisplaySize = () => img;
        return img;
      },
    },
  };
}

// ── Hooks ────────────────────────────────────────────────────────────────────

After(function () {
  EventBus.removeAllListeners(GameEvents.DISPLAY_CASE_TOGGLED);
});

/**
 * Simulates what GameScene._handleStoreItem does: move item from player
 * inventory into display case and emit DISPLAY_CASE_CHANGED.
 */
function storeItem(player, displayCase, index) {
  const item = player.inventory[index];
  if (!item) return 'Nothing there.';
  const stored = displayCase.store(item);
  if (!stored) return 'That item cannot be stored in the display case.';
  player.removeItem(index);
  EventBus.emit(GameEvents.DISPLAY_CASE_CHANGED, { displayCase, inventory: player.inventory });
  return `You place the ${item.name} in the display case.`;
}

/**
 * Simulates what GameScene._handleRetrieveItem does: move item from display
 * case into player inventory and emit DISPLAY_CASE_CHANGED.
 */
function retrieveItem(player, displayCase, index) {
  if (!player.canPickUp()) {
    return 'Your pack is full!';
  }
  const item = displayCase.retrieve(index);
  if (!item) return 'Nothing there.';
  player.addItem(item);
  EventBus.emit(GameEvents.DISPLAY_CASE_CHANGED, { displayCase, inventory: player.inventory });
  return `You take the ${item.name} from the display case.`;
}

// --- Given ---
// Note: steps shared with other step definition files are intentionally absent here
// to avoid ambiguity. They are defined in:
//   - display-case.steps.js: a new display case, a display case containing a Bone Blade,
//                            display case should be empty, display case should contain {int} item
//   - inventory.steps.js:    a player with an empty inventory, a player with a full inventory
//   - unique-items.steps.js: a player with a Bone Blade in their inventory

// --- When ---

When('the player stores inventory item at index {int} in the display case', function (index) {
  this.emittedChanges = null;
  EventBus.once(GameEvents.DISPLAY_CASE_CHANGED, (data) => { this.emittedChanges = data; });
  this.actionMessage = storeItem(this.player, this.displayCase, index);
});

When('the player retrieves display case item at index {int}', function (index) {
  this.actionMessage = retrieveItem(this.player, this.displayCase, index);
});

// --- Then ---

Then('the player inventory should not contain the Bone Blade', function () {
  const hasBlade = this.player.inventory.some(i => i.id === ITEM_TYPES.BONE_BLADE.id);
  assert.ok(!hasBlade, 'Expected Bone Blade to be removed from inventory');
});

Then('the player inventory should contain the Bone Blade', function () {
  const hasBlade = this.player.inventory.some(i => i.id === ITEM_TYPES.BONE_BLADE.id);
  assert.ok(hasBlade, 'Expected Bone Blade to be in inventory');
});

Then('the display case should still contain {int} item', function (count) {
  assert.equal(this.displayCase.items.length, count,
    `Expected display case to still contain ${count} item(s) but got ${this.displayCase.items.length}`);
});

Then('the player inventory should still have {int} items', function (count) {
  assert.equal(this.player.inventory.length, count,
    `Expected inventory to still have ${count} items but got ${this.player.inventory.length}`);
});

Then('a message should say the inventory is full', function () {
  assert.ok(
    this.actionMessage && this.actionMessage.includes('full'),
    `Expected message to mention 'full', got: "${this.actionMessage}"`,
  );
});

Then('the DISPLAY_CASE_CHANGED event should have been emitted', function () {
  assert.ok(this.emittedChanges !== null,
    'Expected DISPLAY_CASE_CHANGED to have been emitted');
});

When('the display case panel is shown on an 800x600 screen', function () {
  this._panelPositions = [];
  const scene = createMockScene(800, 600, (x, y) => {
    this._panelPositions.push({ x, y });
  });
  // Inject a stub tileset manager so the panel doesn't touch localStorage
  const stubTilesetManager = { getTileKey: (k) => `classic_${k}` };
  this._displayCasePanel = new DisplayCasePanel(scene, stubTilesetManager);
  this._displayCasePanel.show(this.displayCase, this.player.inventory, this.player);
});

Then('the display case panel should be vertically centred on that screen', function () {
  const positions = this._panelPositions;
  assert.ok(positions.length > 0, 'Expected setPosition to have been called on the container');
  // The last setPosition call (from _refresh) should centre the panel vertically.
  // y=40 was the old top-pinned value; any centred value will be greater than that.
  const { y } = positions[positions.length - 1];
  assert.ok(
    y > 40,
    `Expected panel to be vertically centred (y > 40) but got y=${y}`,
  );
});
