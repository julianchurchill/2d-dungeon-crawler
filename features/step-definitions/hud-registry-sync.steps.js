import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { syncHudFromRegistry } from '../../src/ui/HudRegistrySync.js';

// ─── Mock helpers ─────────────────────────────────────────────────────────────

/**
 * Creates a minimal registry mock backed by a plain object.
 *
 * @param {object} data - Key/value pairs to pre-populate.
 * @returns {{ get: (key: string) => any }}
 */
function makeRegistry(data = {}) {
  return { get: (key) => data[key] };
}

/**
 * Creates a HUD mock that records the last arguments each update method was
 * called with, plus a call count per method.
 *
 * @returns {{ updateHP: Function, updateStats: Function, updateFloor: Function, calls: object }}
 */
function makeHud() {
  const calls = { updateHP: [], updateStats: [], updateFloor: [] };
  return {
    updateHP:    (hp, maxHp) => calls.updateHP.push({ hp, maxHp }),
    updateStats: (stats)     => calls.updateStats.push(stats),
    updateFloor: (floor)     => calls.updateFloor.push(floor),
    calls,
  };
}

// ─── Steps ────────────────────────────────────────────────────────────────────

Given('a registry with floor {int} already set', function (floor) {
  this.registry = makeRegistry({ floor });
  this.hud = makeHud();
});

Given('a registry with HP {int} out of {int} already set', function (hp, maxHp) {
  this.registry = makeRegistry({ playerHP: hp, playerMaxHp: maxHp });
  this.hud = makeHud();
});

Given('a registry with player stats level {int} attack {int} defense {int} already set',
  function (level, attack, defense) {
    this.registry = makeRegistry({ playerStats: { level, attack, defense, xp: 0, xpToNext: 100 } });
    this.hud = makeHud();
  });

Given('an empty registry', function () {
  this.registry = makeRegistry({});
  this.hud = makeHud();
});

When('syncHudFromRegistry is called', function () {
  syncHudFromRegistry(this.registry, this.hud);
});

Then('the HUD floor should display floor {int}', function (expectedFloor) {
  assert.ok(
    this.hud.calls.updateFloor.includes(expectedFloor),
    `Expected updateFloor to be called with ${expectedFloor}, got: ${JSON.stringify(this.hud.calls.updateFloor)}`,
  );
});

Then('the HUD HP should display {int} out of {int}', function (hp, maxHp) {
  const call = this.hud.calls.updateHP[0];
  assert.ok(call, 'Expected updateHP to be called but it was not');
  assert.equal(call.hp, hp);
  assert.equal(call.maxHp, maxHp);
});

Then('the HUD stats should show level {int}', function (level) {
  const call = this.hud.calls.updateStats[0];
  assert.ok(call, 'Expected updateStats to be called but it was not');
  assert.equal(call.level, level);
});

Then('the HUD floor update should not have been called', function () {
  assert.equal(
    this.hud.calls.updateFloor.length,
    0,
    `Expected updateFloor NOT to be called, but it was called with: ${JSON.stringify(this.hud.calls.updateFloor)}`,
  );
});
