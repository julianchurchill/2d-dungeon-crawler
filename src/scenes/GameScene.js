import Phaser from 'phaser';
import { FloorManager } from '../systems/FloorManager.js';
import { TurnManager, TURN_STATE } from '../systems/TurnManager.js';
import { resolveMeleeAttack } from '../systems/CombatSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Item } from '../items/Item.js';
import { getFloorLoot } from '../items/ItemTypes.js';
import { computeFOV, computeDaylightFOV } from '../fov/ShadowcastFOV.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { DIR, DIR_DELTA } from '../utils/Direction.js';
import { TILE, FOV_STATE } from '../utils/TileTypes.js';
import { createRNG } from '../utils/RNG.js';
import { HeldMovementTracker } from '../systems/HeldMovementTracker.js';
import { HoldRepeatScheduler } from '../systems/HoldRepeatScheduler.js';
import { RunMovementController } from '../systems/RunMovementController.js';
import { applyToGame, devOptions } from '../systems/DevOptions.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { AchievementSystem } from '../achievements/AchievementSystem.js';
import { handleMobileMenuPress } from '../systems/MobileMenuHandler.js';
import { wrapWithRunCancel } from '../utils/ActionWrapper.js';
import { applyInventoryToggle } from '../systems/InventoryToggle.js';
import { applySkillsToggle } from '../systems/SkillsToggle.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { LuckyStrikeSkill } from '../skills/LuckyStrikeSkill.js';
import { FerocitySkill } from '../skills/FerocitySkill.js';
import { DodgeSkill } from '../skills/DodgeSkill.js';
import { HuntingSkill } from '../skills/HuntingSkill.js';
import { NightVisionSkill } from '../skills/NightVisionSkill.js';
import { ITEM_TYPES } from '../items/ItemTypes.js';
import { getProgress, achievementStore } from '../achievements/AchievementStore.js';
import { ShopSystem } from '../systems/ShopSystem.js';
import { isTouchDevice } from '../utils/TouchDeviceDetector.js';

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
    // Store the reference so listeners can be cleaned up when the scene stops,
    // preventing stale handlers accumulating if the player starts a new game.
    this._achievementSystem = new AchievementSystem();
    this.events.once('shutdown', () => this._achievementSystem.destroy());

    // Track whether the message log history panel is open so the ESC handler
    // can close it instead of opening the Achievements screen.
    this._messageLogOpen = false;
    EventBus.on(GameEvents.MESSAGE_LOG_TOGGLED, (open) => { this._messageLogOpen = open; }, this);

    // Track whether the sell panel is open so ESC closes it before the game menu.
    // Also gate player input via TurnManager: block on open, restore on close.
    this._sellPanelOpen = false;
    EventBus.on(GameEvents.SELL_PANEL_TOGGLED, (open) => {
      this._sellPanelOpen = open;
      if (!open) this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    }, this);

    // Entities lists
    this.enemies = [];
    this.items = [];  // floor items (not in inventory)

    // Player
    this.player = new Player(0, 0, new SkillSystem(this.rng, [new LuckyStrikeSkill()], [new FerocitySkill(), new DodgeSkill()]));

    // Apply developer options (level, floor, starting items) before generating
    // the first floor so that floorManager.currentFloor is already set when
    // generateFloor() evaluates enemy spawn tables.
    applyToGame(this.player, this.floorManager);

    // EnemySpawner reads devOptions automatically (uses singleton by default).
    this._enemySpawner = new EnemySpawner(this.rng);

    // Generate first floor
    this._buildFloor(this.floorManager.generateFloor());

    // Input
    this._runController  = new RunMovementController();
    this._runStartItems  = new Set();
    this._setupInput();

    // Cross-scene events
    this._setupEvents();

    // Push initial state to registry for UIScene
    this._syncRegistry();
  }

  // ─── Floor Construction ───────────────────────────────────────────────────

  _buildFloor(dungeonData) {
    const { map, rooms, startPos, shops } = dungeonData;
    this.dungeonMap = map;
    this.rooms = rooms;
    // shops is populated by TownGenerator; regular dungeon floors have none
    this.shops = shops ?? [];

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
    this.cameras.main.setZoom(2);
    if (this.floorManager.isTown() && !isTouchDevice()) {
      // Desktop town: show the whole map centred; no player-follow
      this.cameras.main.stopFollow();
      // Wide bounds so centerOn is not clamped to the small map area
      this.cameras.main.setBounds(-10000, -10000, mapW + 20000, mapH + 20000);
      this.cameras.main.centerOn(mapW / 2, mapH / 2);
    } else {
      // Dungeon (all devices) and town on mobile: follow the player so they
      // are always centred regardless of screen size
      this.cameras.main.setBounds(0, 0, mapW, mapH);
      this.cameras.main.startFollow(this.playerSprite, true, 0.12, 0.12);
    }

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
    this._buildMapGraphics(map, this.floorManager.isTown(), this.shops);
    this._buildShadowLayer(map);
  }

  /**
   * Render all tiles into a RenderTexture.
   * In town mode the shops array is used to draw type-specific door textures
   * (tile_door_potion / tile_door_weapon / tile_door_armour) at each shop door.
   *
   * @param {DungeonMap} map
   * @param {boolean} isTown - Use town tile textures when true.
   * @param {Array<{type:string,doorX:number,doorY:number}>} shops - Shop metadata for door icons.
   */
  _buildMapGraphics(map, isTown = false, shops = []) {
    const mapW = map.width * TILE_SIZE;
    const mapH = map.height * TILE_SIZE;

    // Use a RenderTexture for the entire map (draw once)
    this.mapRT = this.add.renderTexture(0, 0, mapW, mapH).setDepth(0).setOrigin(0);

    const tileKeys = isTown ? {
      [TILE.FLOOR]:       'tile_town_floor',
      [TILE.WALL]:        'tile_town_wall',
      [TILE.DOOR]:        'tile_door',
      [TILE.STAIRS_DOWN]: 'tile_town_stairs',
      [TILE.TOWN_ACCENT]: 'tile_town_accent',
      [TILE.SHOP_ROOF]:   'tile_shop_roof',
    } : {
      [TILE.FLOOR]:       'tile_floor',
      [TILE.WALL]:        'tile_wall',
      [TILE.DOOR]:        'tile_door',
      [TILE.STAIRS_DOWN]: 'tile_stairs',
    };

    // Build position → texture-key overrides for typed shop doors (town only)
    const doorTextureAt = {};
    if (isTown) {
      for (const shop of shops) {
        doorTextureAt[`${shop.doorX},${shop.doorY}`] = `tile_door_${shop.type}`;
      }
    }

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tileType = map.getTile(x, y);
        let key = tileKeys[tileType];
        // Use the type-specific door texture when available
        if (tileType === TILE.DOOR) {
          key = doorTextureAt[`${x},${y}`] ?? key;
        }
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
    // Build the set of achievement-unlocked item ids for this run.
    const unlockedItems = new Set();
    if (getProgress('sprite_stalker', achievementStore).completed) {
      unlockedItems.add(ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION.id);
    }
    // Place 1–2 items per room (skip start room)
    for (let i = 1; i < rooms.length; i++) {
      if (!this.rng.nextBool(0.6)) continue;
      const room = rooms[i];
      const ix = this.rng.nextInt(room.x + 1, room.x + room.w - 2);
      const iy = this.rng.nextInt(room.y + 1, room.y + room.h - 2);
      if (!this._getEntityAt(ix, iy)) {
        const typeDef = getFloorLoot(floor, this.rng, unlockedItems);
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
    if (this.floorManager.isTown()) {
      // Daylight: all tiles are visible, no radius limit
      computeDaylightFOV(
        map.width, map.height,
        (x, y) => { if (map.inBounds(x, y)) map.setFovState(x, y, FOV_STATE.VISIBLE); }
      );
    } else {
      computeFOV(
        this.player.x,
        this.player.y,
        FOV_RADIUS + (this.player.skillSystem?.getFovBonus() ?? 0),
        (x, y) => map.isOpaque(x, y),
        (x, y) => {
          if (map.inBounds(x, y)) map.setFovState(x, y, FOV_STATE.VISIBLE);
        }
      );
    }

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

    // Non-movement actions: cancel any active run before executing.
    this.input.keyboard.on('keydown-I',           wrapWithRunCancel(this._runController, () => this._toggleInventory()));
    this.input.keyboard.on('keydown-K',           wrapWithRunCancel(this._runController, () => this._toggleSkills()));
    this.input.keyboard.on('keydown-PERIOD',       wrapWithRunCancel(this._runController, () => this._tryUseStairs()));
    this.input.keyboard.on('keydown-GREATER_THAN', wrapWithRunCancel(this._runController, () => this._tryUseStairs()));
    // ESC closes the sell panel when open, then the message log, then opens
    // the in-game menu — evaluated in priority order.
    this.input.keyboard.on('keydown-ESC', wrapWithRunCancel(this._runController, () => {
      if (this._messageLogOpen) {
        EventBus.emit(GameEvents.CLOSE_MESSAGE_LOG);
      } else if (this._sellPanelOpen) {
        EventBus.emit(GameEvents.CLOSE_SELL_PANEL);
      } else {
        this._openInGameMenu();
      }
    }));

    // SHIFT+direction starts a run; a plain direction key cancels any active run
    // and performs a single step.  Pre-build the wrapped step handlers so the
    // same function instance is reused for arrow keys and WASD.
    const wUp    = wrapWithRunCancel(this._runController, () => this._handleDir(DIR.UP));
    const wDown  = wrapWithRunCancel(this._runController, () => this._handleDir(DIR.DOWN));
    const wLeft  = wrapWithRunCancel(this._runController, () => this._handleDir(DIR.LEFT));
    const wRight = wrapWithRunCancel(this._runController, () => this._handleDir(DIR.RIGHT));

    this.input.keyboard.on('keydown-UP',    (e) => { if (e.shiftKey) { this._startRun(DIR.UP);    } else { wUp();    } });
    this.input.keyboard.on('keydown-DOWN',  (e) => { if (e.shiftKey) { this._startRun(DIR.DOWN);  } else { wDown();  } });
    this.input.keyboard.on('keydown-LEFT',  (e) => { if (e.shiftKey) { this._startRun(DIR.LEFT);  } else { wLeft();  } });
    this.input.keyboard.on('keydown-RIGHT', (e) => { if (e.shiftKey) { this._startRun(DIR.RIGHT); } else { wRight(); } });
    this.input.keyboard.on('keydown-W',     (e) => { if (e.shiftKey) { this._startRun(DIR.UP);    } else { wUp();    } });
    this.input.keyboard.on('keydown-S',     (e) => { if (e.shiftKey) { this._startRun(DIR.DOWN);  } else { wDown();  } });
    this.input.keyboard.on('keydown-A',     (e) => { if (e.shiftKey) { this._startRun(DIR.LEFT);  } else { wLeft();  } });
    this.input.keyboard.on('keydown-D',     (e) => { if (e.shiftKey) { this._startRun(DIR.RIGHT); } else { wRight(); } });
  }

  _setupEvents() {
    // D-pad presses from UIScene — cancel any active run first (mirrors keyboard behaviour).
    EventBus.on(GameEvents.DPAD_PRESS, wrapWithRunCancel(this._runController, (dir) => this._handleDir(dir)), this);
    // D-pad double-tap starts a run (equivalent to SHIFT+direction on keyboard).
    EventBus.on(GameEvents.DPAD_RUN, (dir) => this._startRun(dir), this);
    // Mobile menu button (≡): cancel run, then close message log if open or open in-game menu.
    EventBus.on(GameEvents.OPEN_IN_GAME_MENU, () => {
      this._runController.cancel();
      handleMobileMenuPress(
        this._messageLogOpen,
        () => EventBus.emit(GameEvents.CLOSE_MESSAGE_LOG),
        () => this._openInGameMenu(),
      );
    }, this);
    EventBus.on(GameEvents.TOGGLE_INVENTORY, wrapWithRunCancel(this._runController, () => this._toggleInventory()), this);
    EventBus.on(GameEvents.TOGGLE_SKILLS,    wrapWithRunCancel(this._runController, () => this._toggleSkills()), this);
    EventBus.on(GameEvents.UPGRADE_SKILL,   ({ skillId }) => this._handleUpgradeSkill(skillId),   this);
    EventBus.on(GameEvents.DOWNGRADE_SKILL, ({ skillId }) => this._handleDowngradeSkill(skillId), this);
    EventBus.on(GameEvents.ACTIVATE_SKILL,  ({ skillId }) => this._handleActivateSkill(skillId),  this);
    EventBus.on(GameEvents.USE_STAIRS, wrapWithRunCancel(this._runController, () => this._tryUseStairs()), this);
    EventBus.on(GameEvents.INVENTORY_USE, (index) => this._useInventoryItem(index), this);
    EventBus.on(GameEvents.SELL_ITEM, ({ shopType, item }) => this._handleSellItem(shopType, item), this);
    EventBus.on(GameEvents.FLOOR_CHANGED, (floor) => {
      this.registry.set('floor', floor);
    }, this);
    // Log a message when an achievement is unlocked (banner is shown by UIScene).
    // Some achievements also grant a permanent skill to the player.
    EventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, (achievement) => {
      EventBus.emit(GameEvents.MESSAGE, `Achievement unlocked: ${achievement.name}!`);
      this._handleAchievementSkillUnlock(achievement.id);
    }, this);

    // Dev-mode only: reset the associated skill when an achievement is re-locked.
    EventBus.on(GameEvents.ACHIEVEMENT_LOCKED, (achievement) => {
      this._handleAchievementSkillLock(achievement.id);
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
    // Snapshot items visible now so the run only stops for newly-visible items.
    this._runStartItems = new Set(
      this.items.filter(i => this.dungeonMap.getFovState(i.x, i.y) === FOV_STATE.VISIBLE),
    );
    this._runController.start(dir);
    this._doPlayerMove(dx, dy);
  }

  /**
   * Advances one step of an active run.  Evaluates stop conditions before
   * each step: the run ends if the next tile is blocked (wall or entity),
   * any enemy is visible, or a new item (not visible at run-start) comes into view.
   */
  _continueRun() {
    const { dx, dy } = DIR_DELTA[this._runController.getDir()];
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    const blocked = !this.dungeonMap.isWalkable(nx, ny) || this._getEntityAt(nx, ny) !== null;
    const dir = this._runController.nextDir(blocked, this._anyEnemyVisible(), this._anyNewItemVisible());
    if (dir) this._handleDir(dir);
  }

  /**
   * Returns true if any enemy occupies a tile currently visible in the FOV.
   *
   * @returns {boolean}
   */
  _anyEnemyVisible() {
    return this.enemies.some(e => this.dungeonMap.getFovState(e.x, e.y) === FOV_STATE.VISIBLE);
  }

  /**
   * Returns true if any item that was not visible when the current run started
   * is now visible in the FOV.  Items already visible at run-start are ignored
   * so the player is not interrupted by loot they have already seen.
   *
   * @returns {boolean}
   */
  _anyNewItemVisible() {
    return this.items.some(
      i => this.dungeonMap.getFovState(i.x, i.y) === FOV_STATE.VISIBLE
        && !this._runStartItems.has(i),
    );
  }

  // ─── Player Actions ───────────────────────────────────────────────────────

  _doPlayerMove(dx, dy) {
    const result = this.player.move(dx, dy, this.dungeonMap, (x, y) => this._getEntityAt(x, y));

    if (result.action === 'blocked') {
      return; // No turn spent on blocked moves
    }

    if (result.action === 'shop') {
      // Cancel any active run so it doesn't resume into the door on the next turn
      this._runController.cancel();
      // Open or toggle the sell panel; no turn spent on door interactions
      const shop = this.shops.find(s => s.doorX === result.doorX && s.doorY === result.doorY);
      if (shop) {
        // Block player movement while the sell panel is visible
        this.turnManager.setState(TURN_STATE.INVENTORY);
        EventBus.emit(GameEvents.OPEN_SELL_PANEL, {
          shopType: shop.type,
          inventory: this.player.inventory,
          player: this.player,
        });
      }
      return;
    }

    this.turnManager.setState(TURN_STATE.PLAYER_ACTING);

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
        const { damage, killed, messages } = resolveMeleeAttack(
          this.player, target, this.rng,
          { defenderIsInvincible: devOptions.enemiesInvincible },
        );
        messages.forEach(msg => EventBus.emit(GameEvents.MESSAGE, msg));
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
            // Offer skill selection if there are choices available.
            this._tryLaunchSkillLevelUp();
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
  /**
   * Opens the in-game menu (Achievements / Help) as an overlay.
   * Sleeps GameScene and UIScene so they stop updating while the menu is shown.
   * InGameMenuScene handles waking them when the player dismisses it.
   */
  _openInGameMenu() {
    this.scene.launch('InGameMenuScene');
    this.scene.sleep('UIScene');
    this.scene.sleep('GameScene');
  }

  /**
   * Opens the Achievements screen directly as an overlay.
   * Used by InGameMenuScene when the player clicks "ACHIEVEMENTS".
   * Left in place so AchievementsScene can still be reached from the main menu.
   */
  _openAchievements() {
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
    // Inventory cannot be opened while the sell panel is visible.
    if (this._sellPanelOpen) return;
    // Only emit the open/close event when a state transition is actually possible,
    // so the visual panel and TurnManager state can never get out of sync.
    const toggled = applyInventoryToggle(this.turnManager);
    if (toggled) {
      EventBus.emit(GameEvents.OPEN_INVENTORY, {
        inventory: this.player.inventory,
        player: this.player,
      });
    }
  }

  _toggleSkills() {
    // Only emit the open/close event when a state transition is actually possible,
    // so the visual panel and TurnManager state can never get out of sync.
    const toggled = applySkillsToggle(this.turnManager);
    if (toggled) {
      EventBus.emit(GameEvents.OPEN_SKILLS, this._buildSkillsPayload());
    }
  }

  /**
   * Maps achievement IDs to the permanent skill they unlock, and applies the
   * unlock to the player's SkillSystem when the achievement is completed.
   *
   * @param {string} achievementId - The ID of the completed achievement.
   */
  _handleAchievementSkillUnlock(achievementId) {
    const skillSystem = this.player?.skillSystem;
    if (!skillSystem) return;

    // Permanent skills are applied immediately and are never shown in the
    // level-up pool — the player cannot activate or upgrade them.
    const PERMANENT_SKILLS = {
      goblin_killer:    () => new HuntingSkill('GOBLIN_HUNTING'),
      orc_killer:       () => new HuntingSkill('ORC_HUNTING'),
      troll_killer:     () => new HuntingSkill('TROLL_HUNTING'),
      cockroach_killer: () => new HuntingSkill('COCKROACH_HUNTING'),
      sprite_killer:    () => new HuntingSkill('SPRITE_HUNTING'),
    };

    // Pool skills are added to the inactive skill list so the player can
    // choose to activate (and later upgrade) them via the level-up screen.
    const POOL_SKILLS = {
      burrower: () => new NightVisionSkill(),
    };

    const permanentFactory = PERMANENT_SKILLS[achievementId];
    if (permanentFactory) {
      const skill = permanentFactory();
      skillSystem.unlockPermanentSkill(skill);
      EventBus.emit(GameEvents.MESSAGE, `Permanent skill unlocked: ${skill.name}!`);
      return;
    }

    const poolFactory = POOL_SKILLS[achievementId];
    if (poolFactory) {
      const skill = poolFactory();
      skillSystem.unlockSkill(skill);
      EventBus.emit(GameEvents.MESSAGE, `New skill available: ${skill.name}! Select it on your next level up.`);
    }
  }

  /**
   * Removes the skill associated with a re-locked achievement from the player's
   * SkillSystem.  Mirrors _handleAchievementSkillUnlock — uses the same maps to
   * derive the skill id, then delegates to SkillSystem.removeSkill().
   * Only called via the dev-mode achievement toggle.
   *
   * @param {string} achievementId - The ID of the achievement that was reset.
   */
  _handleAchievementSkillLock(achievementId) {
    const skillSystem = this.player?.skillSystem;
    if (!skillSystem) return;

    const SKILL_IDS = {
      goblin_killer:    'goblin_hunting',
      orc_killer:       'orc_hunting',
      troll_killer:     'troll_hunting',
      cockroach_killer: 'cockroach_hunting',
      sprite_killer:    'sprite_hunting',
      burrower:         'night_vision',
    };

    const skillId = SKILL_IDS[achievementId];
    if (skillId) skillSystem.removeSkill(skillId);
  }

  /**
   * Handles a request (from SkillsPanel in dev mode) to upgrade a named skill.
   * Upgrades the skill via SkillSystem and re-emits OPEN_SKILLS so the panel
   * refreshes in place without closing.
   *
   * @param {string} skillId - The ID of the skill to upgrade.
   */
  _handleUpgradeSkill(skillId) {
    if (this.player.skillSystem) {
      this.player.skillSystem.upgradeSkill(skillId);
    }
    // Re-emit with forceRefresh so the panel re-renders without toggling.
    EventBus.emit(GameEvents.OPEN_SKILLS, { ...this._buildSkillsPayload(), forceRefresh: true });
  }

  /**
   * Handles a request (from SkillsPanel in dev mode) to downgrade a named skill.
   * Downgrades the skill via SkillSystem and re-emits OPEN_SKILLS so the panel
   * refreshes in place without closing.
   *
   * @param {string} skillId - The ID of the skill to downgrade.
   */
  _handleDowngradeSkill(skillId) {
    if (this.player.skillSystem) {
      this.player.skillSystem.downgradeSkill(skillId);
    }
    EventBus.emit(GameEvents.OPEN_SKILLS, { ...this._buildSkillsPayload(), forceRefresh: true });
  }

  /**
   * Handles a request (from SkillsPanel in dev mode) to activate a named inactive skill.
   * Activates the skill via SkillSystem and re-emits OPEN_SKILLS so the panel refreshes.
   *
   * @param {string} skillId - The ID of the skill to activate.
   */
  _handleActivateSkill(skillId) {
    if (this.player.skillSystem) {
      this.player.skillSystem.activateSkill(skillId);
    }
    EventBus.emit(GameEvents.OPEN_SKILLS, { ...this._buildSkillsPayload(), forceRefresh: true });
  }

  /**
   * Launches SkillLevelUpScene if there are skills to activate or upgrade.
   * Sleeps GameScene and UIScene while the choice overlay is shown.
   */
  _tryLaunchSkillLevelUp() {
    const skillSystem = this.player.skillSystem;
    if (!skillSystem) return;

    const hasInactive   = skillSystem.getInactiveSkills().length > 0;
    const hasUpgradeable = skillSystem.getSkills().some(s => s.canUpgrade);

    if (hasInactive || hasUpgradeable) {
      // Clear movement state before sleeping so missed key-release events
      // cannot cause phantom auto-repeat or run movement on wake.
      this.heldMovement.clear();
      this._runController.cancel();
      this.scene.launch('SkillLevelUpScene', { skillSystem });
      this.scene.sleep('UIScene');
      this.scene.sleep('GameScene');
    }
  }

  /**
   * Builds the payload for the OPEN_SKILLS event, including each skill's
   * current stats, whether it can be upgraded/downgraded, and inactive skills.
   *
   * @returns {{ skills: object[], inactiveSkills: object[] }}
   */
  _buildSkillsPayload() {
    const skillSystem = this.player.skillSystem;
    const skills         = skillSystem ? skillSystem.getSkills()         : [];
    const inactiveSkills = skillSystem ? skillSystem.getInactiveSkills() : [];
    return { skills, inactiveSkills };
  }

  /**
   * Uses the item at the given inventory index.  Passes a world-access context
   * so items with effects that need map or RNG access (e.g. teleport_near) can
   * resolve them inside `item.use()`.  If the player's position changed after
   * the call, the teleport side-effects (sprite snap, FOV update, enemy turns)
   * are applied and the inventory panel is closed.
   *
   * @param {number} index - Inventory slot to use.
   */
  _useInventoryItem(index) {
    const prevX = this.player.x;
    const prevY = this.player.y;

    const context = {
      rng: this.rng,
      isWalkable: (x, y) => this.dungeonMap.isWalkable(x, y),
      getEntityAt: (x, y) => this._getEntityAt(x, y),
    };

    const msg = InventorySystem.useItem(this.player, index, context);
    EventBus.emit(GameEvents.MESSAGE, msg);

    const playerTeleported = this.player.x !== prevX || this.player.y !== prevY;
    if (playerTeleported) {
      // Close the inventory panel before enemy turns so the TurnManager state
      // is PLAYER_INPUT when _startEnemyTurns cycles through ENEMY_ACTING.
      if (this.turnManager.state === TURN_STATE.INVENTORY) {
        this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
        EventBus.emit(GameEvents.OPEN_INVENTORY, {
          inventory: this.player.inventory,
          player: this.player,
        });
      }
      this.playerSprite.setPosition(
        this.player.x * TILE_SIZE + TILE_SIZE / 2,
        this.player.y * TILE_SIZE + TILE_SIZE / 2,
      );
      this._updateFOV();
      this._checkItemPickup();
      this._syncRegistry();
      this._startEnemyTurns();
      return;
    }

    this._syncRegistry();
    if (this.player.isDead()) {
      this._gameOver();
    }
  }

  /**
   * Handles a sell request from the SellPanel.  Creates a ShopSystem for the
   * given shop type, executes the sale, then broadcasts the updated gold and
   * inventory so the HUD and SellPanel stay in sync.
   *
   * @param {string} shopType - 'potion', 'weapon', or 'armour'.
   * @param {Item} item - The item to sell (must be in player's inventory).
   */
  _handleSellItem(shopType, item) {
    // Guard against rapid double-clicks: item may already be gone from inventory
    if (!this.player.inventory.includes(item)) return;
    const shop = new ShopSystem(shopType);
    const earned = shop.sell(this.player, item);
    EventBus.emit(GameEvents.MESSAGE, `Sold ${item.name} for ${earned} gold.`);
    EventBus.emit(GameEvents.PLAYER_GOLD_CHANGED, this.player.gold);
    EventBus.emit(GameEvents.INVENTORY_CHANGED, [...this.player.inventory]);
    this._syncRegistry();
  }

  // ─── Enemy Turns ──────────────────────────────────────────────────────────

  _startEnemyTurns() {
    this.turnManager.setState(TURN_STATE.ENEMY_ACTING);

    for (const enemy of this.enemies) {
      const result = enemy.takeTurn(this.player, this.dungeonMap, (x, y) => this._getEntityAt(x, y), this.rng);

      if (result.action === 'attack') {
        const { damage, killed, messages } = resolveMeleeAttack(
          enemy, this.player, this.rng,
          { defenderIsInvincible: devOptions.playerInvincible },
        );
        messages.forEach(msg => EventBus.emit(GameEvents.MESSAGE, msg));
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
      } else if (result.action === 'teleport') {
        this.dungeonMap.setEntity(enemy.x, enemy.y, null);
        enemy.x = result.x;
        enemy.y = result.y;
        this.dungeonMap.setEntity(enemy.x, enemy.y, enemy);
        if (enemy.sprite) {
          enemy.sprite.setPosition(
            enemy.x * TILE_SIZE + TILE_SIZE / 2,
            enemy.y * TILE_SIZE + TILE_SIZE / 2
          );
        }
      }
    }

    this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
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
    this.turnManager.setState(TURN_STATE.GAME_OVER);
    EventBus.emit(GameEvents.MESSAGE, 'You died! Press R to restart.');
    this.input.keyboard.once('keydown-R', () => this._restart());
    EventBus.once(GameEvents.RESTART_GAME, () => this._restart());
  }

  _restart() {
    // Clean up event listeners
    EventBus.removeAllListeners();

    this.rng = createRNG(Date.now());
    this.player = new Player(0, 0, new SkillSystem(this.rng, [new LuckyStrikeSkill()], [new FerocitySkill(), new DodgeSkill()]));
    this.floorManager = new FloorManager();
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
    this.registry.set('playerGold', this.player.gold);
  }
}
