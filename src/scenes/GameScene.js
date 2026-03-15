import Phaser from 'phaser';
import { FloorManager } from '../systems/FloorManager.js';
import { TurnManager, TURN_STATE } from '../systems/TurnManager.js';
import { resolveMeleeAttack } from '../systems/CombatSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Item } from '../items/Item.js';
import { getFloorLoot } from '../items/ItemTypes.js';
import { computeFOV } from '../fov/ShadowcastFOV.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { DIR, DIR_DELTA } from '../utils/Direction.js';
import { TILE, FOV_STATE } from '../utils/TileTypes.js';
import { createRNG } from '../utils/RNG.js';
import { HeldMovementTracker } from '../systems/HeldMovementTracker.js';
import { HoldRepeatScheduler } from '../systems/HoldRepeatScheduler.js';
import { RunMovementController } from '../systems/RunMovementController.js';
import { applyToGame } from '../systems/DevOptions.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { AchievementSystem } from '../achievements/AchievementSystem.js';

const TILE_SIZE = 16;
const FOV_RADIUS = 8;
const MOVE_DURATION = 80;
// Additional delay after the move animation before auto-repeat fires.
// Total repeat interval ≈ MOVE_DURATION + MOVE_REPEAT_DELAY_MS (~150 ms).
const MOVE_REPEAT_DELAY_MS = 70;

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Systems
    this.floorManager = new FloorManager();
    this.turnManager = new TurnManager();
    this.rng = createRNG(Date.now());
    // AchievementSystem self-registers on the EventBus in its constructor.
    new AchievementSystem();

    // Track whether the message log history panel is open so the ESC handler
    // can close it instead of opening the Achievements screen.
    this._messageLogOpen = false;
    EventBus.on(GameEvents.MESSAGE_LOG_TOGGLED, (open) => { this._messageLogOpen = open; }, this);

    // Entities lists
    this.enemies = [];
    this.items = [];  // floor items (not in inventory)

    // Player
    this.player = new Player(0, 0);

    // Apply developer options (level, floor, starting items) before generating
    // the first floor so that floorManager.currentFloor is already set when
    // generateFloor() evaluates enemy spawn tables.
    applyToGame(this.player, this.floorManager);

    // EnemySpawner reads devOptions automatically (uses singleton by default).
    this._enemySpawner = new EnemySpawner(this.rng);

    // Generate first floor
    this._buildFloor(this.floorManager.generateFloor());

    // Input
    this._runController = new RunMovementController();
    this._setupInput();

    // Cross-scene events
    this._setupEvents();

    // Push initial state to registry for UIScene
    this._syncRegistry();
  }

  // ─── Floor Construction ───────────────────────────────────────────────────

  _buildFloor(dungeonData) {
    const { map, rooms, startPos } = dungeonData;
    this.dungeonMap = map;
    this.rooms = rooms;

    // Clear old sprites
    this._clearFloorEntities();

    // Build Phaser tilemap
    this._buildTilemap(map);

    // Spawn player
    this.player.x = startPos.x;
    this.player.y = startPos.y;

    if (!this.playerSprite) {
      this.playerSprite = this.add.sprite(
        startPos.x * TILE_SIZE + TILE_SIZE / 2,
        startPos.y * TILE_SIZE + TILE_SIZE / 2,
        'entity_player'
      ).setDepth(10);
      this.player.sprite = this.playerSprite;
    } else {
      this.playerSprite.setPosition(
        startPos.x * TILE_SIZE + TILE_SIZE / 2,
        startPos.y * TILE_SIZE + TILE_SIZE / 2
      );
    }

    // Camera
    const mapW = map.width * TILE_SIZE;
    const mapH = map.height * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.playerSprite, true, 0.12, 0.12);
    this.cameras.main.setZoom(2);

    // Spawn enemies (skip start room)
    this._spawnEnemies(rooms);

    // Spawn items
    this._spawnItems(rooms);

    // Update FOV
    this._updateFOV();
  }

  _clearFloorEntities() {
    for (const e of this.enemies) {
      if (e.sprite) e.sprite.destroy();
    }
    this.enemies = [];

    for (const item of this.items) {
      if (item.sprite) item.sprite.destroy();
    }
    this.items = [];

    if (this.mapRT) { this.mapRT.destroy(); this.mapRT = null; }
    if (this.shadowGraphics) { this.shadowGraphics.destroy(); this.shadowGraphics = null; }
  }

  _buildTilemap(map) {
    this._buildMapGraphics(map);
    this._buildShadowLayer(map);
  }

  _buildMapGraphics(map) {
    const mapW = map.width * TILE_SIZE;
    const mapH = map.height * TILE_SIZE;

    // Use a RenderTexture for the entire map (draw once)
    this.mapRT = this.add.renderTexture(0, 0, mapW, mapH).setDepth(0).setOrigin(0);

    const tileKeys = {
      [TILE.FLOOR]: 'tile_floor',
      [TILE.WALL]:  'tile_wall',
      [TILE.DOOR]:  'tile_door',
      [TILE.STAIRS_DOWN]: 'tile_stairs',
    };

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tileType = map.getTile(x, y);
        const key = tileKeys[tileType];
        if (key) {
          this.mapRT.drawFrame(key, undefined, x * TILE_SIZE, y * TILE_SIZE);
        }
      }
    }
  }

  _buildShadowLayer(map) {
    // Shadow overlay: array of sprites (one per tile)
    // Using a RenderTexture for performance then updating per-tile via a Graphics layer
    // For simplicity, use individual rectangles grouped in a container
    // But for 80x60 = 4800 tiles that's too many individual objects.
    // Instead use a single Graphics object we redraw on each FOV update.

    this.shadowGraphics = this.add.graphics().setDepth(5);
    this._redrawShadows();
  }

  _redrawShadows() {
    const g = this.shadowGraphics;
    g.clear();

    for (let y = 0; y < this.dungeonMap.height; y++) {
      for (let x = 0; x < this.dungeonMap.width; x++) {
        const state = this.dungeonMap.getFovState(x, y);
        if (state === FOV_STATE.UNEXPLORED) {
          g.fillStyle(0x000000, 1.0);
          g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else if (state === FOV_STATE.EXPLORED) {
          g.fillStyle(0x000000, 0.72);
          g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
        // VISIBLE: no shadow drawn
      }
    }
  }

  // ─── Enemy & Item Spawning ────────────────────────────────────────────────

  _spawnEnemies(rooms) {
    this._enemySpawner.spawnForRooms(
      rooms,
      this.floorManager.currentFloor,
      (x, y)       => this._getEntityAt(x, y),
      (x, y, type) => this._spawnEnemy(x, y, type),
    );
  }

  _spawnEnemy(x, y, type) {
    const enemy = new Enemy(x, y, type);
    const sprite = this.add.sprite(
      x * TILE_SIZE + TILE_SIZE / 2,
      y * TILE_SIZE + TILE_SIZE / 2,
      enemy.textureKey
    ).setDepth(8).setVisible(false);
    enemy.sprite = sprite;
    this.enemies.push(enemy);
    this.dungeonMap.setEntity(x, y, enemy);
  }

  _spawnItems(rooms) {
    const floor = this.floorManager.currentFloor;
    // Place 1–2 items per room (skip start room)
    for (let i = 1; i < rooms.length; i++) {
      if (!this.rng.nextBool(0.6)) continue;
      const room = rooms[i];
      const ix = this.rng.nextInt(room.x + 1, room.x + room.w - 2);
      const iy = this.rng.nextInt(room.y + 1, room.y + room.h - 2);
      if (!this._getEntityAt(ix, iy)) {
        const typeDef = getFloorLoot(floor, this.rng);
        this._placeItem(ix, iy, typeDef);
      }
    }
  }

  _placeItem(x, y, typeDef) {
    const item = new Item(x, y, typeDef);
    const sprite = this.add.sprite(
      x * TILE_SIZE + TILE_SIZE / 2,
      y * TILE_SIZE + TILE_SIZE / 2,
      item.textureKey
    ).setDepth(6).setVisible(false);
    item.sprite = sprite;
    this.items.push(item);
  }

  // ─── FOV ─────────────────────────────────────────────────────────────────

  _updateFOV() {
    const map = this.dungeonMap;
    // Reset currently visible tiles
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.getFovState(x, y) === FOV_STATE.VISIBLE) {
          map.setFovState(x, y, FOV_STATE.EXPLORED);
        }
      }
    }

    // Compute new visible set
    computeFOV(
      this.player.x,
      this.player.y,
      FOV_RADIUS,
      (x, y) => map.isOpaque(x, y),
      (x, y) => {
        if (map.inBounds(x, y)) map.setFovState(x, y, FOV_STATE.VISIBLE);
      }
    );

    // Redraw shadow overlay
    this._redrawShadows();

    // Update entity visibility
    for (const enemy of this.enemies) {
      const visible = map.getFovState(enemy.x, enemy.y) === FOV_STATE.VISIBLE;
      if (enemy.sprite) enemy.sprite.setVisible(visible);
    }
    for (const item of this.items) {
      const visible = map.getFovState(item.x, item.y) === FOV_STATE.VISIBLE;
      if (item.sprite) item.sprite.setVisible(visible);
    }
  }

  // ─── Input ────────────────────────────────────────────────────────────────

  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // HeldMovementTracker self-registers its own keydown/keyup listeners.
    this.heldMovement = new HeldMovementTracker(this.input.keyboard, EventBus);
    this._holdRepeat  = new HoldRepeatScheduler(this.heldMovement, MOVE_REPEAT_DELAY_MS);

    // Non-movement actions cancel any active run before executing.
    this.input.keyboard.on('keydown-I',            () => { this._runController.cancel(); this._toggleInventory(); });
    this.input.keyboard.on('keydown-PERIOD',        () => { this._runController.cancel(); this._tryUseStairs(); });
    this.input.keyboard.on('keydown-GREATER_THAN',  () => { this._runController.cancel(); this._tryUseStairs(); });
    // ESC closes the message log history panel when it is open; otherwise
    // it opens the Achievements overlay.
    this.input.keyboard.on('keydown-ESC', () => {
      this._runController.cancel();
      if (this._messageLogOpen) {
        EventBus.emit(GameEvents.CLOSE_MESSAGE_LOG);
      } else {
        this._openAchievements();
      }
    });

    // SHIFT+direction starts a run; a plain direction key cancels any active run
    // and performs a single step.  Cancelling before _handleDir is safe because
    // _startRun calls runController.start() directly, which does not depend on
    // the previous run state.
    this.input.keyboard.on('keydown-UP',    (e) => { if (e.shiftKey) { this._startRun(DIR.UP);    } else { this._runController.cancel(); this._handleDir(DIR.UP);    } });
    this.input.keyboard.on('keydown-DOWN',  (e) => { if (e.shiftKey) { this._startRun(DIR.DOWN);  } else { this._runController.cancel(); this._handleDir(DIR.DOWN);  } });
    this.input.keyboard.on('keydown-LEFT',  (e) => { if (e.shiftKey) { this._startRun(DIR.LEFT);  } else { this._runController.cancel(); this._handleDir(DIR.LEFT);  } });
    this.input.keyboard.on('keydown-RIGHT', (e) => { if (e.shiftKey) { this._startRun(DIR.RIGHT); } else { this._runController.cancel(); this._handleDir(DIR.RIGHT); } });
    this.input.keyboard.on('keydown-W',     (e) => { if (e.shiftKey) { this._startRun(DIR.UP);    } else { this._runController.cancel(); this._handleDir(DIR.UP);    } });
    this.input.keyboard.on('keydown-S',     (e) => { if (e.shiftKey) { this._startRun(DIR.DOWN);  } else { this._runController.cancel(); this._handleDir(DIR.DOWN);  } });
    this.input.keyboard.on('keydown-A',     (e) => { if (e.shiftKey) { this._startRun(DIR.LEFT);  } else { this._runController.cancel(); this._handleDir(DIR.LEFT);  } });
    this.input.keyboard.on('keydown-D',     (e) => { if (e.shiftKey) { this._startRun(DIR.RIGHT); } else { this._runController.cancel(); this._handleDir(DIR.RIGHT); } });
  }

  _setupEvents() {
    // D-pad presses from UIScene
    EventBus.on(GameEvents.DPAD_PRESS, (dir) => this._handleDir(dir), this);
    // D-pad double-tap starts a run (equivalent to SHIFT+direction on keyboard).
    EventBus.on(GameEvents.DPAD_RUN, (dir) => this._startRun(dir), this);
    EventBus.on(GameEvents.TOGGLE_INVENTORY, () => this._toggleInventory(), this);
    EventBus.on(GameEvents.USE_STAIRS, () => this._tryUseStairs(), this);
    EventBus.on(GameEvents.INVENTORY_USE, (index) => this._useInventoryItem(index), this);
    EventBus.on(GameEvents.FLOOR_CHANGED, (floor) => {
      this.registry.set('floor', floor);
    }, this);
    // Log a message when an achievement is unlocked (banner is shown by UIScene).
    EventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, (achievement) => {
      EventBus.emit(GameEvents.MESSAGE, `Achievement unlocked: ${achievement.name}!`);
    }, this);
  }

  _handleDir(dir) {
    if (!this.turnManager.isAcceptingInput()) return;
    const { dx, dy } = DIR_DELTA[dir];
    this._doPlayerMove(dx, dy);
  }

  /**
   * Starts a run in the given direction.  If the immediately adjacent tile
   * contains an entity (enemy), the player attacks normally and no run begins.
   * Otherwise the run controller is armed and the first step is taken.
   *
   * @param {string} dir - A DIR constant (UP / DOWN / LEFT / RIGHT).
   */
  _startRun(dir) {
    if (!this.turnManager.isAcceptingInput()) return;
    const { dx, dy } = DIR_DELTA[dir];
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    if (this._getEntityAt(nx, ny)) {
      // Target tile has an entity — attack and do not begin running.
      this._handleDir(dir);
      return;
    }
    this._runController.start(dir);
    this._doPlayerMove(dx, dy);
  }

  /**
   * Advances one step of an active run.  Evaluates stop conditions before
   * each step: the run ends if the next tile is blocked (wall or entity) or
   * if any enemy or item is currently visible in the FOV.
   */
  _continueRun() {
    const { dx, dy } = DIR_DELTA[this._runController.getDir()];
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    const blocked = !this.dungeonMap.isWalkable(nx, ny) || this._getEntityAt(nx, ny) !== null;
    const dir = this._runController.nextDir(blocked, this._anyEntityVisible());
    if (dir) this._handleDir(dir);
  }

  /**
   * Returns true if any enemy or item occupies a tile that is currently
   * visible in the player's FOV.  Used by the run system to stop auto-movement
   * the moment a threat or point of interest comes into view.
   *
   * @returns {boolean}
   */
  _anyEntityVisible() {
    return this.enemies.some(e => this.dungeonMap.getFovState(e.x, e.y) === FOV_STATE.VISIBLE)
      || this.items.some(i => this.dungeonMap.getFovState(i.x, i.y) === FOV_STATE.VISIBLE);
  }

  // ─── Player Actions ───────────────────────────────────────────────────────

  _doPlayerMove(dx, dy) {
    const result = this.player.move(dx, dy, this.dungeonMap, (x, y) => this._getEntityAt(x, y));

    if (result.action === 'blocked') {
      return; // No turn spent on blocked moves
    }

    this.turnManager.setPlayerActing();

    if (result.action === 'attacked') {
      this._playerAttack(result.target);
    } else if (result.action === 'moved' || result.action === 'stairs') {
      // Update entity map
      this.dungeonMap.setEntity(this.player.x - dx, this.player.y - dy, null);
      // Animate
      this._animateMove(this.playerSprite, this.player.x, this.player.y, () => {
        this._afterPlayerMove(result.action);
      });
    }
  }

  _animateMove(sprite, tileX, tileY, onComplete) {
    this.tweens.add({
      targets: sprite,
      x: tileX * TILE_SIZE + TILE_SIZE / 2,
      y: tileY * TILE_SIZE + TILE_SIZE / 2,
      duration: MOVE_DURATION,
      ease: 'Linear',
      onComplete,
    });
  }

  _afterPlayerMove(action) {
    this._updateFOV();
    this._checkItemPickup();
    if (action === 'stairs') {
      this._showStairsPrompt();
    }
    this._syncRegistry();
    this._startEnemyTurns();
  }

  _playerAttack(target) {
    // Bump animation: move toward target then back
    const tx = target.x * TILE_SIZE + TILE_SIZE / 2;
    const ty = target.y * TILE_SIZE + TILE_SIZE / 2;
    const sx = this.playerSprite.x;
    const sy = this.playerSprite.y;
    const bx = sx + Math.sign(tx - sx) * TILE_SIZE * 0.4;
    const by = sy + Math.sign(ty - sy) * TILE_SIZE * 0.4;

    this.tweens.add({
      targets: this.playerSprite,
      x: bx, y: by,
      duration: 40,
      yoyo: true,
      onComplete: () => {
        const { damage, killed, message } = resolveMeleeAttack(
          this.player, target, this.rng
        );
        EventBus.emit(GameEvents.MESSAGE, message);
        this._flashSprite(target.sprite, 0xff4444);

        if (killed) {
          // Notify achievement system via event so it can update kill-based progress.
          EventBus.emit(GameEvents.ENEMY_KILLED, target.type);

          const leveled = this.player.gainXP(target.xp);
          if (leveled) {
            EventBus.emit(GameEvents.MESSAGE, `Level up! You are now level ${this.player.stats.level}!`);
            EventBus.emit(GameEvents.PLAYER_LEVEL_UP, this.player.stats.level);
            // Golden flash over the game world to make the moment unmissable.
            this.cameras.main.flash(600, 255, 220, 100);
          }
          this.dungeonMap.setEntity(target.x, target.y, null);
          this.enemies = this.enemies.filter(e => e !== target);
          if (target.sprite) {
            this.tweens.add({
              targets: target.sprite,
              alpha: 0,
              duration: 200,
              onComplete: () => target.sprite?.destroy(),
            });
          }
        }

        this._syncRegistry();
        this._startEnemyTurns();
      },
    });
  }

  _flashSprite(sprite, color) {
    if (!sprite) return;
    sprite.setTint(color);
    this.time.delayedCall(150, () => sprite.clearTint());
  }

  _checkItemPickup() {
    const px = this.player.x;
    const py = this.player.y;
    const itemIndex = this.items.findIndex(i => i.x === px && i.y === py);
    if (itemIndex === -1) return;

    const item = this.items[itemIndex];
    const msg = InventorySystem.pickUp(this.player, item);
    EventBus.emit(GameEvents.MESSAGE, msg);

    if (this.player.inventory.includes(item)) {
      // Successfully picked up
      this.items.splice(itemIndex, 1);
      if (item.sprite) item.sprite.destroy();
      this._syncRegistry();
    }
  }

  _showStairsPrompt() {
    EventBus.emit(GameEvents.MESSAGE, 'You stand on the stairs. Press > or tap ▼▼ to descend.');
  }

  /**
   * Pauses the game and UI scenes and opens the AchievementsScene overlay.
   * The AchievementsScene will resume both scenes when the player closes it.
   */
  _openAchievements() {
    // Launch first so the queue operation is registered while this scene is still
    // running, then sleep GameScene and UIScene.  sleep() stops both update and
    // rendering (unlike pause() which only stops update, leaving the scenes
    // visible on top of the achievements overlay).
    this.scene.launch('AchievementsScene', { fromScene: 'GameScene' });
    this.scene.sleep('UIScene');
    this.scene.sleep('GameScene');
  }

  _tryUseStairs() {
    if (!this.turnManager.isAcceptingInput()) return;
    const tileType = this.dungeonMap.getTile(this.player.x, this.player.y);
    if (tileType === TILE.STAIRS_DOWN) {
      this._descend();
    } else {
      EventBus.emit(GameEvents.MESSAGE, 'No stairs here.');
    }
  }

  _descend() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      const dungeonData = this.floorManager.descend();
      this._buildFloor(dungeonData);
      this._syncRegistry();
      EventBus.emit(GameEvents.MESSAGE, `You descend to floor ${this.floorManager.currentFloor}.`);
      this.cameras.main.fadeIn(300, 0, 0, 0);
    });
  }

  _toggleInventory() {
    EventBus.emit(GameEvents.OPEN_INVENTORY, {
      inventory: this.player.inventory,
      player: this.player,
    });
    if (this.turnManager.state === TURN_STATE.INVENTORY) {
      this.turnManager.setPlayerInput();
    } else if (this.turnManager.isAcceptingInput()) {
      this.turnManager.setInventory();
    }
  }

  _useInventoryItem(index) {
    const msg = InventorySystem.useItem(this.player, index);
    EventBus.emit(GameEvents.MESSAGE, msg);
    this._syncRegistry();
    if (this.player.isDead()) {
      this._gameOver();
    }
  }

  // ─── Enemy Turns ──────────────────────────────────────────────────────────

  _startEnemyTurns() {
    this.turnManager.setEnemyActing();

    for (const enemy of this.enemies) {
      const result = enemy.takeTurn(this.player, this.dungeonMap, (x, y) => this._getEntityAt(x, y), this.rng);

      if (result.action === 'attack') {
        const { damage, killed, message } = resolveMeleeAttack(
          enemy, this.player, this.rng
        );
        EventBus.emit(GameEvents.MESSAGE, message);
        this._flashSprite(this.playerSprite, 0xff0000);
        this._syncRegistry();

        if (this.player.isDead()) {
          this._gameOver();
          return;
        }
      } else if (result.action === 'move') {
        this.dungeonMap.setEntity(enemy.x, enemy.y, null);
        enemy.x += result.dx;
        enemy.y += result.dy;
        this.dungeonMap.setEntity(enemy.x, enemy.y, enemy);
        if (enemy.sprite) {
          enemy.sprite.setPosition(
            enemy.x * TILE_SIZE + TILE_SIZE / 2,
            enemy.y * TILE_SIZE + TILE_SIZE / 2
          );
        }
      }
    }

    this.turnManager.setPlayerInput();
    this._beginPlayerTurn();
  }

  /**
   * Called at the start of every player turn — both the first turn of the game
   * and after each round of enemy turns.  This method is the "loop-back" point
   * that makes the turn cycle explicit:
   *
   *   _handleDir → _doPlayerMove / _playerAttack
   *             → _startEnemyTurns
   *             → _beginPlayerTurn
   *             → _handleDir (if a key is still held, otherwise wait for input)
   *
   * Separating this from _startEnemyTurns keeps enemy-turn logic and
   * player-turn-start logic in distinct, single-purpose methods.
   */
  _beginPlayerTurn() {
    if (this._runController.isRunning()) {
      // Continue the active run — each step is a full turn (enemies act, FOV
      // updates) handled by _continueRun rather than the hold-repeat system.
      this._continueRun();
    } else {
      // Auto-continue movement if a direction key is still held from last turn,
      // but wait MOVE_REPEAT_DELAY_MS before triggering the next move so the
      // total repeat interval (~150 ms) feels comfortable rather than frantic.
      this._holdRepeat?.schedule((dir) => this._handleDir(dir));
    }
  }

  // ─── Entity Lookup ────────────────────────────────────────────────────────

  _getEntityAt(x, y) {
    if (this.player && this.player.x === x && this.player.y === y) return this.player;
    return this.enemies.find(e => e.x === x && e.y === y) || null;
  }

  // ─── Game Over ────────────────────────────────────────────────────────────

  _gameOver() {
    EventBus.emit(GameEvents.GAME_OVER);
    this.turnManager.setGameOver();
    EventBus.emit(GameEvents.MESSAGE, 'You died! Press R to restart.');
    this.input.keyboard.once('keydown-R', () => this._restart());
    EventBus.once(GameEvents.RESTART_GAME, () => this._restart());
  }

  _restart() {
    // Clean up event listeners
    EventBus.removeAllListeners();

    this.player = new Player(0, 0);
    this.floorManager = new FloorManager();
    this.rng = createRNG(Date.now());
    this.turnManager = new TurnManager();
    this.playerSprite = null;

    this.scene.stop('UIScene');
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(350, () => {
      this.scene.start('MainMenuScene');
      this.scene.stop('GameScene');
    });
  }

  // ─── Registry Sync ───────────────────────────────────────────────────────

  _syncRegistry() {
    const s = this.player.stats;
    this.registry.set('playerHP', s.hp);
    this.registry.set('playerMaxHp', s.maxHp);
    this.registry.set('playerStats', { ...s });
    this.registry.set('floor', this.floorManager.currentFloor);
    this.registry.set('inventory', [...this.player.inventory]);
  }
}
