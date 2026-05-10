export class Item {
  constructor(x, y, typeDef) {
    this.x = x;
    this.y = y;
    this.id = typeDef.id;
    this.name = typeDef.name;
    this.shortName = typeDef.shortName;
    this.description = typeDef.description;
    this.textureKey = typeDef.textureKey;
    this.itemType = typeDef.type; // 'consumable' | 'weapon' | 'ranged_weapon' | 'armor' | 'helmet' | 'chest' | 'legs' | 'arms' | 'boots' | 'ring' | 'amulet'
    this.sellPrice = typeDef.sellPrice ?? 0;
    this.unique = typeDef.unique ?? false;
    this.stackable = typeDef.stackable ?? false;
    /** @type {number} Number of items in this stack (always 1 for non-stackable). */
    this.count = 1;
    this.effect = typeDef.effect || null;
    this.attackBonus = typeDef.attackBonus || 0;
    this.defenseBonus = typeDef.defenseBonus || 0;
    this.canBreakWalls = typeDef.canBreakWalls ?? false;
    this.sprite = null; // set by GameScene
    this._typeDef = typeDef;
  }

  /**
   * Returns a shallow clone of this item with count reset to 1 and sprite cleared.
   * Used when removing one item from a stack (e.g. dropping or selling) so the
   * stack entry stays in inventory while a separate single-item instance is returned.
   *
   * @returns {Item}
   */
  _cloneOne() {
    const clone = Object.create(Object.getPrototypeOf(this));
    Object.assign(clone, this);
    clone.count = 1;
    clone.sprite = null;
    return clone;
  }

  /**
   * Use this item on the player. Delegates to the `use` function defined on the
   * item type, enabling each type to carry its own use logic (strategy pattern).
   *
   * @param {Player} player
   * @param {object} [context] - Optional runtime context (rng, isWalkable, getEntityAt).
   * @returns {string} message describing what happened
   */
  use(player, context = {}) {
    return this._typeDef?.use?.(this, player, context) ?? `You use the ${this.name}.`;
  }

  isConsumable() {
    return this.itemType === 'consumable';
  }

  isEquipment() {
    return ['weapon', 'ranged_weapon', 'armor', 'helmet', 'chest', 'legs', 'arms', 'boots', 'ring', 'amulet']
      .includes(this.itemType);
  }
}
