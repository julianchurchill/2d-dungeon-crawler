/**
 * @module SpriteAnimator
 * Handles all Phaser sprite animation and health-bar rendering for GameScene.
 */

import { tilesetManager } from '../systems/TilesetManager.js';
import { getHealthBarColor } from '../entities/Enemy.js';

/** Gold tint applied to champion sprites. */
const CHAMPION_TINT = 0xffaa00;
/** Duration in ms of a single tile-step move tween. */
const MOVE_DURATION = 80;

export class SpriteAnimator {
  /**
   * @param {import('../scenes/GameScene.js').GameScene} scene
   */
  constructor(scene) {
    /** @private */
    this._scene = scene;
  }

  /** @private Tile size from the active tileset. */
  get _tileSize() { return tilesetManager.getTileSize(); }

  /**
   * Tweens a sprite to the given tile position.
   * @param {Phaser.GameObjects.Sprite} sprite
   * @param {number} tileX
   * @param {number} tileY
   * @param {Function} onComplete
   */
  animateMove(sprite, tileX, tileY, onComplete) {
    const tileSize = this._tileSize;
    this._scene.tweens.add({
      targets: sprite,
      x: tileX * tileSize + tileSize / 2,
      y: tileY * tileSize + tileSize / 2,
      duration: MOVE_DURATION,
      ease: 'Linear',
      onComplete,
    });
  }

  /**
   * Spawns a coloured circle projectile and tweens it from one tile to another.
   * @param {number} fromTileX
   * @param {number} fromTileY
   * @param {number} toTileX
   * @param {number} toTileY
   * @param {Function} onComplete
   * @param {number} [color=0xffdd44]
   */
  animateProjectile(fromTileX, fromTileY, toTileX, toTileY, onComplete, color = 0xffdd44) {
    const sc = this._scene;
    const tileSize = this._tileSize;
    const half = tileSize / 2;
    const sx = fromTileX * tileSize + half;
    const sy = fromTileY * tileSize + half;
    const tx = toTileX  * tileSize + half;
    const ty = toTileY  * tileSize + half;

    // Draw a small coloured circle — size scales with tile size for all three tilesets.
    const radius = Math.max(2, Math.round(tileSize * 0.15));
    const projectile = sc.add.graphics()
      .fillStyle(color, 1)
      .fillCircle(0, 0, radius)
      .setPosition(sx, sy)
      .setDepth(12); // above map (0), shadows (5), entities (8), player (10)

    // 500 px/s gives ~192 ms for max range (6 tiles) at 16 px/tile, fast but readable.
    const PROJECTILE_PX_PER_MS = 0.5;
    const dist = Math.hypot(tx - sx, ty - sy);
    const duration = Math.max(60, dist / PROJECTILE_PX_PER_MS);

    sc.tweens.add({
      targets: projectile,
      x: tx,
      y: ty,
      duration,
      ease: 'Linear',
      onComplete: () => {
        projectile.destroy();
        onComplete();
      },
    });
  }

  /**
   * Briefly tints a sprite with the given color, then restores its original tint.
   * @param {Phaser.GameObjects.Sprite|null} sprite
   * @param {number} color
   * @param {object|null} [entity=null] - If provided and entity.isChampion, restores champion tint.
   */
  flashSprite(sprite, color, entity = null) {
    if (!sprite) return;
    sprite.setTint(color);
    this._scene.time.delayedCall(150, () => {
      if (entity?.isChampion) {
        sprite.setTint(CHAMPION_TINT);
      } else {
        sprite.clearTint();
      }
    });
  }

  /**
   * Creates a Phaser graphics health bar for an enemy and attaches it to enemy.healthBar.
   * @param {object} enemy
   */
  createHealthBar(enemy) {
    const tileSize = this._tileSize;
    const barW = tileSize - 4;
    const barH = Math.max(2, Math.round(tileSize * 0.1));
    const bar = this._scene.add.graphics()
      .setDepth(9)       // just above entity sprites (depth 8)
      .setScrollFactor(1)
      .setVisible(false); // hidden until damaged
    enemy.healthBar = bar;
    // Draw the initial (full-health) state so dimensions are established.
    this.updateHealthBar(enemy);
  }

  /**
   * Redraws the health bar for an enemy at its current tile position.
   * @param {object} enemy
   */
  updateHealthBar(enemy) {
    const bar = enemy.healthBar;
    if (!bar) return;

    const tileSize = this._tileSize;
    const fraction = enemy.healthBarFraction;
    const barW = tileSize - 4;
    const barH = Math.max(2, Math.round(tileSize * 0.1));

    // Position: centred horizontally above the sprite's top edge.
    const cx = enemy.x * tileSize + tileSize / 2;
    const cy = enemy.y * tileSize + 1; // 1 px below the top of the tile

    bar.clear();
    // Background track
    bar.fillStyle(0x222222, 0.85);
    bar.fillRect(cx - barW / 2, cy, barW, barH);
    // Foreground fill
    bar.fillStyle(getHealthBarColor(fraction), 1);
    bar.fillRect(cx - barW / 2, cy, Math.round(barW * fraction), barH);

    // Only show the bar when the enemy is damaged.
    bar.setVisible(fraction < 1 && enemy.sprite?.visible === true);
  }
}
