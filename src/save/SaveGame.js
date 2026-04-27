/**
 * @module SaveGame
 * @description Serialises and restores full player and floor state to
 * localStorage (or an injected storage backend for tests).
 *
 * Save format (JSON):
 * {
 *   floor: number,
 *   player: {
 *     stats:        { hp, maxHp, attack, defense, level, xp, xpToNext, statPoints },
 *     gold:         number,
 *     inventory:    [{ id, count }],
 *     equipped:     { weapon, rangedWeapon, armor, helmet, chest, legs, arms, boots, ring1, ring2, amulet },
 *     activeSkills: [{ id, ...upgradeState }],
 *     inactiveSkills: [{ id, ...upgradeState }],
 *   }
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
export function saveGame(player, floorManager) {
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
