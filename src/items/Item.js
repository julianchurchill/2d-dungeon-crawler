import { findMinorTeleportDestination } from '../systems/MinorTeleportation.js';

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
   * Use this item on the player.
   * @param {Player} player
   * @param {object} [context] - Optional runtime context for effects that need
   *   world access.  For `teleport_near` effects, must contain `rng`,
   *   `isWalkable(x, y)`, and `getEntityAt(x, y)`.
   * @returns {string} message describing what happened
   */
  use(player, context = {}) {
    if (this.itemType === 'consumable') {
      if (this.effect?.heal) {
        const healed = player.heal(this.effect.heal);
        return `You drink the ${this.name} and restore ${healed} HP.`;
      }
      if (this.effect?.type === 'teleport_near') {
        const { rng, isWalkable, getEntityAt } = context;
        const dest = findMinorTeleportDestination(
          player.x, player.y, isWalkable, getEntityAt, rng,
          this.effect.minDist, this.effect.maxDist,
        );
        if (!dest) {
          return `You drink the ${this.name} but nothing happens — no clear space nearby!`;
        }
        player.x = dest.x;
        player.y = dest.y;
        return `You drink the ${this.name} and vanish in a flash!`;
      }
      if (this.effect?.type === 'teleport_to_town') {
        return `You read the ${this.name} and are whisked back to town!`;
      }
    } else if (this.itemType === 'weapon') {
      player.equippedWeapon = this;
      return `You equip the ${this.name}. (+${this.attackBonus} ATK)`;
    } else if (this.itemType === 'ranged_weapon') {
      player.equippedRangedWeapon = this;
      return `You equip the ${this.name}. (+${this.attackBonus} ATK)`;
    } else if (this.itemType === 'armor') {
      player.equippedArmor = this;
      return `You equip the ${this.name}. (+${this.defenseBonus} DEF)`;
    } else if (this.itemType === 'helmet') {
      player.equippedHelmet = this;
      return `You equip the ${this.name}. (+${this.defenseBonus} DEF)`;
    } else if (this.itemType === 'chest') {
      player.equippedChest = this;
      return `You equip the ${this.name}. (+${this.defenseBonus} DEF)`;
    } else if (this.itemType === 'legs') {
      player.equippedLegs = this;
      return `You equip the ${this.name}. (+${this.defenseBonus} DEF)`;
    } else if (this.itemType === 'arms') {
      player.equippedArms = this;
      return `You equip the ${this.name}. (+${this.defenseBonus} DEF)`;
    } else if (this.itemType === 'boots') {
      player.equippedBoots = this;
      return `You equip the ${this.name}. (+${this.defenseBonus} DEF)`;
    } else if (this.itemType === 'ring') {
      // Fill ring 1 first; overflow to ring 2
      if (player.equippedRing1 === null) {
        player.equippedRing1 = this;
      } else {
        player.equippedRing2 = this;
      }
      return `You equip the ${this.name}. (+${this.attackBonus} ATK)`;
    } else if (this.itemType === 'amulet') {
      player.equippedAmulet = this;
      return `You equip the ${this.name}. (+${this.defenseBonus} DEF)`;
    }
    return `You use the ${this.name}.`;
  }

  isConsumable() {
    return this.itemType === 'consumable';
  }

  isEquipment() {
    return ['weapon', 'ranged_weapon', 'armor', 'helmet', 'chest', 'legs', 'arms', 'boots', 'ring', 'amulet']
      .includes(this.itemType);
  }
}
