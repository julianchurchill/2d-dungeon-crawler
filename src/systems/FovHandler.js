/**
 * @module FovHandler
 * Handles field-of-view computation and shadow-overlay rendering for GameScene.
 */

import { computeFOV, computeDaylightFOV } from '../fov/ShadowcastFOV.js';
import { FOV_STATE } from '../utils/TileTypes.js';
import { tilesetManager } from '../systems/TilesetManager.js';

/** Tile radius of the player's field of view in dungeon floors. */
const FOV_RADIUS = 8;

export class FovHandler {
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
   * Recomputes the visible tile set from the player's position, updates all
   * entity/item/NPC sprite visibility, then repaints the shadow overlay.
   */
  updateFOV() {
    const sc = this._scene;
    const map = sc.dungeonMap;

    // Reset currently visible tiles to explored.
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.getFovState(x, y) === FOV_STATE.VISIBLE) {
          map.setFovState(x, y, FOV_STATE.EXPLORED);
        }
      }
    }

    // Compute new visible set.
    if (sc.floorManager.isTown()) {
      // Daylight: all tiles are visible, no radius limit.
      computeDaylightFOV(
        map.width, map.height,
        (x, y) => { if (map.inBounds(x, y)) map.setFovState(x, y, FOV_STATE.VISIBLE); }
      );
    } else {
      computeFOV(
        sc.player.x,
        sc.player.y,
        FOV_RADIUS + (sc.player.skillSystem?.getFovBonus() ?? 0),
        (x, y) => map.isOpaque(x, y),
        (x, y) => {
          if (map.inBounds(x, y)) map.setFovState(x, y, FOV_STATE.VISIBLE);
        }
      );
    }

    // Redraw shadow overlay.
    this.redrawShadows();

    // Update entity visibility.
    for (const enemy of sc.enemies) {
      if (enemy.segments) {
        // Multi-segment enemy: each segment has its own sprite and visibility.
        for (const seg of enemy.segments) {
          const segVisible = map.getFovState(seg.x, seg.y) === FOV_STATE.VISIBLE;
          if (seg.sprite) seg.sprite.setVisible(segVisible);
        }
      } else {
        const visible = map.getFovState(enemy.x, enemy.y) === FOV_STATE.VISIBLE;
        if (enemy.sprite) enemy.sprite.setVisible(visible);
        // Health bar follows sprite visibility; also hide when at full health.
        if (enemy.healthBar) {
          enemy.healthBar.setVisible(visible && enemy.healthBarFraction < 1);
        }
      }
    }
    for (const item of sc.items) {
      const visible = map.getFovState(item.x, item.y) === FOV_STATE.VISIBLE;
      if (item.sprite) item.sprite.setVisible(visible);
    }
    // Reveal dungeon NPCs (spawned hidden) when they enter the player's FOV.
    // Town NPCs are spawned with setVisible(true) and are never hidden, so
    // including them here is safe — the entire town is always fully visible.
    for (const npc of sc.npcs) {
      const visible = map.getFovState(npc.x, npc.y) === FOV_STATE.VISIBLE;
      if (npc.sprite) npc.sprite.setVisible(visible);
    }
  }

  /**
   * Repaints the shadow graphics overlay based on the current FOV state of
   * each tile: fully black for unexplored, semi-transparent for explored,
   * nothing for visible.
   */
  redrawShadows() {
    const sc = this._scene;
    const g = sc.shadowGraphics;
    const tileSize = this._tileSize;
    g.clear();

    for (let y = 0; y < sc.dungeonMap.height; y++) {
      for (let x = 0; x < sc.dungeonMap.width; x++) {
        const state = sc.dungeonMap.getFovState(x, y);
        if (state === FOV_STATE.UNEXPLORED) {
          g.fillStyle(0x000000, 1.0);
          g.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        } else if (state === FOV_STATE.EXPLORED) {
          g.fillStyle(0x000000, 0.72);
          g.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
        // VISIBLE: no shadow drawn.
      }
    }
  }
}
