import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { Champion } from '../../src/entities/Champion.js';
import { ENEMY_DEFS } from '../../src/entities/EnemyTypes.js';
import { getFloorLootPool } from '../../src/items/LootTables.js';
import { EnemySpawner } from '../../src/systems/EnemySpawner.js';

// ─── Shared helpers ────────────────────────────────────────────────────────

const neutralDiffMgr = { getConfig: () => ({ enemyCount: 1, enemyHp: 1, enemyAtk: 1 }) };

function makeRooms(count) {
  return Array.from({ length: count }, (_, i) => ({ x: i * 20, y: 0, w: 7, h: 7 }));
}

/** Deterministic RNG that always returns middle values and picks first element. */
const fixedRNG = {
  next: () => 0.5,
  nextInt: (min, max) => Math.floor((min + max) / 2),
  nextBool: () => false,
  pick: (arr) => arr[0],
};

// ─── Given ────────────────────────────────────────────────────────────────

Given('a goblin champion created on floor {int}', function (floor) {
  this.floor = floor;
  this.baseDef = ENEMY_DEFS.goblin;
  this.champion = new Champion(5, 5, 'goblin', floor, fixedRNG);
});

Given('an EnemySpawner with a guaranteed champion chance and goblin-only weights',
  function () {
    this.spawnedWithOptions = [];
    this.spawner = new EnemySpawner(fixedRNG, {
      spawnWeights: { goblin: 1 },
      minEnemiesPerRoom: 1,
      maxEnemiesPerRoom: 1,
      championChance: 1.0,
    }, neutralDiffMgr);
  },
);

Given('an EnemySpawner with a guaranteed champion chance and creeping_mass-only weights',
  function () {
    this.spawnedWithOptions = [];
    this.spawner = new EnemySpawner(fixedRNG, {
      spawnWeights: { creeping_mass: 1 },
      minEnemiesPerRoom: 1,
      maxEnemiesPerRoom: 1,
      championChance: 1.0,
    }, neutralDiffMgr);
  },
);

// ─── When ─────────────────────────────────────────────────────────────────

When('spawning enemies for {int} rooms on floor {int} with champion tracking',
  function (roomCount, floor) {
    this.spawnedWithOptions = [];
    const rooms = makeRooms(roomCount);
    this.spawner.spawnForRooms(
      rooms,
      floor,
      () => null,
      (x, y, type, options) => {
        this.spawnedWithOptions.push({ x, y, type, isChampion: options?.isChampion ?? false });
      },
    );
  },
);

// ─── Then ─────────────────────────────────────────────────────────────────

Then('the champion HP should be greater than the base goblin HP', function () {
  assert.ok(
    this.champion.stats.hp > this.baseDef.hp,
    `Expected champion HP ${this.champion.stats.hp} > base HP ${this.baseDef.hp}`,
  );
});

Then('the champion attack should be greater than the base goblin attack', function () {
  assert.ok(
    this.champion.stats.attack > this.baseDef.attack,
    `Expected champion ATK ${this.champion.stats.attack} > base ATK ${this.baseDef.attack}`,
  );
});

Then('the champion defense should be greater than the base goblin defense', function () {
  assert.ok(
    this.champion.stats.defense > this.baseDef.defense,
    `Expected champion DEF ${this.champion.stats.defense} > base DEF ${this.baseDef.defense}`,
  );
});

Then('the champion XP should be greater than the base goblin XP', function () {
  assert.ok(
    this.champion.xp > this.baseDef.xp,
    `Expected champion XP ${this.champion.xp} > base XP ${this.baseDef.xp}`,
  );
});

Then("the champion name should contain 'Champion'", function () {
  assert.ok(
    this.champion.name.includes('Champion'),
    `Expected name to contain 'Champion' but got '${this.champion.name}'`,
  );
});

Then('the enemy should have isChampion set to true', function () {
  assert.strictEqual(this.champion.isChampion, true,
    `Expected isChampion to be true but got ${this.champion.isChampion}`);
});

Then('the champion should have a drop item', function () {
  assert.ok(
    this.champion.dropItem !== null && this.champion.dropItem !== undefined,
    'Expected champion to have a drop item but dropItem is null/undefined',
  );
});

Then('the champion drop item should belong to the loot pool for floors {int} to {int}',
  function (minFloor, maxFloor) {
    // Build the union of all loot pools from minFloor to maxFloor.
    const poolIds = new Set();
    for (let f = minFloor; f <= maxFloor; f++) {
      for (const entry of getFloorLootPool(f)) {
        poolIds.add(entry.id);
      }
    }
    assert.ok(
      poolIds.has(this.champion.dropItem.id),
      `Expected drop item '${this.champion.dropItem.id}' to be in the loot pool for floors ${minFloor}–${maxFloor}`,
    );
  },
);

Then('a champion should have been spawned', function () {
  const champion = this.spawnedWithOptions.find(e => e.isChampion);
  assert.ok(champion, 'Expected at least one champion to have been spawned but none were');
});

Then('no champion should have been spawned', function () {
  const champion = this.spawnedWithOptions.find(e => e.isChampion);
  assert.ok(!champion, 'Expected no champions but at least one was spawned');
});
