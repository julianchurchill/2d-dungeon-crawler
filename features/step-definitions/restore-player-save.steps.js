/**
 * Step definitions for the "restore player inventory and equipment from save" feature.
 *
 * Tests restoreInventoryAndEquipment() in isolation, verifying that equipped
 * slots reference the same Item instances as the inventory after loading.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Player } from '../../src/entities/Player.js';
import { SkillSystem } from '../../src/systems/SkillSystem.js';
import { restoreInventoryAndEquipment } from '../../src/save/restorePlayer.js';

// ── Shared state ─────────────────────────────────────────────────────────────

/** @type {object} */
let savedPlayer;
/** @type {Player} */
let player;

// ── Given ─────────────────────────────────────────────────────────────────────

Given('a saved player with a Short Sword in inventory equipped as weapon', function () {
  savedPlayer = {
    inventory: [{ id: 'sword', count: 1 }],
    equipped: {
      weapon: 'sword', rangedWeapon: null, armor: null, helmet: null,
      chest: null, legs: null, arms: null, boots: null,
      ring1: null, ring2: null, amulet: null,
    },
  };
});

Given('a saved player with Leather Armor in inventory equipped as armor', function () {
  savedPlayer = {
    inventory: [{ id: 'leather_armor', count: 1 }],
    equipped: {
      weapon: null, rangedWeapon: null, armor: 'leather_armor', helmet: null,
      chest: null, legs: null, arms: null, boots: null,
      ring1: null, ring2: null, amulet: null,
    },
  };
});

Given('a saved player with two Iron Rings in inventory both equipped', function () {
  savedPlayer = {
    inventory: [
      { id: 'iron_ring', count: 1 },
      { id: 'iron_ring', count: 1 },
    ],
    equipped: {
      weapon: null, rangedWeapon: null, armor: null, helmet: null,
      chest: null, legs: null, arms: null, boots: null,
      ring1: 'iron_ring', ring2: 'iron_ring', amulet: null,
    },
  };
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the save data is restored onto a fresh player', function () {
  player = new Player(0, 0, new SkillSystem(null, [], []));
  restoreInventoryAndEquipment(player, savedPlayer);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then("the player's equippedWeapon should be the same instance as the inventory item", function () {
  assert.ok(player.inventory.length > 0, 'Expected inventory to have at least one item');
  assert.strictEqual(
    player.equippedWeapon,
    player.inventory[0],
    'equippedWeapon should be the same object reference as inventory[0]',
  );
});

Then("the player's equippedArmor should be the same instance as the inventory item", function () {
  assert.ok(player.inventory.length > 0, 'Expected inventory to have at least one item');
  assert.strictEqual(
    player.equippedArmor,
    player.inventory[0],
    'equippedArmor should be the same object reference as inventory[0]',
  );
});

Then('ring1 and ring2 should each reference a different inventory item', function () {
  assert.equal(player.inventory.length, 2, 'Expected inventory to have two items');
  assert.ok(
    player.equippedRing1 === player.inventory[0] || player.equippedRing1 === player.inventory[1],
    'equippedRing1 should reference an inventory item',
  );
  assert.ok(
    player.equippedRing2 === player.inventory[0] || player.equippedRing2 === player.inventory[1],
    'equippedRing2 should reference an inventory item',
  );
  assert.notStrictEqual(
    player.equippedRing1,
    player.equippedRing2,
    'ring1 and ring2 should be different inventory item instances',
  );
});
