/**
 * CombatHandler — enemy-turn resolution and combat aftermath for GameScene.
 *
 * Encapsulates all enemy-turn and combat-resolution logic previously split
 * between GameScene and PlayerActionHandler: running the enemy action loop,
 * animating projectiles, destroying defeated enemies, spawning boss minions,
 * and distributing loot when enemies die.
 */

import { resolveMeleeAttack } from '../systems/CombatSystem.js';
import { resolveRangedAttack } from '../systems/RangedCombat.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { TURN_STATE } from '../systems/TurnManager.js';
import { devOptions } from '../systems/DevOptions.js';
import { recordGlobalGoldGained } from '../save/GlobalStatsStore.js';

export class CombatHandler {
  /**
   * @param {import('../scenes/GameScene.js').GameScene} scene
   */
  constructor(scene) {
    /** @private */
    this._scene = scene;
  }

  // ── Public methods ────────────────────────────────────────────────────────

  /**
   * Runs the enemy action loop for one full turn.  Processes every enemy in
   * order (melee attack, ranged attack, move, teleport, creeping move), ticks
   * NPC roam controllers, then launches any pending projectile animations
   * before handing control back to the player.
   */
  startEnemyTurns() {
    const sc = this._scene;
    sc.turnManager.setState(TURN_STATE.ENEMY_ACTING);

    /**
     * Ranged attacks whose projectile animations are deferred until after the
     * synchronous turn loop completes, so all projectiles can fly simultaneously.
     * Damage is resolved immediately; only the visual is deferred.
     *
     * @type {Array<{fromX: number, fromY: number, toX: number, toY: number, color: number, killed: boolean}>}
     */
    const pendingProjectiles = [];

    for (const enemy of sc.enemies) {
      const result = enemy.takeTurn(sc.player, sc.dungeonMap, (x, y) => sc._getEntityAt(x, y), sc.rng);

      if (result.action === 'attack') {
        const { damage, killed, messages } = resolveMeleeAttack(
          enemy, sc.player, sc.rng,
          { defenderIsInvincible: devOptions.playerInvincible },
        );
        messages.forEach(msg => EventBus.emit(GameEvents.MESSAGE, msg));
        sc._flashSprite(sc.playerSprite, 0xff0000);
        sc._syncRegistry();

        if (sc.player.isDead()) {
          sc._gameOver();
          return;
        }
      } else if (result.action === 'ranged_attack') {
        const { damage, killed, messages } = resolveRangedAttack(
          enemy, sc.player, sc.rng,
          { defenderIsInvincible: devOptions.playerInvincible },
        );
        messages.forEach(msg => EventBus.emit(GameEvents.MESSAGE, msg));
        sc._syncRegistry();

        // Queue a projectile animation — visual flies after all enemy actions resolve.
        pendingProjectiles.push({
          fromX: enemy.x,
          fromY: enemy.y,
          toX: sc.player.x,
          toY: sc.player.y,
          color: enemy.projectileColor,
          killed,
        });

        // Player died — stop processing enemies; the deferred path handles game over.
        if (killed) break;
      } else if (result.action === 'move') {
        sc.dungeonMap.setEntity(enemy.x, enemy.y, null);
        enemy.x += result.dx;
        enemy.y += result.dy;
        sc.dungeonMap.setEntity(enemy.x, enemy.y, enemy);
        if (enemy.sprite) {
          sc._repositionSprite(enemy.sprite, enemy.x, enemy.y);
        }
        // Reposition health bar at new tile coordinates.
        sc._updateHealthBar(enemy);
      } else if (result.action === 'teleport') {
        sc.dungeonMap.setEntity(enemy.x, enemy.y, null);
        enemy.x = result.x;
        enemy.y = result.y;
        sc.dungeonMap.setEntity(enemy.x, enemy.y, enemy);
        if (enemy.sprite) {
          sc._repositionSprite(enemy.sprite, enemy.x, enemy.y);
        }
        // Reposition health bar at new tile coordinates.
        sc._updateHealthBar(enemy);
      } else if (result.action === 'creeping_move') {
        // Creeping Mass movement: one tail segment removed, one new segment added
        const { removeSegment, addSegment } = result;
        const seg = enemy.segments.find(s => s.x === removeSegment.x && s.y === removeSegment.y);
        if (seg) {
          sc.dungeonMap.setEntity(seg.x, seg.y, null);
          seg.x = addSegment.x;
          seg.y = addSegment.y;
          sc.dungeonMap.setEntity(seg.x, seg.y, enemy);
          if (seg.sprite) {
            sc._repositionSprite(seg.sprite, seg.x, seg.y);
          }
        }
        // Keep head x, y in sync with the first remaining segment
        if (enemy.segments.length > 0) {
          enemy.x = enemy.segments[0].x;
          enemy.y = enemy.segments[0].y;
          enemy.sprite = enemy.segments[0].sprite;
        }
      }
    }

    // Tick NPC roam controllers — NPCs wander slowly around town.
    for (const roamer of sc._npcRoamControllers) {
      sc._tickNpcRoam(roamer);
    }

    // If any enemy fired a ranged attack, animate all projectiles simultaneously
    // then flash the player and hand control back (or trigger game over).
    if (pendingProjectiles.length > 0) {
      const playerWasKilled = pendingProjectiles.some(p => p.killed);
      this._launchEnemyProjectiles(pendingProjectiles, () => {
        sc._flashSprite(sc.playerSprite, 0xff8800);
        if (playerWasKilled) {
          sc._gameOver();
        } else {
          sc.turnManager.setState(TURN_STATE.PLAYER_INPUT);
          sc._beginPlayerTurn();
        }
      });
      return;
    }

    sc.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    sc._beginPlayerTurn();
  }

  /**
   * Removes an enemy from the scene, clearing all of its dungeon-map tiles and
   * destroying all associated sprites.  Handles both single-tile and multi-segment
   * enemies (e.g. Creeping Mass).
   *
   * @param {object} target - The enemy entity to remove.
   */
  destroyEnemy(target) {
    const sc = this._scene;
    sc.enemies = sc.enemies.filter(e => e !== target);
    if (target.segments) {
      // Multi-segment: clear every tile and destroy every sprite
      for (const seg of target.segments) {
        sc.dungeonMap.setEntity(seg.x, seg.y, null);
        if (seg.sprite) {
          sc.tweens.add({
            targets: seg.sprite,
            alpha: 0,
            duration: 200,
            onComplete: () => seg.sprite?.destroy(),
          });
        }
      }
    } else {
      sc.dungeonMap.setEntity(target.x, target.y, null);
      target.healthBar?.destroy();
      target.healthBar = null;
      if (target.sprite) {
        sc.tweens.add({
          targets: target.sprite,
          alpha: 0,
          duration: 200,
          onComplete: () => target.sprite?.destroy(),
        });
      }
    }
  }

  /**
   * Flushes `enemy.pendingRemovedSegments`: clears each removed segment from
   * the entity map and fades out its sprite.
   *
   * @param {object} enemy - A multi-segment enemy (e.g. Creeping Mass).
   */
  applyPendingRemovedSegments(enemy) {
    if (!enemy.pendingRemovedSegments?.length) return;
    const sc = this._scene;
    for (const seg of enemy.pendingRemovedSegments) {
      sc.dungeonMap.setEntity(seg.x, seg.y, null);
      if (seg.sprite) {
        sc.tweens.add({
          targets: seg.sprite,
          alpha: 0,
          duration: 200,
          onComplete: () => seg.sprite?.destroy(),
        });
      }
    }
    enemy.pendingRemovedSegments = [];
  }

  /**
   * Spawns up to `boss.maxMinions` minions of `boss.minionType` adjacent to
   * the boss on its first hit.  Marks `minionsSpawned` so this only triggers
   * once per encounter.
   *
   * @param {object} boss - A boss entity with minionType, maxMinions, and minionSpawnMessage fields.
   */
  spawnBossMinions(boss) {
    const sc = this._scene;
    boss.minionsSpawned = true;
    const count = sc.rng.nextInt(0, boss.maxMinions);
    if (count === 0) return;

    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
    let spawned = 0;
    for (const { dx, dy } of dirs) {
      if (spawned >= count) break;
      const nx = boss.x + dx;
      const ny = boss.y + dy;
      if (sc.dungeonMap.isWalkable(nx, ny) && !sc._getEntityAt(nx, ny)) {
        sc._spawnEnemy(nx, ny, boss.minionType);
        spawned++;
      }
    }
    // Only announce if at least one minion actually materialised
    if (spawned > 0) {
      EventBus.emit(GameEvents.MESSAGE, boss.minionSpawnMessage);
    }
  }

  /**
   * Awards the player the boss's gold and places its unique item drop on the floor.
   *
   * @param {object} boss
   */
  applyBossLoot(boss) {
    const sc = this._scene;
    if (boss.dropGold > 0) {
      sc.player.gold = (sc.player.gold ?? 0) + boss.dropGold;
      sc.player.recordGoldGained(boss.dropGold);
      recordGlobalGoldGained(boss.dropGold);
      EventBus.emit(GameEvents.PLAYER_GOLD_CHANGED, sc.player.gold);
      EventBus.emit(GameEvents.MESSAGE, `You find ${boss.dropGold} gold on the remains!`);
    }
    if (boss.dropItem) {
      sc._floorBuilder._placeItem(boss.x, boss.y, boss.dropItem);
      EventBus.emit(GameEvents.MESSAGE, `${boss.name} dropped: ${boss.dropItem.name}!`);
    }
  }

  /**
   * Places the champion's drop item on the floor at the champion's position
   * and notifies the player via the message log.
   *
   * @param {object} champion
   */
  applyChampionLoot(champion) {
    const sc = this._scene;
    if (champion.dropItem) {
      sc._floorBuilder._placeItem(champion.x, champion.y, champion.dropItem);
      EventBus.emit(GameEvents.MESSAGE, `${champion.name} dropped: ${champion.dropItem.name}!`);
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Fires all pending enemy projectile animations simultaneously.
   * `onComplete` is called once every projectile has reached its target.
   *
   * @param {Array<{fromX: number, fromY: number, toX: number, toY: number, color: number}>} projectiles
   * @param {function} onComplete
   */
  _launchEnemyProjectiles(projectiles, onComplete) {
    const sc = this._scene;
    let remaining = projectiles.length;
    for (const { fromX, fromY, toX, toY, color } of projectiles) {
      sc._animateProjectile(fromX, fromY, toX, toY, () => {
        remaining -= 1;
        if (remaining === 0) onComplete();
      }, color);
    }
  }
}
