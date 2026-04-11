/**
 * @module Npc
 * @description A non-player character that stands in the town and can be talked
 * to by the player. Dialogue lines cycle on each interaction; a portion of
 * lines are contextual and generated based on the player's current state.
 */

/** Probability (0–1) that a contextual line is attempted on each interaction. */
const CONTEXTUAL_CHANCE = 0.4;

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
    /**
     * Optional array of contextual line generators.  Each is a function that
     * receives the player and returns a string when the condition is met, or
     * null when it does not apply.
     * @type {Array<function(import('./Player.js').Player): string|null>}
     */
    this._contextualLines = def.contextualLines ?? [];
    /** @type {number} Index of the next fixed dialogue line to return. */
    this._lineIndex = 0;
  }

  /**
   * Returns a dialogue line to display.  When a player and rng are provided,
   * there is a {@link CONTEXTUAL_CHANCE} probability that a contextual line is
   * chosen instead of the next fixed cycling line.  Contextual lines are
   * filtered to those whose condition is satisfied by the player's current
   * state; one is picked at random.  If no contextual line applies, or the rng
   * does not trigger the contextual path, the fixed cycling line is returned.
   *
   * @param {import('./Player.js').Player} [player] - The player to evaluate contextual conditions against.
   * @param {function(): number} [rng] - Random number source returning 0–1.
   * @returns {string} The dialogue line to display.
   */
  talk(player, rng) {
    // Attempt a contextual line when the caller supplies player context and rng.
    if (player && rng && this._contextualLines.length > 0 && rng() < CONTEXTUAL_CHANCE) {
      const applicable = this._contextualLines
        .map(fn => fn(player))
        .filter(line => line !== null && line !== undefined);

      if (applicable.length > 0) {
        // Pick one of the applicable lines at random.
        return applicable[Math.floor(rng() * applicable.length)];
      }
    }

    // Fall back to cycling through fixed lines.
    const line = this._lines[this._lineIndex];
    this._lineIndex = (this._lineIndex + 1) % this._lines.length;
    return line;
  }
}
