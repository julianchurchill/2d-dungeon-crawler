/**
 * Step definitions for ranged weapon item types, player slot, and floor loot.
 *
 * Reuses the shared player/inventory Given steps from inventory.steps.js.
 * The 'When getFloorLoot is called for floor {int}' step (which populates
 * this.lootSamples) is defined in minor-teleportation.steps.js — Cucumber
 * merges all step definitions at runtime, so both files must remain in sync.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';
import { Item } from '../../src/items/Item.js';
import { ITEM_TYPES, getFloorLoot } from '../../src/items/ItemTypes.js';
import { InventorySystem } from '../../src/systems/InventorySystem.js';
import { EventBus } from '../../src/utils/EventBus.js';
import { GameEvents } from '../../src/events/GameEvents.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('no unlocked items', function () {
  this.unlockedItems = new Set();
});

Given('a short bow in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.SHORT_BOW));
});

Given('a hand crossbow in the player inventory', function () {
  this.player.addItem(new Item(0, 0, ITEM_TYPES.HAND_CROSSBOW));
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the player equips the short bow', function () {
  this.emittedStats = null;
  EventBus.once(GameEvents.PLAYER_STATS_CHANGED, (stats) => { this.emittedStats = stats; });
  const idx = this.player.inventory.findIndex(i => i.id === ITEM_TYPES.SHORT_BOW.id);
  this.useMessage = InventorySystem.useItem(this.player, idx);
});

When('the player equips the hand crossbow', function () {
  this.emittedStats = null;
  EventBus.once(GameEvents.PLAYER_STATS_CHANGED, (stats) => { this.emittedStats = stats; });
  const idx = this.player.inventory.findIndex(i => i.id === ITEM_TYPES.HAND_CROSSBOW.id);
  this.useMessage = InventorySystem.useItem(this.player, idx);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the player has no ranged weapon equipped', function () {
  assert.equal(
    this.player.equippedRangedWeapon, null,
    'Expected no ranged weapon to be equipped',
  );
});

Then('the short bow should be the equipped ranged weapon', function () {
  assert.ok(
    this.player.equippedRangedWeapon !== null,
    'Expected a ranged weapon to be equipped',
  );
  assert.equal(
    this.player.equippedRangedWeapon.id, ITEM_TYPES.SHORT_BOW.id,
    'Expected the equipped ranged weapon to be a short bow',
  );
});

Then('the short bow is in the loot pool', function () {
  const found = this.lootSamples.some(item => item.id === ITEM_TYPES.SHORT_BOW.id);
  assert.ok(found, 'Expected short bow to appear in floor loot pool');
});

Then('the hand crossbow is in the loot pool', function () {
  const found = this.lootSamples.some(item => item.id === ITEM_TYPES.HAND_CROSSBOW.id);
  assert.ok(found, 'Expected hand crossbow to appear in floor loot pool');
});

Then('the hand crossbow is not in the loot pool', function () {
  const found = this.lootSamples.some(item => item.id === ITEM_TYPES.HAND_CROSSBOW.id);
  assert.ok(!found, 'Expected hand crossbow to NOT appear in floor loot pool before floor 4');
});
