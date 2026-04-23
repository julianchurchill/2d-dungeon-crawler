import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { UniqueRoomRegistry } from '../../src/dungeon/UniqueRoomRegistry.js';
import { UNIQUE_ROOM_DEFS } from '../../src/dungeon/UniqueRoomDefinitions.js';

// ─── Given ────────────────────────────────────────────────────────────────

Given('a fresh unique room registry', function () {
  this.registry = new UniqueRoomRegistry();
});

Given('a fresh unique room registry with {string} marked as seen', function (id) {
  this.registry = new UniqueRoomRegistry();
  this.registry.markSeen(id);
});

// ─── When ─────────────────────────────────────────────────────────────────

When('{string} is marked as seen in the registry', function (id) {
  this.registry.markSeen(id);
});

When('the registry is reset', function () {
  this.registry.reset();
});

When('eligible unique rooms are fetched for floor {int}', function (floor) {
  this.eligible = this.registry.getEligible(floor, UNIQUE_ROOM_DEFS);
});

When('eligible unique rooms are fetched for floor {int} with force {string}',
  function (floor, forceId) {
    this.eligible = this.registry.getEligible(floor, UNIQUE_ROOM_DEFS, forceId);
  });

// ─── Then ─────────────────────────────────────────────────────────────────

Then('the registry should record {string} as seen', function (id) {
  assert.ok(this.registry.hasBeenSeen(id),
    `Expected registry to have "${id}" marked as seen`);
});

Then('the registry should not record {string} as seen', function (id) {
  assert.ok(!this.registry.hasBeenSeen(id),
    `Expected registry NOT to have "${id}" marked as seen`);
});

Then('the room {string} should be eligible', function (id) {
  const found = this.eligible.some(d => d.id === id);
  assert.ok(found, `Expected room "${id}" to be in the eligible list`);
});

Then('the room {string} should not be eligible', function (id) {
  const found = this.eligible.some(d => d.id === id);
  assert.ok(!found, `Expected room "${id}" NOT to be in the eligible list`);
});

Then('the {string} definition should have at least 1 item', function (id) {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
  assert.ok(def, `No definition found for id "${id}"`);
  assert.ok(def.items && def.items.length >= 1,
    `Expected "${id}" to have at least 1 item but got ${def.items?.length ?? 0}`);
});

Then('the {string} definition should have a minimum floor above 0', function (id) {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
  assert.ok(def, `No definition found for id "${id}"`);
  assert.ok(def.minFloor > 0,
    `Expected "${id}" minFloor > 0 but got ${def.minFloor}`);
});

Then('the {string} definition should have a non-empty entry message', function (id) {
  const def = UNIQUE_ROOM_DEFS.find(d => d.id === id);
  assert.ok(def, `No definition found for id "${id}"`);
  assert.ok(typeof def.entryMessage === 'string' && def.entryMessage.length > 0,
    `Expected "${id}" to have a non-empty entryMessage`);
});
