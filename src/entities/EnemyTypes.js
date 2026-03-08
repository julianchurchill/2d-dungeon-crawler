export const ENEMY_DEFS = {
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
};

/**
 * Get the enemy spawn table for a given floor.
 * Returns an array of type strings (weighted).
 */
export function getSpawnTable(floor) {
  if (floor <= 1) return ['goblin', 'goblin', 'goblin'];
  if (floor <= 3) return ['goblin', 'goblin', 'orc'];
  return ['goblin', 'orc', 'orc', 'troll'];
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
