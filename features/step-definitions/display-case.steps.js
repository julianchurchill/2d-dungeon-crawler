import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES } from '../../src/items/ItemTypes.js';
import { DisplayCase } from '../../src/systems/DisplayCase.js';
import { TownGenerator } from '../../src/dungeon/TownGenerator.js';
import { TILE } from '../../src/utils/TileTypes.js';

Given('a new display case', function () {
  this.displayCase = new DisplayCase();
});

Given('a Bone Blade item', function () {
  this.item = new Item(0, 0, ITEM_TYPES.BONE_BLADE);
});

Given('a health potion item', function () {
  this.item = new Item(0, 0, ITEM_TYPES.HEALTH_POTION);
});

Given('a display case containing a Bone Blade', function () {
  this.displayCase = new DisplayCase();
  this.boneBlade = new Item(0, 0, ITEM_TYPES.BONE_BLADE);
  this.displayCase.store(this.boneBlade);
});

When('the item is stored in the display case', function () {
  this.storeResult = this.displayCase.store(this.item);
});

When('the non-unique item is stored in the display case', function () {
  this.storeResult = this.displayCase.store(this.item);
});

When('the Bone Blade is retrieved from the display case at index {int}', function (index) {
  this.retrievedItem = this.displayCase.retrieve(index);
});

Then('the display case should be empty', function () {
  assert.equal(this.displayCase.items.length, 0,
    `Expected display case to be empty but it has ${this.displayCase.items.length} item(s)`);
});

Then('the display case should contain {int} item', function (count) {
  assert.equal(this.displayCase.items.length, count,
    `Expected display case to contain ${count} item(s) but got ${this.displayCase.items.length}`);
});

Then('the storage should fail', function () {
  assert.ok(this.storeResult === false,
    `Expected store() to return false, got ${this.storeResult}`);
});

Then('the retrieved item should be the Bone Blade', function () {
  assert.ok(this.retrievedItem, 'Expected a retrieved item but got null');
  assert.equal(this.retrievedItem.id, ITEM_TYPES.BONE_BLADE.id);
});

Then('the retrieved item should be null', function () {
  assert.equal(this.retrievedItem, null);
});

// Note: 'Given the town is generated' is defined in town.steps.js

Then('the town map should contain a home door tile', function () {
  const map = this.townResult.map;
  let found = false;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.getTile(x, y) === TILE.HOME_DOOR) { found = true; break; }
    }
    if (found) break;
  }
  assert.ok(found, 'Expected the town map to contain a HOME_DOOR tile');
});

Then('the town result should include a home door position', function () {
  assert.ok(
    this.townResult.homeDoorPos &&
    typeof this.townResult.homeDoorPos.x === 'number' &&
    typeof this.townResult.homeDoorPos.y === 'number',
    `Expected townResult.homeDoorPos to be {x, y}, got ${JSON.stringify(this.townResult.homeDoorPos)}`,
  );
});
