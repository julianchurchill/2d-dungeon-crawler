/**
 * Handles every action the player can take on their turn: movement, melee and
 * ranged combat, item use and drop, floor transitions (stairs, teleport, recall
 * portal), post-move checks, and run auto-movement.
 *
 * Extracted from GameScene to keep player-turn logic in one focused module.
 * The handler is given a reference to the GameScene instance so it can read
 * and write game state and delegate rendering/animation back to the scene.
 */
import { EventBus }                        from '../utils/EventBus.js';
import { GameEvents }                      from '../events/GameEvents.js';
import { DIR_DELTA }                       from '../utils/Direction.js';
import { TILE, FOV_STATE }                 from '../utils/TileTypes.js';
import { TURN_STATE }                      from './TurnManager.js';
import { InventorySystem }                 from './InventorySystem.js';
import { DungeonSnapshot }                 from '../dungeon/DungeonSnapshot.js';
import { startFloorTransition }            from './FloorTransition.js';
import { checkDraftProximity }             from '../dungeon/HiddenPassagePlacer.js';
import { findRangedTarget, resolveRangedAttack } from './RangedCombat.js';
import { resolveMeleeAttack }              from './CombatSystem.js';
import { AlcoveCarver }                    from '../dungeon/AlcoveCarver.js';
import { UNIQUE_ROOM_DEFS }                from '../dungeon/UniqueRoomDefinitions.js';
import { uniqueRoomRegistry }              from '../dungeon/UniqueRoomRegistry.js';
import { tilesetManager }                  from './TilesetManager.js';
import { devOptions }                      from './DevOptions.js';
import { saveGame, serializeFloor }        from '../save/SaveGame.js';
import {
  recordGlobalFloorReached,
  recordGlobalKill,
  recordGlobalBossKill,
  recordGlobalWallBroken,
  recordGlobalConsumableUsed,
  recordGlobalHighestLevel,
} from '../save/GlobalStatsStore.js';


export class PlayerActionHandler {
  /**
   * @param {import('../scenes/GameScene.js').GameScene} scene - The active GameScene instance.
   */
  constructor(scene) {
    /** @private */
    this._scene = scene;
  }

  /**
   * Returns the current tile size in pixels from the active tileset.
   * Queried lazily so it always reflects the value set during GameScene.create().
   * @returns {number}
   */
  get _tileSize() { return tilesetManager.getTileSize(); }

  // ─── Input Dispatch ────────────────────────────────────────────────────────

  /**
   * Dispatches a directional input to the appropriate action:
   * look-cursor movement, ranged-aim fire, or normal player move.
   *
   * @param {string} dir - A DIR constant (e.g. DIR.RIGHT).
   */
  handleDir(dir) {
    const sc = this._scene;
    if (sc._lookCursor?.active) {
      if (sc.turnManager.state !== TURN_STATE.PLAYER_INPUT) return;
      const { dx, dy } = DIR_DELTA[dir];
      sc._lookCursor.move(dx, dy);
      sc._showLookInfoAt(sc._lookCursor.x, sc._lookCursor.y);
      return;
    }
    if (sc._aimingRanged) {
      if (!sc.turnManager.isAcceptingInput()) return;
      const { dx, dy } = DIR_DELTA[dir];
      this.doRangedAttack(dx, dy);
      return;
    }
    if (!sc.turnManager.isAcceptingInput()) return;
    const { dx, dy } = DIR_DELTA[dir];
    this.doPlayerMove(dx, dy);
  }

  /**
   * Sets ranged-aim mode on or off and notifies subscribers.
   * @param {boolean} active
   */
  setAimingRanged(active) {
    this._scene._aimingRanged = active;
    EventBus.emit(GameEvents.RANGED_AIM_MODE_CHANGED, active);
  }

  /**
   * Toggles ranged-aim mode. Cancels it if already active; activates it if a
   * ranged weapon is equipped. Emits a feedback message in either case.
   */
  handleToggleRangedAim() {
    const sc = this._scene;
    if (!sc.turnManager.isAcceptingInput()) return;
    if (sc._aimingRanged) {
      this.setAimingRanged(false);
      EventBus.emit(GameEvents.MESSAGE, 'Ranged aim cancelled.');
      return;
    }
    if (!sc.player.equippedRangedWeapon) {
      EventBus.emit(GameEvents.MESSAGE, 'No ranged weapon equipped.');
      return;
    }
    this.setAimingRanged(true);
    EventBus.emit(GameEvents.MESSAGE, 'Aim — choose a direction to fire.');
  }

  // ─── Turn Management ───────────────────────────────────────────────────────

  /**
   * Called at the start of the player's turn. Continues an active run
   * automatically, or re-fires a held direction key via the hold-repeat system.
   */
  beginPlayerTurn() {
    const sc = this._scene;
    if (sc._runController.isRunning()) {
      this.continueRun();
    } else {
      sc._holdRepeat?.schedule((dir) => this.handleDir(dir));
    }
  }

  /**
   * Advances one step of an active run. Cancels the run if the next tile is
   * blocked, an enemy is visible, or a new item has come into view.
   */
  continueRun() {
    const sc = this._scene;
    const { dx, dy } = DIR_DELTA[sc._runController.getDir()];
    const nx = sc.player.x + dx;
    const ny = sc.player.y + dy;
    const blocked = !sc.dungeonMap.isWalkable(nx, ny) || sc._getEntityAt(nx, ny) !== null;
    const dir = sc._runController.nextDir(blocked, this.anyEnemyVisible(), this.anyNewItemVisible());
    if (dir) this.handleDir(dir);
  }

  /**
   * Returns true if any enemy tile is within the player's current FOV.
   * @returns {boolean}
   */
  anyEnemyVisible() {
    const sc = this._scene;
    return sc.enemies.some(e => {
      if (e.segments) {
        return e.segments.some(s => sc.dungeonMap.getFovState(s.x, s.y) === FOV_STATE.VISIBLE);
      }
      return sc.dungeonMap.getFovState(e.x, e.y) === FOV_STATE.VISIBLE;
    });
  }

  /**
   * Returns true if any floor item not present when the current run started
   * is now within the player's FOV (which would halt auto-run).
   * @returns {boolean}
   */
  anyNewItemVisible() {
    const sc = this._scene;
    return sc.items.some(
      i => sc.dungeonMap.getFovState(i.x, i.y) === FOV_STATE.VISIBLE
        && !sc._runStartItems.has(i),
    );
  }

  // ─── Player Movement ───────────────────────────────────────────────────────

  /**
   * Resolves the outcome of the player attempting to move by (dx, dy).
   * Handles all tile interaction results: blocked, npc, home, shop,
   * locked door, break_wall, attacked, moved, stairs, and recall portal.
   *
   * @param {number} dx - Horizontal delta (-1, 0, or 1).
   * @param {number} dy - Vertical delta (-1, 0, or 1).
   */
  doPlayerMove(dx, dy) {
    EventBus.emit(GameEvents.LOOK_HIDE);
    const sc = this._scene;
    const result = sc.player.move(dx, dy, sc.dungeonMap, (x, y) => sc._getEntityAt(x, y));

    if (result.action === 'blocked') return;

    if (result.action === 'npc') {
      sc._runController.cancel();
      sc.turnManager.setState(TURN_STATE.DIALOGUE);
      const line = result.npc.talk(sc.player, () => sc.rng.next());
      EventBus.emit(GameEvents.OPEN_DIALOGUE, { npcName: result.npc.name, line });
      return;
    }

    if (result.action === 'home') {
      sc._runController.cancel();
      sc.turnManager.setState(TURN_STATE.DISPLAY_CASE);
      EventBus.emit(GameEvents.OPEN_DISPLAY_CASE, {
        displayCase: sc.player.displayCase,
        inventory: sc.player.inventory,
        player: sc.player,
      });
      return;
    }

    if (result.action === 'shop') {
      sc._runController.cancel();
      const shop = sc.shops.find(s => s.doorX === result.doorX && s.doorY === result.doorY);
      if (shop) {
        sc.turnManager.setState(TURN_STATE.SHOP);
        sc._activeShop = shop;
        EventBus.emit(GameEvents.OPEN_SHOP_PANEL, {
          shopType:  shop.type,
          shopStock: shop.stock,
          inventory: sc.player.inventory,
          player:    sc.player,
        });
      }
      return;
    }

    if (result.action === 'locked_door') {
      sc._runController.cancel();
      const roomId = sc._entryTracker.getRoomId();
      const roomDef = roomId ? UNIQUE_ROOM_DEFS.find(d => d.id === roomId) : null;
      const requiredKeyId = roomDef?.lockedRoom?.keyId;
      const keyIdx = requiredKeyId
        ? sc.player.inventory.findIndex(i => i.id === requiredKeyId)
        : -1;
      if (keyIdx >= 0) {
        sc.player.removeItem(keyIdx);
        sc.dungeonMap.setTile(result.doorX, result.doorY, TILE.FLOOR);
        const floorBase = roomDef?.floorKey ?? 'tile_floor';
        sc.mapRT.drawFrame(
          tilesetManager.getTileKey(floorBase), undefined,
          result.doorX * this._tileSize, result.doorY * this._tileSize,
        );
        sc._updateFOV();
        EventBus.emit(GameEvents.MESSAGE, 'You use the Key to Elsewhere. The sealed door swings open.');
      } else {
        EventBus.emit(GameEvents.MESSAGE, 'The door is sealed. Martel mentioned a key — the Key to Elsewhere.');
      }
      return;
    }

    if (result.action === 'break_wall') {
      sc._runController.cancel();
      sc.player.recordWallBroken();
      recordGlobalWallBroken();
      const isHiddenPassage = sc.dungeonMap.getTile(result.wallX, result.wallY) === TILE.HIDDEN_PASSAGE_WALL;
      sc.dungeonMap.setTile(result.wallX, result.wallY, TILE.FLOOR);
      const _bwRoomId  = sc._entryTracker.getRoomId();
      const _bwRoomDef = _bwRoomId ? UNIQUE_ROOM_DEFS.find(d => d.id === _bwRoomId) : null;
      const _bwFloorBase = _bwRoomDef?.floorKey ?? 'tile_floor';
      sc.mapRT.drawFrame(
        tilesetManager.getTileKey(_bwFloorBase), undefined,
        result.wallX * this._tileSize, result.wallY * this._tileSize,
      );
      if (isHiddenPassage) {
        sc.turnManager.setState(TURN_STATE.PLAYER_ACTING);
        sc._updateFOV();
        EventBus.emit(GameEvents.MESSAGE, 'You break through the wall and discover a hidden chamber!');
      } else {
        const alcoveChanges = new AlcoveCarver().carve(
          sc.dungeonMap, result.wallX, result.wallY, result.dx, result.dy, sc.rng,
        );
        for (const { x, y, tile } of alcoveChanges) {
          let tileKey;
          if (tile === TILE.FLOOR)               tileKey = tilesetManager.getTileKey(_bwFloorBase);
          else if (tile === TILE.WALL)            tileKey = tilesetManager.getTileKey('tile_wall');
          else if (tile === TILE.BREAKABLE_WALL)  tileKey = tilesetManager.getTileKey('tile_breakable_wall');
          if (tileKey) sc.mapRT.drawFrame(tileKey, undefined, x * this._tileSize, y * this._tileSize);
        }
        sc.turnManager.setState(TURN_STATE.PLAYER_ACTING);
        sc._updateFOV();
        EventBus.emit(GameEvents.MESSAGE, 'You swing your pick axe and break through the rocky wall!');
      }
      this.checkHiddenPassageDraft();
      sc._syncRegistry();
      sc._startEnemyTurns();
      return;
    }

    sc.turnManager.setState(TURN_STATE.PLAYER_ACTING);

    if (result.action === 'attacked') {
      this.playerAttack(result.target);
    } else if (
      result.action === 'moved' || result.action === 'stairs' ||
      result.action === 'stairs_up' || result.action === 'recall_portal'
    ) {
      sc.dungeonMap.setEntity(sc.player.x - dx, sc.player.y - dy, null);
      sc._animateMove(sc.playerSprite, sc.player.x, sc.player.y, () => {
        this.afterPlayerMove(result.action);
      });
    }
  }

  /**
   * Runs post-movement checks: FOV update, item pickup, hidden-passage draft
   * detection, unique-room entry messages, stair/portal prompts, and hand-off
   * to the enemy turn.
   *
   * @param {string} action - The move result action string (e.g. 'moved', 'stairs').
   */
  afterPlayerMove(action) {
    const sc = this._scene;
    sc._updateFOV();
    this.checkItemPickup();
    this.checkHiddenPassageDraft();
    const entryMessages = sc._entryTracker.checkEntry(sc.player.x, sc.player.y);
    if (entryMessages) {
      entryMessages.forEach(msg => EventBus.emit(GameEvents.MESSAGE, msg));
      const enteredRoomId = sc._entryTracker.getRoomId();
      EventBus.emit(GameEvents.UNIQUE_ROOM_ENTERED, enteredRoomId);
      if (enteredRoomId) uniqueRoomRegistry.markEntered(enteredRoomId);
    }
    if (action === 'stairs') {
      this.showStairsPrompt();
    } else if (action === 'stairs_up') {
      this.showStairsUpPrompt();
    } else if (action === 'recall_portal') {
      this.showRecallPortalPrompt();
    }
    sc._syncRegistry();
    sc._startEnemyTurns();
  }

  // ─── Combat ────────────────────────────────────────────────────────────────

  /**
   * Resolves a melee attack against an enemy, animating the bump and applying
   * damage, loot, XP gain, and level-up as appropriate.
   *
   * @param {import('../entities/Enemy.js').Enemy} target - The enemy being attacked.
   */
  playerAttack(target) {
    const sc  = this._scene;
    const ts  = this._tileSize;
    const tx  = target.x * ts + ts / 2;
    const ty  = target.y * ts + ts / 2;
    const sx  = sc.playerSprite.x;
    const sy  = sc.playerSprite.y;
    const bx  = sx + Math.sign(tx - sx) * ts * 0.4;
    const by  = sy + Math.sign(ty - sy) * ts * 0.4;

    sc.tweens.add({
      targets: sc.playerSprite,
      x: bx, y: by,
      duration: 40,
      yoyo: true,
      onComplete: () => {
        const { damage, killed, messages } = resolveMeleeAttack(
          sc.player, target, sc.rng,
          { defenderIsInvincible: devOptions.enemiesInvincible },
        );
        messages.forEach(msg => EventBus.emit(GameEvents.MESSAGE, msg));

        if (target.segments) {
          for (const seg of target.segments) sc._flashSprite(seg.sprite, 0xff4444);
        } else {
          sc._flashSprite(target.sprite, 0xff4444, target);
        }

        sc._applyPendingRemovedSegments(target);
        sc._updateHealthBar(target);

        if (target.isBoss && target.shouldSpawnMinions && !target.minionsSpawned && damage > 0) {
          sc._spawnBossMinions(target);
          sc._updateFOV();
        }

        if (killed) {
          sc.player.recordKill(target.type);
          recordGlobalKill(target.type);
          if (target.isBoss) recordGlobalBossKill(target.type);
          EventBus.emit(GameEvents.ENEMY_KILLED, target.type);

          if (target.isBoss)     sc._combatHandler.applyBossLoot(target);
          if (target.isChampion) sc._combatHandler.applyChampionLoot(target);

          const leveled = sc.player.gainXP(target.xp);
          if (leveled) {
            recordGlobalHighestLevel(sc.player.stats.level);
            EventBus.emit(GameEvents.MESSAGE, `Level up! You are now level ${sc.player.stats.level}!`);
            EventBus.emit(GameEvents.PLAYER_LEVEL_UP, sc.player.stats.level);
            sc.cameras.main.flash(600, 255, 220, 100);
            this.tryLaunchSkillLevelUp();
          }
          sc._destroyEnemy(target);
        }

        sc._syncRegistry();
        sc._startEnemyTurns();
      },
    });
  }

  /**
   * Fires the player's equipped ranged weapon in the given direction.
   * Finds the first valid target within range, animates the projectile, and
   * resolves damage, loot, and XP on arrival.
   *
   * @param {number} dx - Horizontal direction (-1, 0, or 1).
   * @param {number} dy - Vertical direction (-1, 0, or 1).
   */
  doRangedAttack(dx, dy) {
    this.setAimingRanged(false);
    const sc = this._scene;
    const RANGED_RANGE = 6;
    const { target, outOfRange } = findRangedTarget(
      sc.player.x, sc.player.y,
      dx, dy,
      RANGED_RANGE,
      (x, y) => !sc.dungeonMap.isWalkable(x, y),
      (x, y) => sc._getEntityAt(x, y),
    );

    if (!target) {
      const msg = outOfRange ? 'Target is out of range.' : 'No target in that direction.';
      EventBus.emit(GameEvents.MESSAGE, msg);
      return;
    }

    sc.turnManager.setState(TURN_STATE.PLAYER_ACTING);

    sc._animateProjectile(sc.player.x, sc.player.y, target.x, target.y, () => {
      const { damage, killed, messages } = resolveRangedAttack(
        sc.player, target, sc.rng,
        { defenderIsInvincible: devOptions.enemiesInvincible },
      );
      messages.forEach(msg => EventBus.emit(GameEvents.MESSAGE, msg));

      if (target.segments) {
        for (const seg of target.segments) sc._flashSprite(seg.sprite, 0xff4444);
      } else {
        sc._flashSprite(target.sprite, 0xff4444, target);
      }

      sc._applyPendingRemovedSegments(target);
      sc._updateHealthBar(target);

      if (killed) {
        sc.player.recordKill(target.type);
        recordGlobalKill(target.type);
        if (target.isBoss) recordGlobalBossKill(target.type);
        EventBus.emit(GameEvents.ENEMY_KILLED, target.type);
        if (target.isBoss)     sc._combatHandler.applyBossLoot(target);
        if (target.isChampion) sc._combatHandler.applyChampionLoot(target);

        const leveled = sc.player.gainXP(target.xp);
        if (leveled) {
          recordGlobalHighestLevel(sc.player.stats.level);
          EventBus.emit(GameEvents.MESSAGE, `Level up! You are now level ${sc.player.stats.level}!`);
          EventBus.emit(GameEvents.PLAYER_LEVEL_UP, sc.player.stats.level);
          sc.cameras.main.flash(600, 255, 220, 100);
          this.tryLaunchSkillLevelUp();
        }
        sc._destroyEnemy(target);
      }

      sc._syncRegistry();
      sc._startEnemyTurns();
    });
  }

  // ─── Inventory Actions ─────────────────────────────────────────────────────

  /**
   * Uses the inventory item at the given index. Handles teleport-to-town
   * specially (snapshots the floor first), then delegates item use to
   * InventorySystem. Starts enemy turns if a turn was consumed.
   *
   * @param {number} index - Index into player.inventory.
   */
  useInventoryItem(index) {
    const sc   = this._scene;
    const item = sc.player.inventory[index];
    const context = {
      rng:         sc.rng,
      isWalkable:  (x, y) => sc.dungeonMap.isWalkable(x, y),
      getEntityAt: (x, y) => sc._getEntityAt(x, y),
    };

    if (item?.effect?.type === 'teleport_to_town') {
      if (sc.floorManager.isTown()) {
        EventBus.emit(GameEvents.MESSAGE, 'You are already in town — the scroll would be wasted here.');
        return;
      }
      sc._dungeonSnapshot = DungeonSnapshot.create(
        sc.floorManager.currentFloor, sc.player.x, sc.player.y,
        sc.dungeonMap, sc.enemies, sc.items,
        sc._entryTracker.getActiveRoom(),
      );
      if (item.isConsumable()) { sc.player.recordConsumableUsed(item.id); recordGlobalConsumableUsed(item.id); }
      const msg = InventorySystem.useItem(sc.player, index, context);
      EventBus.emit(GameEvents.MESSAGE, msg);
      if (sc.turnManager.state === TURN_STATE.INVENTORY) {
        sc.turnManager.setState(TURN_STATE.PLAYER_INPUT);
        EventBus.emit(GameEvents.OPEN_INVENTORY, { inventory: sc.player.inventory, player: sc.player });
      }
      this.teleportToTown();
      return;
    }

    const prevX = sc.player.x;
    const prevY = sc.player.y;

    if (item?.isConsumable()) { sc.player.recordConsumableUsed(item.id); recordGlobalConsumableUsed(item.id); }
    const msg = InventorySystem.useItem(sc.player, index, context);
    EventBus.emit(GameEvents.MESSAGE, msg);

    const playerTeleported = sc.player.x !== prevX || sc.player.y !== prevY;
    if (playerTeleported) {
      if (sc.turnManager.state === TURN_STATE.INVENTORY) {
        sc.turnManager.setState(TURN_STATE.PLAYER_INPUT);
        EventBus.emit(GameEvents.OPEN_INVENTORY, { inventory: sc.player.inventory, player: sc.player });
      }
      sc.playerSprite.setPosition(
        sc.player.x * this._tileSize + this._tileSize / 2,
        sc.player.y * this._tileSize + this._tileSize / 2,
      );
      sc._updateFOV();
      this.checkItemPickup();
      sc._syncRegistry();
      sc._startEnemyTurns();
      return;
    }

    sc._syncRegistry();
    if (sc.player.isDead()) sc._gameOver();
  }

  /**
   * Drops the inventory item at the given index onto the floor at the player's
   * current position and places a sprite for it.
   *
   * @param {number} index - Index into player.inventory.
   */
  dropInventoryItem(index) {
    const sc     = this._scene;
    const result = InventorySystem.dropItem(sc.player, index);
    if (!result) return;

    const { item, message } = result;
    const sprite = sc.add.sprite(
      item.x * this._tileSize + this._tileSize / 2,
      item.y * this._tileSize + this._tileSize / 2,
      tilesetManager.getTileKey(item.textureKey),
    ).setDepth(6).setVisible(
      sc.dungeonMap.getFovState(item.x, item.y) === FOV_STATE.VISIBLE,
    );
    item.sprite = sprite;
    sc.items.push(item);
    EventBus.emit(GameEvents.MESSAGE, message);
    sc._syncRegistry();
  }

  /**
   * Checks whether the player is standing on a floor item and picks it up
   * if so, removing the sprite and syncing the registry.
   */
  checkItemPickup() {
    const sc        = this._scene;
    const px        = sc.player.x;
    const py        = sc.player.y;
    const itemIndex = sc.items.findIndex(i => i.x === px && i.y === py);
    if (itemIndex === -1) return;

    const item      = sc.items[itemIndex];
    const willPickUp = sc.player.canPickUp(item);
    const msg = InventorySystem.pickUp(sc.player, item);
    EventBus.emit(GameEvents.MESSAGE, msg);

    if (willPickUp) {
      sc.items.splice(itemIndex, 1);
      if (item.sprite) item.sprite.destroy();
      sc._syncRegistry();
    }
  }

  // ─── Exploration Checks ────────────────────────────────────────────────────

  /**
   * Checks proximity to hidden-passage walls and emits a draft message the
   * first time each passage is detected.
   */
  checkHiddenPassageDraft() {
    const sc = this._scene;
    const triggered = checkDraftProximity(
      sc.dungeonMap, sc.player.x, sc.player.y, sc._hiddenPassageDraftShown,
    );
    if (triggered.length > 0) {
      EventBus.emit(GameEvents.MESSAGE, 'You feel a draft nearby.');
    }
  }

  // ─── Floor Transitions ─────────────────────────────────────────────────────

  /**
   * Validates the tile under the player and triggers the appropriate floor
   * transition: descend, ascend, or use the recall portal.
   */
  tryUseStairs() {
    const sc = this._scene;
    if (!sc.turnManager.isAcceptingInput()) return;
    const tileType = sc.dungeonMap.getTile(sc.player.x, sc.player.y);
    if (tileType === TILE.STAIRS_DOWN) {
      if (sc._isChallengeFloor && sc.enemies.length > 0) {
        EventBus.emit(GameEvents.MESSAGE, 'Defeat all enemies before you can descend!');
        return;
      }
      this.descend();
    } else if (tileType === TILE.STAIRS_UP) {
      this.ascend();
    } else if (tileType === TILE.RECALL_PORTAL) {
      this.returnFromSnapshot();
    } else {
      EventBus.emit(GameEvents.MESSAGE, 'No stairs here.');
    }
  }

  /**
   * Descends to the next dungeon floor, saving progress and rebuilding the map.
   */
  descend() {
    const sc = this._scene;
    if (!startFloorTransition(sc.turnManager)) return;
    EventBus.emit(GameEvents.LOOK_HIDE);
    sc._lookCursor?.deactivate();
    sc.cameras.main.fadeOut(300, 0, 0, 0);
    sc.time.delayedCall(300, () => {
      const dungeonData = sc.floorManager.descend();
      sc.player.recordFloorReached(sc.floorManager.currentFloor);
      recordGlobalFloorReached(sc.floorManager.currentFloor);
      sc._buildFloor(dungeonData);
      saveGame(sc.player, sc.floorManager,
        serializeFloor(sc.dungeonMap, sc.enemies, sc.items, sc.player, uniqueRoomRegistry, sc._entryTracker, sc.npcs),
        sc._slot);
      sc._lookCursor?.updateMap(sc.dungeonMap, this._tileSize);
      sc._syncRegistry();
      if (sc._isChallengeFloor) {
        EventBus.emit(GameEvents.MESSAGE, `Floor ${sc.floorManager.currentFloor} — a challenge floor! Defeat all enemies to proceed.`);
      } else {
        EventBus.emit(GameEvents.MESSAGE, `You descend to floor ${sc.floorManager.currentFloor}.`);
      }
      sc.cameras.main.fadeIn(300, 0, 0, 0);
      sc.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    });
  }

  /**
   * Ascends to the previous floor (or the town), saving progress and rebuilding
   * the map. Places the player at the destination stairs.
   */
  ascend() {
    const sc = this._scene;
    if (!startFloorTransition(sc.turnManager)) return;
    EventBus.emit(GameEvents.LOOK_HIDE);
    sc._lookCursor?.deactivate();
    sc.cameras.main.fadeOut(300, 0, 0, 0);
    sc.time.delayedCall(300, () => {
      const dungeonData = sc.floorManager.ascend();
      sc._buildFloor(dungeonData);
      saveGame(sc.player, sc.floorManager,
        serializeFloor(sc.dungeonMap, sc.enemies, sc.items, sc.player, uniqueRoomRegistry, sc._entryTracker, sc.npcs),
        sc._slot);
      sc._lookCursor?.updateMap(sc.dungeonMap, this._tileSize);
      sc.player.x = dungeonData.stairsUpPos.x;
      sc.player.y = dungeonData.stairsUpPos.y;
      sc.playerSprite.setPosition(
        dungeonData.stairsUpPos.x * this._tileSize + this._tileSize / 2,
        dungeonData.stairsUpPos.y * this._tileSize + this._tileSize / 2,
      );
      sc._updateFOV();
      sc._syncRegistry();
      if (sc.floorManager.isTown()) {
        EventBus.emit(GameEvents.MESSAGE, 'You ascend back to town.');
      } else {
        EventBus.emit(GameEvents.MESSAGE, `You ascend to floor ${sc.floorManager.currentFloor}.`);
      }
      sc.cameras.main.fadeIn(300, 0, 0, 0);
      sc.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    });
  }

  /**
   * Teleports the player to the town via the Home Seeking Scroll effect.
   * Snapshots the current floor first so the recall portal can bring them back.
   */
  teleportToTown() {
    const sc = this._scene;
    if (!startFloorTransition(sc.turnManager)) return;
    EventBus.emit(GameEvents.LOOK_HIDE);
    sc._lookCursor?.deactivate();
    sc.cameras.main.fadeOut(300, 0, 0, 0);
    sc.time.delayedCall(300, () => {
      const dungeonData = sc.floorManager.jumpToTown();
      sc._buildFloor(dungeonData);
      this.placeRecallPortal();
      sc._lookCursor?.updateMap(sc.dungeonMap, this._tileSize);
      sc._syncRegistry();
      EventBus.emit(GameEvents.MESSAGE, 'You are whisked back to town. A shimmering portal lingers near the stairs.');
      sc.cameras.main.fadeIn(300, 0, 0, 0);
      sc.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    });
  }

  /**
   * Places the recall portal tile and sprite in the town at the fixed portal position.
   */
  placeRecallPortal() {
    const sc      = this._scene;
    const portalX = 10;
    const portalY = 12;
    sc.dungeonMap.setTile(portalX, portalY, TILE.RECALL_PORTAL);
    const key = tilesetManager.getTileKey('tile_recall_portal');
    sc.mapRT.drawFrame(key, undefined, portalX * this._tileSize, portalY * this._tileSize);
  }

  /**
   * Returns the player to the dungeon floor saved when they used the Home
   * Seeking Scroll, restoring enemy and item sprites from the snapshot.
   */
  returnFromSnapshot() {
    const sc = this._scene;
    if (!sc._dungeonSnapshot) {
      EventBus.emit(GameEvents.MESSAGE, 'The portal fades — there is nowhere to return to.');
      return;
    }
    if (!startFloorTransition(sc.turnManager)) return;

    const snapshot      = sc._dungeonSnapshot;
    sc._dungeonSnapshot = null;

    EventBus.emit(GameEvents.LOOK_HIDE);
    sc._lookCursor?.deactivate();
    sc.cameras.main.fadeOut(300, 0, 0, 0);
    sc.time.delayedCall(300, () => {
      sc.floorManager.currentFloor = snapshot.floor;
      EventBus.emit(GameEvents.FLOOR_CHANGED, sc.floorManager.currentFloor);

      sc._buildFloor({
        map:      snapshot.dungeonMap,
        rooms:    [],
        startPos: { x: snapshot.returnX, y: snapshot.returnY },
        shops:    [],
        npcs:     [],
      });

      // Re-derive challenge flag from restored floor number.
      sc._isChallengeFloor = sc.floorManager.isChallengeFloor();

      // Restore unique room tile textures — _buildFloor repaints the base
      // dungeon tiles, overwriting the custom library/armoury textures.
      if (snapshot.uniqueRoom) {
        sc._floorBuilder.paintUniqueRoomTiles(snapshot.uniqueRoom.room, snapshot.uniqueRoom.def);
      }

      for (const enemy of snapshot.enemies) {
        if (enemy.segments) continue;
        sc._floorBuilder.attachEnemySprite(enemy);
      }

      for (const item of snapshot.items) {
        sc._floorBuilder.attachItemSprite(item);
      }

      sc.player.x = snapshot.returnX;
      sc.player.y = snapshot.returnY;
      sc.playerSprite.setPosition(
        snapshot.returnX * this._tileSize + this._tileSize / 2,
        snapshot.returnY * this._tileSize + this._tileSize / 2,
      );

      sc._lookCursor?.updateMap(sc.dungeonMap, this._tileSize);
      sc._updateFOV();
      sc._syncRegistry();
      EventBus.emit(GameEvents.MESSAGE, `You step through the portal and return to floor ${snapshot.floor}.`);
      sc.cameras.main.fadeIn(300, 0, 0, 0);
      sc.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    });
  }

  // ─── Contextual Prompts ────────────────────────────────────────────────────

  /** Emits the "you are standing on stairs down" hint message. */
  showStairsPrompt() {
    EventBus.emit(GameEvents.MESSAGE, 'You stand on the stairs. Press > or tap ▼▼ to descend.');
  }

  /** Emits the "you are standing on stairs up" hint message. */
  showStairsUpPrompt() {
    EventBus.emit(GameEvents.MESSAGE, 'You stand on the stairs leading up. Press > or tap ▼▼ to ascend.');
  }

  /** Emits the "recall portal" hint message. */
  showRecallPortalPrompt() {
    EventBus.emit(GameEvents.MESSAGE, 'A shimmering portal hums at your feet. Press > or tap ▼▼ to return to the dungeon.');
  }

  // ─── Skills ────────────────────────────────────────────────────────────────

  /**
   * Clears movement state and launches the StatDistributionScene so the player
   * can choose a skill upgrade after levelling up.
   */
  tryLaunchSkillLevelUp() {
    const sc = this._scene;
    sc.heldMovement.clear();
    sc._runController.cancel();
    sc.scene.launch('StatDistributionScene', {
      player:      sc.player,
      skillSystem: sc.player.skillSystem ?? null,
    });
    sc.scene.sleep('UIScene');
    sc.scene.sleep('GameScene');
  }
}
