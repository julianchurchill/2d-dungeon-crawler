import { TILE } from '../utils/TileTypes.js';
import { DisplayCase } from '../systems/DisplayCase.js';

export class Player {
  /**
   * @param {number} x
   * @param {number} y
   * @param {import('../systems/SkillSystem.js').SkillSystem|null} skillSystem
   */
  constructor(x, y, skillSystem = null) {
    this.x = x;
    this.y = y;
    /** @type {import('../systems/SkillSystem.js').SkillSystem|null} */
    this.skillSystem = skillSystem;
    this.stats = {
      hp: 30,
      maxHp: 30,
      attack: 5,
      defense: 2,
      level: 1,
      xp: 0,
      xpToNext: 20,
      statPoints: 0,
    };
    /** @type {number} Gold currency owned by the player. */
    this.gold = 0;
    this.inventory = [];
    this.maxInventory = 20;
    this.equippedWeapon = null;
    this.equippedRangedWeapon = null;
    this.equippedArmor = null;
    this.equippedHelmet = null;
    this.equippedChest  = null;
    this.equippedLegs   = null;
    this.equippedArms   = null;
    this.equippedBoots  = null;
    this.equippedRing1  = null;
    this.equippedRing2  = null;
    this.equippedAmulet = null;
    /** @type {DisplayCase} Persistent display case for unique items — survives floor transitions. */
    this.displayCase = new DisplayCase();
    this.sprite = null;
  }

  get attackPower() {
    return this.stats.attack
      + (this.equippedWeapon?.attackBonus || 0)
      + (this.equippedRangedWeapon?.attackBonus || 0)
      + (this.equippedRing1?.attackBonus || 0)
      + (this.equippedRing2?.attackBonus || 0);
  }

  /**
   * The effective ranged attack power: base stat plus ranged-weapon bonus only.
   * Melee weapon bonuses are intentionally excluded so that equipping a sword
   * does not boost bow damage.
   *
   * @returns {number}
   */
  get rangedAttackPower() {
    return this.stats.attack + (this.equippedRangedWeapon?.attackBonus || 0);
  }

  get defensePower() {
    return this.stats.defense
      + (this.equippedArmor?.defenseBonus    || 0)
      + (this.equippedHelmet?.defenseBonus   || 0)
      + (this.equippedChest?.defenseBonus    || 0)
      + (this.equippedLegs?.defenseBonus     || 0)
      + (this.equippedArms?.defenseBonus     || 0)
      + (this.equippedBoots?.defenseBonus    || 0)
      + (this.equippedRing1?.defenseBonus    || 0)
      + (this.equippedRing2?.defenseBonus    || 0)
      + (this.equippedAmulet?.defenseBonus   || 0);
  }

  move(dx, dy, map, getEntityAt) {
    const nx = this.x + dx;
    const ny = this.y + dy;

    const entity = getEntityAt(nx, ny);
    // NPCs have a talk() method — bumping them starts a conversation, not combat.
    if (entity && typeof entity.talk === 'function') return { action: 'npc', npc: entity };
    if (entity) return { action: 'attacked', target: entity };

    // Walking into a door opens the adjacent shop without moving the player
    if (map.getTile(nx, ny) === TILE.DOOR) return { action: 'shop', doorX: nx, doorY: ny };

    // Walking into the home door opens the display case panel
    if (map.getTile(nx, ny) === TILE.HOME_DOOR) return { action: 'home' };

    // Walking into a locked door — caller decides whether the player has the key
    if (map.getTile(nx, ny) === TILE.LOCKED_DOOR) return { action: 'locked_door', doorX: nx, doorY: ny };

    if (map.getTile(nx, ny) === TILE.BREAKABLE_WALL || map.getTile(nx, ny) === TILE.HIDDEN_PASSAGE_WALL) {
      if (this.equippedWeapon?.canBreakWalls) {
        return { action: 'break_wall', wallX: nx, wallY: ny, dx, dy };
      }
      return { action: 'blocked' };
    }

    if (!map.isWalkable(nx, ny)) return { action: 'blocked' };

    const tileType = map.getTile(nx, ny);
    this.x = nx;
    this.y = ny;

    if (tileType === TILE.STAIRS_DOWN) return { action: 'stairs' };
    if (tileType === TILE.STAIRS_UP) return { action: 'stairs_up' };
    if (tileType === TILE.RECALL_PORTAL) return { action: 'recall_portal' };
    return { action: 'moved' };
  }

  takeDamage(amount) {
    const actual = Math.max(1, amount - this.defensePower);
    this.stats.hp = Math.max(0, this.stats.hp - actual);
    return actual;
  }

  heal(amount) {
    const prev = this.stats.hp;
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
    return this.stats.hp - prev;
  }

  gainXP(amount) {
    this.stats.xp += amount;
    let leveled = false;
    while (this.stats.xp >= this.stats.xpToNext) {
      this.stats.xp -= this.stats.xpToNext;
      this.levelUp();
      leveled = true;
    }
    return leveled;
  }

  levelUp() {
    this.stats.level++;
    this.stats.maxHp += 5;
    this.stats.hp = Math.min(this.stats.hp + 5, this.stats.maxHp);
    this.stats.statPoints += 2;
    this.stats.xpToNext = Math.floor(this.stats.xpToNext * 1.5);
  }

  /**
   * Spend one stat point to increase the given stat by 1.
   * Does nothing if no stat points remain.
   * @param {'attack'|'defense'} stat
   */
  applyStatPoint(stat) {
    if (this.stats.statPoints <= 0) return;
    this.stats[stat] += 1;
    this.stats.statPoints--;
  }

  isDead() {
    return this.stats.hp <= 0;
  }

  /**
   * Returns the equipment slot name that holds the given item, or null if it
   * is not currently equipped. Used by InventorySystem to unequip on drop.
   *
   * @param {object} item - The item instance to look for.
   * @returns {string|null} Slot name (e.g. 'equippedWeapon') or null.
   */
  isEquipped(item) {
    const slots = [
      'equippedWeapon', 'equippedRangedWeapon', 'equippedArmor',
      'equippedHelmet', 'equippedChest', 'equippedLegs', 'equippedArms',
      'equippedBoots', 'equippedRing1', 'equippedRing2', 'equippedAmulet',
    ];
    return slots.find(slot => this[slot] === item) ?? null;
  }

  /**
   * Restores the player to full HP without altering any other stats.
   * Used by the dev-mode resurrect option after death.
   */
  resurrect() {
    this.stats.hp = this.stats.maxHp;
  }

  /**
   * Returns true if the player can pick up the given item.
   * Stackable items can always be picked up when a matching stack already exists
   * in inventory, even when the inventory is otherwise full.
   *
   * @param {import('../items/Item.js').Item|null} [item] - Item to pick up.
   * @returns {boolean}
   */
  canPickUp(item = null) {
    if (this.inventory.length < this.maxInventory) return true;
    if (item?.stackable) {
      return this.inventory.some(i => i.id === item.id && i.stackable);
    }
    return false;
  }

  /**
   * Adds an item to the inventory, stacking it if a matching stackable slot exists.
   * @param {import('../items/Item.js').Item} item
   * @returns {boolean} True if the item was added.
   */
  addItem(item) {
    if (item.stackable) {
      const existing = this.inventory.find(i => i.id === item.id && i.stackable);
      if (existing) {
        existing.count += item.count;
        return true;
      }
    }
    if (this.inventory.length >= this.maxInventory) return false;
    this.inventory.push(item);
    return true;
  }

  /**
   * Removes one item from the inventory slot at the given index.
   * For stackable items with count > 1, decrements the count and returns a
   * single-item clone rather than removing the slot entirely.
   *
   * @param {number} index
   * @returns {import('../items/Item.js').Item|null} The removed (or cloned) item.
   */
  removeItem(index) {
    if (index < 0 || index >= this.inventory.length) return null;
    const item = this.inventory[index];
    if (item.stackable && item.count > 1) {
      item.count--;
      return item._cloneOne();
    }
    return this.inventory.splice(index, 1)[0];
  }
}
