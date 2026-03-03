/**
 * Step definitions for InventoryCursor navigation behaviour.
 *
 * InventoryCursor is pure logic with no Phaser dependency, so no mocking is
 * required — the real class is used directly.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { InventoryCursor } from '../../src/systems/InventoryCursor.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('an inventory cursor for a {int} column {int} row grid', function (cols, rows) {
  this.cursor = new InventoryCursor(cols, rows);
});

Given('the cursor has been placed at slot {int}', function (index) {
  this.cursor.setIndex(index);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the cursor moves right', function () {
  this.cursor.moveRight();
});

When('the cursor moves left', function () {
  this.cursor.moveLeft();
});

When('the cursor moves down', function () {
  this.cursor.moveDown();
});

When('the cursor moves up', function () {
  this.cursor.moveUp();
});

When('the cursor is reset', function () {
  this.cursor.reset();
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the cursor is at slot {int}', function (expected) {
  assert.equal(this.cursor.index, expected);
});
