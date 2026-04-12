export const ENEMY_DEFS = {
  cockroach: {
    name: 'Cockroach',
    hp: 1,
    attack: 1,
    defense: 1,
    xp: 3,
    textureKey: 'entity_cockroach',
    aggroRange: 2,
    color: 0x664422,
    clusterMin: 2,
    clusterMax: 5,
  },
  sprite: {
    name: 'Sprite',
    hp: 3,
    attack: 2,
    defense: 1,
    xp: 7,
    textureKey: 'entity_sprite',
    aggroRange: 3,
    color: 0x88aadd,
    teleportChance: 0.25,
    teleportRange: 3,
  },
  goblin: {
    name: 'Goblin',
    hp: 8,
    attack: 3,
    defense: 1,
    xp: 10,
    textureKey: 'entity_goblin',
    aggroRange: 6,
    color: 0x44aa44,
  },
  orc: {
    name: 'Orc',
    hp: 15,
    attack: 5,
    defense: 2,
    xp: 25,
    textureKey: 'entity_orc',
    aggroRange: 7,
    color: 0xaa4444,
  },
  troll: {
    name: 'Troll',
    hp: 25,
    attack: 8,
    defense: 4,
    xp: 50,
    textureKey: 'entity_troll',
    aggroRange: 8,
    color: 0x443333,
  },
  /**
   * Skeleton — a frail but relentless undead warrior.
   * Spawned as a minion by the Old Bones boss; does not appear in the regular
   * spawn table.
   */
  skeleton: {
    name: 'Skeleton',
    hp: 12,
    attack: 4,
    defense: 2,
    xp: 15,
    textureKey: 'entity_skeleton',
    aggroRange: 7,
    color: 0xddddcc,
  },
  /**
   * Old Bones — unique boss; appears on floors 10–15 until defeated once.
   * Not in the regular spawn table; placed separately by boss-spawn logic.
   */
  old_bones: {
    name: 'Old Bones',
    hp: 40,
    attack: 10,
    defense: 3,
    xp: 100,
    textureKey: 'entity_old_bones',
    aggroRange: 10,
    color: 0xeeeecc,
    solitary: true,   // at most one per room (enforced by EnemySpawner)
    isBoss: true,     // excluded from spawn table; handled by boss-spawn logic
  },
  /**
   * Creeping Mass — multi-tile amorphous enemy.
   * Spawned via CreepingMass class, not directly via the Enemy constructor.
   * Fields here are used by the EnemySpawner (type lookup) and developer tools.
   */
  creeping_mass: {
    name: 'Creeping Mass',
    hp: 30,      // representative (actual HP = segmentCount * HP_PER_SEGMENT)
    attack: 6,
    defense: 1,
    xp: 60,
    textureKey: 'entity_creeping_mass',
    aggroRange: 5,
    color: 0x2a5a2a,
    solitary: true,
    segmentMin: 3,
    segmentMax: 5,
  },
};

/**
 * Returns the weighted enemy spawn table for a given floor.
 * When `spawnWeights` is provided (non-null), the floor-based defaults are
 * bypassed and the custom weights are used instead — allowing developer
 * options to override the composition without modifying this function.
 *
 * @param {number} floor - Current dungeon floor.
 * @param {Object.<string,number>|null} [spawnWeights=null] - Optional override map.
 * @returns {string[]} Weighted array of enemy type strings.
 */
export function getSpawnTable(floor, spawnWeights = null) {
  if (spawnWeights !== null) return buildSpawnTableFromWeights(spawnWeights);
  // Early floors: cockroaches and sprites dominate; orcs can appear rarely.
  if (floor <= 3) return [
    'cockroach', 'cockroach', 'cockroach', 'cockroach',
    'sprite', 'sprite', 'sprite',
    'goblin', 'orc',
  ];
  // Mid floors: cockroaches and sprites taper off; trolls begin to appear.
  if (floor <= 5) return ['cockroach', 'cockroach', 'sprite', 'sprite', 'goblin', 'goblin', 'orc', 'troll'];
  // High floors (6–9): cockroaches rare, sprites gone, heavier enemies dominate.
  if (floor <= 9) return ['cockroach', 'goblin', 'goblin', 'orc', 'orc', 'troll'];
  // Floor 10+: Creeping Mass joins the roster as a solitary threat.
  return ['goblin', 'orc', 'orc', 'troll', 'troll', 'creeping_mass'];
}

export function getEnemiesPerRoom(floor) {
  return Math.min(1 + Math.floor(floor / 2), 4);
}

/**
 * Builds a weighted spawn-table array from a weights map.
 * Each key in the map is an enemy type; its value is the number of slots
 * that type occupies in the table (i.e. its relative probability weight).
 * Types with a weight of 0 are excluded.
 *
 * @param {Object.<string, number>} weights - Map of enemy type → weight.
 * @returns {string[]} Weighted array of enemy type strings.
 */
export function buildSpawnTableFromWeights(weights) {
  const table = [];
  for (const [type, count] of Object.entries(weights)) {
    for (let i = 0; i < count; i++) {
      table.push(type);
    }
  }
  return table;
}
