import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { syncHudFromRegistry, attachHudRegistryListeners, detachHudRegistryListeners } from '../../src/ui/HudRegistrySync.js';

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
 * Creates a registry mock with a live EventEmitter for changedata-* events.
 *
 * @param {object} data - Key/value pairs to pre-populate.
 * @returns {{ get: Function, set: Function, events: EventEmitter }}
 */
function makeLiveRegistry(data = {}) {
  const store = { ...data };
  const events = new EventEmitter();
  return {
    get: (key) => store[key],
    set: (key, value) => {
      store[key] = value;
      events.emit(`changedata-${key}`, null, value);
    },
    events,
  };
}

/**
 * Creates a HUD mock that records the last arguments each update method was
 * called with, plus a call count per method.
 *
 * @returns {{ updateHP: Function, updateStats: Function, updateFloor: Function, calls: object }}
 */
function makeHud() {
  const calls = { updateHP: [], updateStats: [], updateFloor: [], updateGold: [] };
  return {
    updateHP:    (hp, maxHp) => calls.updateHP.push({ hp, maxHp }),
    updateStats: (stats)     => calls.updateStats.push(stats),
    updateFloor: (floor)     => calls.updateFloor.push(floor),
    updateGold:  (gold)      => calls.updateGold.push(gold),
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

Given('a registry with event emitter', function () {
  this.registry = makeLiveRegistry({ playerMaxHp: 30 });
  this.hud = makeHud();
});

Given('a mock HUD is attached to registry listeners', function () {
  this.hudListenerHandle = attachHudRegistryListeners(this.registry.events, this.registry, this.hud);
});

When('the registry listeners are detached', function () {
  detachHudRegistryListeners(this.hudListenerHandle);
});

When('playerHP changes in the registry to {int} out of {int}', function (hp, _maxHp) {
  this.registry.set('playerHP', hp);
});

Then('the HUD HP update should not have been called', function () {
  assert.equal(
    this.hud.calls.updateHP.length,
    0,
    `Expected updateHP NOT to be called after detach, but it was called ${this.hud.calls.updateHP.length} time(s)`,
  );
});
