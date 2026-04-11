import { TILE } from '../utils/TileTypes.js';

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
    };
    /** @type {number} Gold currency owned by the player. */
    this.gold = 0;
    this.inventory = [];
    this.maxInventory = 20;
    this.equippedWeapon = null;
    this.equippedArmor = null;
    this.sprite = null;
  }

  get attackPower() {
    return this.stats.attack + (this.equippedWeapon?.attackBonus || 0);
  }

  get defensePower() {
    return this.stats.defense + (this.equippedArmor?.defenseBonus || 0);
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

    if (!map.isWalkable(nx, ny)) return { action: 'blocked' };

    const tileType = map.getTile(nx, ny);
    this.x = nx;
    this.y = ny;

    if (tileType === TILE.STAIRS_DOWN) return { action: 'stairs' };
    if (tileType === TILE.STAIRS_UP) return { action: 'stairs_up' };
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
    this.stats.attack += 1;
    this.stats.xpToNext = Math.floor(this.stats.xpToNext * 1.5);
  }

  isDead() {
    return this.stats.hp <= 0;
  }

  canPickUp() {
    return this.inventory.length < this.maxInventory;
  }

  addItem(item) {
    if (!this.canPickUp()) return false;
    this.inventory.push(item);
    return true;
  }

  removeItem(index) {
    if (index < 0 || index >= this.inventory.length) return null;
    return this.inventory.splice(index, 1)[0];
  }
}
