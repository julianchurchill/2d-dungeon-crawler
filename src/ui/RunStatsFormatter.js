/**
 * @module RunStatsFormatter
 * Converts raw stats objects into display-ready sections for the Stats screens.
 * Provides formatters for both per-run stats (Player.runStats) and global stats
 * (GlobalStatsStore).  Pure functions with no Phaser dependency.
 */

import { ENEMY_DEFS } from '../entities/EnemyTypes.js';
import { ITEM_TYPES } from '../items/ItemTypes.js';

/**
 * Converts a snake_case or underscore-separated key into Title Case.
 * e.g. "mystery_beast" → "Mystery Beast"
 *
 * @param {string} key
 * @returns {string}
 */
function toTitleCase(key) {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Looks up the display name for an enemy type key, falling back to title case. */
function enemyName(type) {
  return ENEMY_DEFS[type]?.name ?? toTitleCase(type);
}

/** @type {Object<string,string>} */
const _itemNameCache = {};

/** Looks up the display name for an item id, falling back to title case. */
function itemName(id) {
  if (!_itemNameCache[id]) {
    const def = Object.values(ITEM_TYPES).find(t => t?.id === id);
    _itemNameCache[id] = def?.name ?? toTitleCase(id);
  }
  return _itemNameCache[id];
}

/**
 * Formats a `runStats` object into display-ready sections.
 *
 * @param {{ deepestFloor:number, wallsBroken:number, goldGained:number, goldSpent:number, kills:Object<string,number>, consumablesUsed:Object<string,number> }} runStats
 * @returns {{ summary: Array<{label:string,value:string|number}>, kills: Array<{label:string,value:string|number}>, consumablesUsed: Array<{label:string,value:string|number}> }}
 */
export function formatRunStats(runStats) {
  const summary = [
    { label: 'Deepest Floor', value: runStats.deepestFloor },
    { label: 'Walls Broken',  value: runStats.wallsBroken  },
    { label: 'Gold Gained',   value: runStats.goldGained   },
    { label: 'Gold Spent',    value: runStats.goldSpent    },
  ];

  const killEntries = Object.entries(runStats.kills ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ label: enemyName(type), value: count }));
  const kills = killEntries.length > 0 ? killEntries : [{ label: 'No kills yet', value: '' }];

  const consumableEntries = Object.entries(runStats.consumablesUsed ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({ label: itemName(id), value: count }));
  const consumablesUsed = consumableEntries.length > 0
    ? consumableEntries
    : [{ label: 'No consumables used', value: '' }];

  return { summary, kills, consumablesUsed };
}

/**
 * Formats a global stats object (from GlobalStatsStore) into display-ready
 * sections.  Identical to `formatRunStats` but adds a `uniqueBossesKilled`
 * section listing each boss type with the number of times it was killed.
 *
 * @param {{ deepestFloor:number, wallsBroken:number, goldGained:number, goldSpent:number, kills:Object<string,number>, consumablesUsed:Object<string,number>, bossKillCounts:Object<string,number> }} globalStats
 * @returns {{ summary: Array<{label:string,value:string|number}>, kills: Array<{label:string,value:string|number}>, consumablesUsed: Array<{label:string,value:string|number}>, uniqueBossesKilled: Array<{label:string,value:number|string}> }}
 */
export function formatGlobalStats(globalStats) {
  const base = formatRunStats(globalStats);

  const counts = globalStats.bossKillCounts ?? {};
  const bossEntries = Object.entries(counts)
    .map(([type, count]) => ({ label: enemyName(type), value: count }));
  const uniqueBossesKilled = bossEntries.length > 0
    ? bossEntries
    : [{ label: 'No bosses killed yet', value: '' }];

  return { ...base, uniqueBossesKilled };
}
