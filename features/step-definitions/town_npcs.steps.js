/**
 * Step definitions for Town NPC feature.
 *
 * "the town is generated" Given is defined in town.steps.js and sets
 * this.townResult on the World object.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { TOWN_NPCS } from '../../src/entities/NpcDefinitions.js';
import { Npc } from '../../src/entities/Npc.js';
import { NpcRoamController } from '../../src/systems/NpcRoamController.js';
import { Player } from '../../src/entities/Player.js';
import { DungeonMap } from '../../src/dungeon/DungeonMap.js';
import { TILE } from '../../src/utils/TileTypes.js';

// ── Given ────────────────────────────────────────────────────────────────────

Given('the town NPCs are defined', function () {
  this.townNpcs = TOWN_NPCS;
});

Given('a player adjacent to an NPC', function () {
  // Minimal map: 3×3 all floor
  this.map = new DungeonMap(3, 3);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) this.map.setTile(x, y, TILE.FLOOR);
  this.npc = new Npc(1, 1, { name: 'Guard', lines: ['Hello.'] });
  this.player = new Player(0, 1);
});

Given('an NPC with two dialogue lines', function () {
  this.npc = new Npc(0, 0, { name: 'Elder', lines: ['First line.', 'Second line.'] });
});

// ── When ─────────────────────────────────────────────────────────────────────

When('the player moves into the NPC', function () {
  // getEntityAt returns the NPC when at (1,1)
  this.moveResult = this.player.move(1, 0, this.map, (x, y) => {
    if (x === this.npc.x && y === this.npc.y) return this.npc;
    return null;
  });
});

When('the NPC is talked to for the first time', function () {
  this.dialogue = this.npc.talk();
});

When('the NPC is talked to twice', function () {
  this.npc.talk();
  this.dialogue = this.npc.talk();
});

When('the NPC is talked to three times', function () {
  this.npc.talk();
  this.npc.talk();
  this.dialogue = this.npc.talk();
});

// ── Then ─────────────────────────────────────────────────────────────────────

Then('every NPC should have a non-empty name', function () {
  assert.ok(this.townNpcs.length > 0, 'Expected at least one NPC to be defined');
  for (const npc of this.townNpcs) {
    assert.ok(npc.name && npc.name.trim().length > 0, `NPC missing name: ${JSON.stringify(npc)}`);
  }
});

Then('every NPC should have at least one dialogue line', function () {
  for (const npc of this.townNpcs) {
    assert.ok(
      Array.isArray(npc.lines) && npc.lines.length > 0,
      `NPC "${npc.name}" has no dialogue lines`,
    );
  }
});

Then('no two NPCs should share the same position', function () {
  const positions = new Set();
  for (const npc of this.townNpcs) {
    const key = `${npc.x},${npc.y}`;
    assert.ok(!positions.has(key), `Duplicate NPC position: ${key}`);
    positions.add(key);
  }
});

Then('each NPC position should be on a walkable tile', function () {
  const { map, npcs } = this.townResult;
  assert.ok(npcs && npcs.length > 0, 'Expected npcs in town result');
  for (const npc of npcs) {
    assert.ok(
      map.isWalkable(npc.x, npc.y),
      `NPC "${npc.name}" at (${npc.x},${npc.y}) is not on a walkable tile`,
    );
  }
});

Then('the town result should include at least one NPC', function () {
  assert.ok(
    Array.isArray(this.townResult.npcs) && this.townResult.npcs.length > 0,
    'Expected town result to include at least one NPC',
  );
});

Then('each NPC in the result should have a name and an x\\/y position', function () {
  for (const npc of this.townResult.npcs) {
    assert.ok(npc.name && npc.name.trim().length > 0, `NPC missing name: ${JSON.stringify(npc)}`);
    assert.strictEqual(typeof npc.x, 'number', `NPC "${npc.name}" missing x`);
    assert.strictEqual(typeof npc.y, 'number', `NPC "${npc.name}" missing y`);
  }
});

Then('the move result action should be {string}', function (expected) {
  assert.strictEqual(this.moveResult.action, expected);
});

Then('the move result should reference the NPC', function () {
  assert.strictEqual(this.moveResult.npc, this.npc);
});

Then('the dialogue should show the first line', function () {
  assert.strictEqual(this.dialogue, 'First line.');
});

Then('the dialogue should show the second line', function () {
  assert.strictEqual(this.dialogue, 'Second line.');
});

Then('the dialogue should show the first line again', function () {
  assert.strictEqual(this.dialogue, 'First line.');
});

// ── Distinctive sprites ───────────────────────────────────────────────────────

Then('every NPC should have a unique sprite key', function () {
  const keys = new Set();
  for (const npc of this.townNpcs) {
    assert.ok(npc.spriteKey && npc.spriteKey.trim().length > 0, `NPC "${npc.name}" has no spriteKey`);
    assert.ok(!keys.has(npc.spriteKey), `Duplicate spriteKey "${npc.spriteKey}"`);
    keys.add(npc.spriteKey);
  }
});

// ── NPC roaming ───────────────────────────────────────────────────────────────

Given('an NPC roam controller with interval {int}', function (interval) {
  // 3×3 floor map; NPC at centre (1,1)
  this.roamMap = new DungeonMap(3, 3);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) this.roamMap.setTile(x, y, TILE.FLOOR);
  this.roamNpc = new Npc(1, 1, { name: 'Wanderer', lines: ['Hi.'] });
  // Deterministic rng always returns 0 (picks first shuffled candidate)
  this.roamController = new NpcRoamController(this.roamNpc, { interval, rng: () => 0 });
});

Given('an NPC roam controller with interval {int} surrounded by walls on three sides', function (interval) {
  // 3×3 map; only (1,0) is a floor tile — NPC at (1,1) which is also floor; rest walls
  this.roamMap = new DungeonMap(3, 3);
  // All wall by default; make (1,1) and (1,0) floor
  this.roamMap.setTile(1, 1, TILE.FLOOR);
  this.roamMap.setTile(1, 0, TILE.FLOOR);
  this.roamNpc = new Npc(1, 1, { name: 'Wanderer', lines: ['Hi.'] });
  this.roamController = new NpcRoamController(this.roamNpc, { interval, rng: () => 0 });
});

Given('an NPC roam controller with interval {int} and all neighbours occupied', function (interval) {
  // 3×3 floor map; NPC at centre; all cardinal neighbours occupied
  this.roamMap = new DungeonMap(3, 3);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) this.roamMap.setTile(x, y, TILE.FLOOR);
  this.roamNpc = new Npc(1, 1, { name: 'Wanderer', lines: ['Hi.'] });
  this.roamController = new NpcRoamController(this.roamNpc, { interval, rng: () => 0 });
  // Simulate all neighbours blocked by always returning an entity
  this.roamGetEntityAt = (x, y) => ({ x, y }); // always occupied
});

When('the roam controller is ticked once on a walkable floor', function () {
  this.roamResult = this.roamController.tick(this.roamMap, () => null);
});

When('the roam controller is ticked once', function () {
  const getEntity = this.roamGetEntityAt ?? (() => null);
  this.roamResult = this.roamController.tick(this.roamMap, getEntity);
});

Then('the roam result should be {string}', function (expected) {
  assert.strictEqual(this.roamResult.action, expected);
});

Then('the roam result action should be {string}', function (expected) {
  assert.strictEqual(this.roamResult.action, expected);
});

Then('the roam result should indicate movement to the open side or stay', function () {
  // With only (1,0) open, a move must go up (dy=-1) or stay
  const valid = this.roamResult.action === 'stay'
    || (this.roamResult.action === 'move' && this.roamResult.dy === -1 && this.roamResult.dx === 0);
  assert.ok(valid, `Unexpected roam result: ${JSON.stringify(this.roamResult)}`);
});

// ── Contextual dialogue ───────────────────────────────────────────────────────

Given('an NPC with a contextual line triggered when player has a weapon', function () {
  this.contextualLine = (p) => p.equippedWeapon
    ? `That's a fancy looking ${p.equippedWeapon.name} — do you know where I can get one?`
    : null;
  this.npc = new Npc(0, 0, {
    name: 'Guard',
    lines: ['Move along, citizen.'],
    contextualLines: [this.contextualLine],
  });
});

Given('a player carrying a weapon named {string}', function (weaponName) {
  this.talkPlayer = new Player(0, 0);
  this.talkPlayer.equippedWeapon = { name: weaponName, itemType: 'weapon' };
});

Given('a player with no items', function () {
  this.talkPlayer = new Player(0, 0);
});

When('the player talks to the NPC with an rng that always triggers contextual dialogue', function () {
  // rng() returning 0 is < any positive threshold, so contextual fires
  this.dialogue = this.npc.talk(this.talkPlayer, () => 0);
});

When('the player talks to the NPC with an rng that never triggers contextual dialogue', function () {
  // rng() returning 1 is >= threshold, so contextual never fires
  this.dialogue = this.npc.talk(this.talkPlayer, () => 1);
});

Then('the dialogue should be the contextual line referencing the weapon', function () {
  const expected = this.contextualLine(this.talkPlayer);
  assert.strictEqual(this.dialogue, expected);
});

Then("the dialogue should be the NPC's first fixed line", function () {
  assert.strictEqual(this.dialogue, this.npc._lines[0]);
});

// ── Town NPC definitions have contextual lines ────────────────────────────────

Then('every NPC should have at least one contextual line defined', function () {
  for (const npc of this.townNpcs) {
    assert.ok(
      Array.isArray(npc.contextualLines) && npc.contextualLines.length > 0,
      `NPC "${npc.name}" has no contextualLines`,
    );
    for (const fn of npc.contextualLines) {
      assert.strictEqual(typeof fn, 'function', `NPC "${npc.name}" has a non-function contextualLine`);
    }
  }
});
