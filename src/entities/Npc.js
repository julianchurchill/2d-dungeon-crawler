/**
 * @module Npc
 * @description A non-player character that stands in the town and can be talked
 * to by the player. Dialogue lines cycle on each interaction.
 */
export class Npc {
  /**
   * @param {number} x - Tile x position.
   * @param {number} y - Tile y position.
   * @param {import('./NpcDefinitions.js').NpcDefinition} def - NPC definition.
   */
  constructor(x, y, def) {
    this.x = x;
    this.y = y;
    /** @type {string} Display name shown in the dialogue panel. */
    this.name = def.name;
    /** @type {string} Phaser texture key for the NPC sprite. */
    this.spriteKey = def.spriteKey ?? 'entity_npc';
    /** @type {Phaser.GameObjects.Sprite|null} Injected by GameScene after creation. */
    this.sprite = null;
    this._lines = def.lines;
    /** @type {number} Index of the next dialogue line to return. */
    this._lineIndex = 0;
  }

  /**
   * Returns the current dialogue line and advances the cycle index so the
   * next call returns the following line (wrapping back to the first).
   *
   * @returns {string} The dialogue line to display.
   */
  talk() {
    const line = this._lines[this._lineIndex];
    this._lineIndex = (this._lineIndex + 1) % this._lines.length;
    return line;
  }
}
