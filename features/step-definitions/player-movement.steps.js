import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';
import { Enemy } from '../../src/entities/Enemy.js';
import { DungeonMap } from '../../src/dungeon/DungeonMap.js';
import { TILE } from '../../src/utils/TileTypes.js';

// --- Given ---

Given('a player at position {int}, {int}', function (x, y) {
  this.player = new Player(x, y);
  this.map = new DungeonMap(20, 20);
  this.enemy = null;
});

Given('a floor tile at position {int}, {int}', function (x, y) {
  this.map.setTile(x, y, TILE.FLOOR);
});

Given('a wall at position {int}, {int}', function (x, y) {
  this.map.setTile(x, y, TILE.WALL);
});

Given('an enemy at position {int}, {int}', function (x, y) {
  this.enemy = new Enemy(x, y, 'goblin');
  this.map.setTile(x, y, TILE.FLOOR);
  this.map.setEntity(x, y, this.enemy);
});

Given('stairs at position {int}, {int}', function (x, y) {
  this.map.setTile(x, y, TILE.STAIRS_DOWN);
});

// --- When ---

When('the player moves right', function () {
  const getEntityAt = (x, y) => this.map.getEntity(x, y);
  this.result = this.player.move(1, 0, this.map, getEntityAt);
});

// --- Then ---

Then('the player position should be {int}, {int}', function (x, y) {
  assert.equal(this.player.x, x, `Expected player x to be ${x}, got ${this.player.x}`);
  assert.equal(this.player.y, y, `Expected player y to be ${y}, got ${this.player.y}`);
});

Then('the player position should remain {int}, {int}', function (x, y) {
  assert.equal(this.player.x, x);
  assert.equal(this.player.y, y);
});

Then('the move result should be {string}', function (action) {
  assert.equal(this.result.action, action);
});

Then('the attack target should be the enemy', function () {
  assert.ok(this.result.target, 'Expected result.target to be set');
  assert.equal(this.result.target, this.enemy, 'Expected target to be the enemy');
});
