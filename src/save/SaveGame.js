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
 */

const SAVE_KEY = 'save_game';

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
 * @param {object}   dungeonMap        - DungeonMap instance (must have .tiles, .width, .height).
 * @param {object[]} enemies           - Array of enemy instances on the floor.
 * @param {object[]} items             - Array of Item instances currently on the floor (not in inventory).
 * @param {object}   player            - Player instance (for position).
 * @param {object}   uniqueRoomRegistry - Registry instance with ._seen and ._entered Sets.
 * @returns {object} Plain object suitable for JSON serialisation.
 */
export function serializeFloor(dungeonMap, enemies, items, player, uniqueRoomRegistry) {
  return {
    width:   dungeonMap.width,
    height:  dungeonMap.height,
    tiles:   Array.from(dungeonMap.tiles),
    enemies: enemies.map(serializeEnemy),
    items:   items.map(i => ({ id: i.id, x: i.x, y: i.y, count: i.count ?? 1 })),
    playerX: player.x,
    playerY: player.y,
    uniqueRooms: {
      seen:    Array.from(uniqueRoomRegistry._seen),
      entered: Array.from(uniqueRoomRegistry._entered),
    },
  };
}

export function saveGame(player, floorManager, floorData = null) {
  if (!_storage) return;

  const skillSystem = player.skillSystem;
  const activeSkills   = skillSystem ? skillSystem._activeSkills.map(skillToSaveData)   : [];
  const inactiveSkills = skillSystem ? skillSystem._inactiveSkills.map(skillToSaveData) : [];

  const data = {
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
    },
    floorState: floorData ?? null,
  };

  _storage.setItem(SAVE_KEY, JSON.stringify(data));
}

/**
 * Loads and parses the saved game data from storage.
 * @returns {object|null} Parsed save data, or null if none exists.
 */
export function loadGame() {
  if (!_storage) return null;
  const raw = _storage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Returns true if a save exists in storage.
 * @returns {boolean}
 */
export function hasSave() {
  if (!_storage) return false;
  return _storage.getItem(SAVE_KEY) !== null;
}

/**
 * Removes the save from storage.
 */
export function deleteSave() {
  if (_storage) _storage.removeItem(SAVE_KEY);
}
