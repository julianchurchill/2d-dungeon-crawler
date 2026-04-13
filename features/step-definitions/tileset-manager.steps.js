import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { TilesetManager } from '../../src/systems/TilesetManager.js';

/** Creates an in-memory storage stub that mimics the localStorage API. */
function makeStorage() {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    _data: data,
  };
}

Given('a fresh tileset manager', function () {
  this.storage = makeStorage();
  this.tilesetManager = new TilesetManager(this.storage);
});

When('the tileset is changed to {string}', function (name) {
  this.tilesetManager.setTileset(name);
});

When('a new tileset manager is created from the same storage', function () {
  this.tilesetManager = new TilesetManager(this.storage);
});

Then('the active tileset should be {string}', function (expected) {
  assert.strictEqual(this.tilesetManager.getTileset(), expected);
});

Then('the tile key for {string} should be {string}', function (base, expected) {
  assert.strictEqual(this.tilesetManager.getTileKey(base), expected);
});
