/**
 * @module SaveGame
 * @description Serialises and restores full player and floor state to
 * localStorage (or an injected storage backend for tests).
 *
 * Save format (JSON):
 * {
 *   floor: number,
 *   player: {
 *     stats:          { hp, maxHp, attack, defense, level, xp, xpToNext, statPoints },
 *     gold:           number,
 *     inventory:      [{ id, count }],
 *     equipped:       { weapon, rangedWeapon, armor, helmet, chest, legs, arms, boots, ring1, ring2, amulet },
 *     activeSkills:   [{ id, ...upgradeState }],
 *     inactiveSkills: [{ id, ...upgradeState }],
 *   },
 *   floorState: {
 *     width, height, tiles: number[],
 *     enemies: [{ type, x, y, hp, maxHp, attack, defense, xp, isChampion, isBoss, dropItemId?, ... }],
 *     items:   [{ id, x, y, count }],
 *     playerX, playerY,
 *     uniqueRooms: { seen: string[], entered: string[] },
 *   } | null,
 * }
 *
 * Each slot uses the key `save_game_<slot>` (0-indexed).
 */

/** Total number of independent save slots. */
export const TOTAL_SLOTS = 5;

/** Returns the localStorage key for a given slot index. */
const SAVE_KEY = (slot) => `save_game_${slot}`;

/** Storage backend — defaults to localStorage when available. */
let _storage = typeof localStorage !== 'undefined' ? localStorage : null;

/**
 * Replaces the storage backend.  Inject a fake object in tests.
 * @param {{ getItem: Function, setItem: Function, removeItem: Function }|null} storage
 */
export function setStorage(storage) {
  _storage = storage;
}

/**
 * Extracts the save-relevant state from a skill object.
 * Each skill class stores its upgrade state in private fields — we read them
 * directly here rather than adding a new method to every skill class.
 *
 * @param {object} skill
 * @returns {object}
 */
function skillToSaveData(skill) {
  const data = { id: skill.id };
  if (skill._baseCritChance  !== undefined) data.critChance       = skill._baseCritChance;
  if (skill._damageMultiplier !== undefined) data.damageMultiplier = skill._damageMultiplier;
  if (skill._dodgeChance     !== undefined) data.dodgeChance      = skill._dodgeChance;
  if (skill._bonus           !== undefined) data.bonus            = skill._bonus;
  if (skill._level           !== undefined) data.level            = skill._level;
  return data;
}

/**
 * Serialises the id of an equipped item slot (or null).
 * @param {object|null} item
 * @returns {string|null}
 */
function equippedId(item) {
  return item ? item.id : null;
}

/**
 * Saves the current player and floor state to storage.
 *
 * @param {object} player       - Player instance (or duck-typed equivalent).
 * @param {object} floorManager - FloorManager instance.
 */
/**
 * Serialises a single enemy instance to a plain save object.
 * @param {object} enemy
 * @returns {object}
 */
function serializeEnemy(enemy) {
  if (enemy.segments) {
    return {
      type: 'creeping_mass',
      segments: enemy.segments.map(s => ({ x: s.x, y: s.y })),
      hp:    enemy.stats.hp,
      maxHp: enemy.stats.maxHp,
    };
  }
  const data = {
    type:       enemy.type,
    x:          enemy.x,
    y:          enemy.y,
    hp:         enemy.stats.hp,
    maxHp:      enemy.stats.maxHp,
    attack:     enemy.stats.attack,
    defense:    enemy.stats.defense,
    xp:         enemy.xp,
    isChampion: enemy.isChampion ?? false,
    isBoss:     enemy.isBoss    ?? false,
  };
  if (enemy.isChampion) data.dropItemId = enemy.dropItem?.id ?? null;
  if (enemy.isBoss) {
    data.dropItemId    = enemy.dropItem?.id ?? null;
    data.dropGold      = enemy.dropGold     ?? 0;
    data.minionsSpawned = enemy.minionsSpawned ?? false;
  }
  return data;
}

/**
 * Builds a serialisable snapshot of the current dungeon floor.
 *
 * @param {object}   dungeonMap        - DungeonMap instance (must have .tiles, .fovState, .width, .height).
 * @param {object[]} enemies           - Array of enemy instances on the floor.
 * @param {object[]} items             - Array of Item instances currently on the floor (not in inventory).
 * @param {object}   player            - Player instance (for position).
 * @param {object}   uniqueRoomRegistry - Registry instance with ._seen and ._entered Sets.
 * @returns {object} Plain object suitable for JSON serialisation.
 */
export function serializeFloor(dungeonMap, enemies, items, player, uniqueRoomRegistry, entryTracker = null, npcs = []) {
  const activeRoom = entryTracker?.getActiveRoom() ?? null;
  return {
    width:   dungeonMap.width,
    height:  dungeonMap.height,
    tiles:   Array.from(dungeonMap.tiles),
    fovState: Array.from(dungeonMap.fovState),
    enemies: enemies.map(serializeEnemy),
    items:   items.map(i => ({ id: i.id, x: i.x, y: i.y, count: i.count ?? 1 })),
    playerX: player.x,
    playerY: player.y,
    uniqueRooms: {
      seen:    Array.from(uniqueRoomRegistry._seen),
      entered: Array.from(uniqueRoomRegistry._entered),
    },
    activeUniqueRoom: activeRoom
      ? { defId: activeRoom.def.id, room: activeRoom.room }
      : null,
    npcs: npcs.map(n => ({
      x: n.x, y: n.y,
      name: n.name,
      spriteKey: n.spriteKey,
      lines: n._lines,
      lineIndex: n._lineIndex,
    })),
  };
}

/**
 * Applies saved player stats onto a target stats object, copying only
 * known stat keys to prevent prototype pollution from crafted save data.
 *
 * @param {object} target - The player's live stats object.
 * @param {object} source - The raw stats object from the save file.
 */
export function applyPlayerStats(target, source) {
  if (!source) return;
  const KNOWN_STATS = ['hp', 'maxHp', 'attack', 'defense', 'level', 'xp', 'xpToNext', 'statPoints'];
  for (const key of KNOWN_STATS) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
}

/**
 * @param {object} player
 * @param {object} floorManager
 * @param {object|null} [floorData]
 * @param {number} [slot] - Save slot index (0–4). Defaults to 0.
 */
export function saveGame(player, floorManager, floorData = null, slot = 0) {
  if (!_storage) return;

  const skillSystem = player.skillSystem;
  const activeSkills   = skillSystem ? skillSystem._activeSkills.map(skillToSaveData)   : [];
  const inactiveSkills = skillSystem ? skillSystem._inactiveSkills.map(skillToSaveData) : [];

  const data = {
    savedAt: new Date().toISOString(),
    floor: floorManager.currentFloor,
    player: {
      stats:    { ...player.stats },
      gold:     player.gold,
      inventory: player.inventory.map(i => ({ id: i.id, count: i.count })),
      equipped: {
        weapon:       equippedId(player.equippedWeapon),
        rangedWeapon: equippedId(player.equippedRangedWeapon),
        armor:        equippedId(player.equippedArmor),
        helmet:       equippedId(player.equippedHelmet),
        chest:        equippedId(player.equippedChest),
        legs:         equippedId(player.equippedLegs),
        arms:         equippedId(player.equippedArms),
        boots:        equippedId(player.equippedBoots),
        ring1:        equippedId(player.equippedRing1),
        ring2:        equippedId(player.equippedRing2),
        amulet:       equippedId(player.equippedAmulet),
      },
      activeSkills,
      inactiveSkills,
      runStats: player.runStats ? { ...player.runStats, kills: { ...player.runStats.kills }, consumablesUsed: { ...player.runStats.consumablesUsed } } : undefined,
    },
    floorState: floorData ?? null,
  };

  _storage.setItem(SAVE_KEY(slot), JSON.stringify(data));
}

/**
 * Loads and parses the saved game data from storage.
 * @param {number} [slot] - Save slot index (0–4). Defaults to 0.
 * @returns {object|null} Parsed save data, or null if none exists.
 */
export function loadGame(slot = 0) {
  if (!_storage) return null;
  const raw = _storage.getItem(SAVE_KEY(slot));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Returns true if a save exists in the given slot.
 * @param {number} [slot] - Save slot index (0–4). Defaults to 0.
 * @returns {boolean}
 */
export function hasSave(slot = 0) {
  if (!_storage) return false;
  return _storage.getItem(SAVE_KEY(slot)) !== null;
}

/**
 * Returns true if any slot contains a save.
 * @returns {boolean}
 */
export function hasAnySave() {
  return listSaves().some(s => !s.empty);
}

/**
 * Removes the save from the given slot.
 * @param {number} [slot] - Save slot index (0–4). Defaults to 0.
 */
export function deleteSave(slot = 0) {
  if (_storage) _storage.removeItem(SAVE_KEY(slot));
}

/**
 * Returns a summary of every save slot for the slot selection screen.
 * @returns {Array<{slot:number,empty:boolean,floor?:number,level?:number,savedAt?:string}>}
 */
export function listSaves() {
  return Array.from({ length: TOTAL_SLOTS }, (_, i) => {
    const save = loadGame(i);
    if (!save) return { slot: i, empty: true };
    return {
      slot:    i,
      empty:   false,
      floor:   save.floor,
      level:   save.player?.stats?.level ?? 1,
      savedAt: save.savedAt ?? null,
    };
  });
}

/**
 * Encodes the save in the given slot as a portable Base64 string.
 * Returns null if the slot is empty.
 * @param {number} [slot]
 * @returns {string|null}
 */
export function exportSave(slot = 0) {
  const save = loadGame(slot);
  if (!save) return null;
  // encodeURIComponent handles any non-ASCII characters before base64 encoding.
  return btoa(encodeURIComponent(JSON.stringify(save)));
}

/**
 * Decodes an exported save string and writes it into the given slot.
 * Returns true on success, false if the string is invalid.
 * @param {number} [slot]
 * @param {string} encoded
 * @returns {boolean}
 */
export function importSave(slot = 0, encoded) {
  if (!_storage || !encoded) return false;
  try {
    const save = JSON.parse(decodeURIComponent(atob(encoded)));
    if (typeof save.floor !== 'number' || !save.player) return false;
    _storage.setItem(SAVE_KEY(slot), JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
