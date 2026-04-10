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
