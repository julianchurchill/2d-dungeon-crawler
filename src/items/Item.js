export class Item {
  constructor(x, y, typeDef) {
    this.x = x;
    this.y = y;
    this.id = typeDef.id;
    this.name = typeDef.name;
    this.description = typeDef.description;
    this.textureKey = typeDef.textureKey;
    this.itemType = typeDef.type; // 'consumable' | 'weapon' | 'armor'
    this.effect = typeDef.effect || null;
    this.attackBonus = typeDef.attackBonus || 0;
    this.defenseBonus = typeDef.defenseBonus || 0;
    this.sprite = null; // set by GameScene
  }

  /**
   * Use this item on the player.
   * @param {Player} player
   * @returns {string} message describing what happened
   */
  use(player) {
    if (this.itemType === 'consumable') {
      if (this.effect?.heal) {
        const healed = player.heal(this.effect.heal);
        return `You drink the ${this.name} and restore ${healed} HP.`;
      }
    } else if (this.itemType === 'weapon') {
      player.equippedWeapon = this;
      return `You equip the ${this.name}. (+${this.attackBonus} ATK)`;
    } else if (this.itemType === 'armor') {
      player.equippedArmor = this;
      return `You equip the ${this.name}. (+${this.defenseBonus} DEF)`;
    }
    return `You use the ${this.name}.`;
  }

  isConsumable() {
    return this.itemType === 'consumable';
  }

  isEquipment() {
    return this.itemType === 'weapon' || this.itemType === 'armor';
  }
}
