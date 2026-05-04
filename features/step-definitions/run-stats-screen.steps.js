/**
 * Step definitions for the Run Stats Screen feature.
 * Tests the RunStatsFormatter pure function in isolation.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { formatRunStats } from '../../src/ui/RunStatsFormatter.js';

// ── Given ─────────────────────────────────────────────────────────────────────

Given(
  'run stats with deepest floor {int}, walls broken {int}, gold gained {int}, gold spent {int}',
  function (deepestFloor, wallsBroken, goldGained, goldSpent) {
    this.runStats = { deepestFloor, wallsBroken, goldGained, goldSpent, kills: {}, consumablesUsed: {} };
  },
);

Given('run stats with {int} goblin kills and {int} skeleton kills', function (goblins, skeletons) {
  this.runStats = {
    deepestFloor: 1, wallsBroken: 0, goldGained: 0, goldSpent: 0,
    kills: { goblin: goblins, skeleton: skeletons },
    consumablesUsed: {},
  };
});

Given('run stats with {int} goblin kills and {int} orc kills', function (goblins, orcs) {
  this.runStats = {
    deepestFloor: 1, wallsBroken: 0, goldGained: 0, goldSpent: 0,
    kills: { goblin: goblins, orc: orcs },
    consumablesUsed: {},
  };
});

Given('run stats with {int} kill of type {string}', function (count, type) {
  this.runStats = {
    deepestFloor: 1, wallsBroken: 0, goldGained: 0, goldSpent: 0,
    kills: { [type]: count },
    consumablesUsed: {},
  };
});

Given('run stats with no kills', function () {
  this.runStats = {
    deepestFloor: 1, wallsBroken: 0, goldGained: 0, goldSpent: 0,
    kills: {}, consumablesUsed: {},
  };
});

Given(
  'run stats with {int} uses of {string} and {int} uses of {string}',
  function (count1, id1, count2, id2) {
    this.runStats = {
      deepestFloor: 1, wallsBroken: 0, goldGained: 0, goldSpent: 0,
      kills: {},
      consumablesUsed: { [id1]: count1, [id2]: count2 },
    };
  },
);

Given('run stats with no consumables used', function () {
  this.runStats = {
    deepestFloor: 1, wallsBroken: 0, goldGained: 0, goldSpent: 0,
    kills: {}, consumablesUsed: {},
  };
});

// ── When ──────────────────────────────────────────────────────────────────────

When('the stats are formatted', function () {
  this.formatted = formatRunStats(this.runStats);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the summary contains a row with label {string} and value {string}', function (label, value) {
  const row = this.formatted.summary.find(r => r.label === label);
  assert.ok(row, `Expected a summary row with label "${label}"`);
  assert.equal(String(row.value), value);
});

Then('the kills section contains a row with label {string} and value {string}', function (label, value) {
  const row = this.formatted.kills.find(r => r.label === label);
  assert.ok(row, `Expected a kills row with label "${label}"; got: ${JSON.stringify(this.formatted.kills)}`);
  assert.equal(String(row.value), value);
});

Then('the kills section row {int} has label {string} and value {string}', function (index, label, value) {
  const row = this.formatted.kills[index];
  assert.ok(row, `Expected a kills row at index ${index}`);
  assert.equal(row.label, label);
  assert.equal(String(row.value), value);
});

Then('the consumables section contains a row with label {string} and value {string}', function (label, value) {
  const row = this.formatted.consumablesUsed.find(r => r.label === label);
  assert.ok(row, `Expected a consumablesUsed row with label "${label}"; got: ${JSON.stringify(this.formatted.consumablesUsed)}`);
  assert.equal(String(row.value), value);
});

Then('the consumables section row {int} has label {string} and value {string}', function (index, label, value) {
  const row = this.formatted.consumablesUsed[index];
  assert.ok(row, `Expected a consumablesUsed row at index ${index}`);
  assert.equal(row.label, label);
  assert.equal(String(row.value), value);
});
