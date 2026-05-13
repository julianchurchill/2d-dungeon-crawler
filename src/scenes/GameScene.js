import Phaser from 'phaser';
import { FloorManager } from '../systems/FloorManager.js';
import { TurnManager, TURN_STATE } from '../systems/TurnManager.js';
import { Player } from '../entities/Player.js';
import { Enemy, getHealthBarColor } from '../entities/Enemy.js';
import { Champion } from '../entities/Champion.js';
import { CreepingMass } from '../entities/CreepingMass.js';
import { OldBones } from '../entities/OldBones.js';
import { Item } from '../items/Item.js';
import { DungeonMap } from '../dungeon/DungeonMap.js';
import { uniqueRoomRegistry } from '../dungeon/UniqueRoomRegistry.js';
import { UniqueRoomEntryTracker } from '../dungeon/UniqueRoomEntryTracker.js';

import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { DIR, DIR_DELTA } from '../utils/Direction.js';
import { TILE, FOV_STATE } from '../utils/TileTypes.js';
import { createRNG } from '../utils/RNG.js';
import { tilesetManager } from '../systems/TilesetManager.js';
import { RunMovementController } from '../systems/RunMovementController.js';
import { applyToGame, devOptions, devGiveItem } from '../systems/DevOptions.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { ENEMY_DEFS } from '../entities/EnemyTypes.js';
import { AchievementSystem } from '../achievements/AchievementSystem.js';
import { applyInventoryToggle } from '../systems/InventoryToggle.js';
import { applySkillsToggle } from '../systems/SkillsToggle.js';
import { difficultyManager } from '../systems/DifficultyManager.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { LuckyStrikeSkill } from '../skills/LuckyStrikeSkill.js';
import { FerocitySkill } from '../skills/FerocitySkill.js';
import { DodgeSkill } from '../skills/DodgeSkill.js';
import { ITEM_TYPES } from '../items/ItemTypes.js';
import { resetAchievementStore } from '../achievements/AchievementStore.js';
import { generateShopItems } from '../items/ShopInventory.js';
import { isTouchDevice } from '../utils/TouchDeviceDetector.js';
import { NpcRoamController } from '../systems/NpcRoamController.js';
import { LookCursor } from '../ui/LookCursor.js';
import { saveGame, serializeFloor, loadGame, hasSave, deleteSave } from '../save/SaveGame.js';

import { PlayerActionHandler } from '../systems/PlayerActionHandler.js';
import { FloorBuilder } from '../systems/FloorBuilder.js';
import { CombatHandler } from '../systems/CombatHandler.js';
import { ShopEventHandler }  from '../systems/ShopEventHandler.js';
import { SkillEventHandler } from '../systems/SkillEventHandler.js';
import { GameLifecycleHandler } from '../systems/GameLifecycleHandler.js';
import { InputHandler } from '../systems/InputHandler.js';
import { FovHandler } from '../systems/FovHandler.js';

import { AutosaveTimer } from '../save/AutosaveTimer.js';
import { loadGlobalStats } from '../save/GlobalStatsStore.js';

// TILE_SIZE is initialised from TilesetManager in GameScene.create() so it
// reflects the active tileset (16 for Classic/Modern, 32 for HD) each time
// the scene starts.  Declared as let so the module-level references below
// stay simple while still being writable at create-time.
let TILE_SIZE = 16;
/** Gold tint applied to champion sprites to distinguish them from normal enemies. */
const CHAMPION_TINT  = 0xffaa00;
/** Scale factor applied to champion sprites to make them visibly larger. */
const CHAMPION_SCALE = 1.35;
const MOVE_DURATION = 80;
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(data = {}) {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    /** The save slot this session reads from and writes to. */
    this._slot = data.slot ?? 0;

    // Resolve tile size and camera zoom from the active tileset.
    // TILE_SIZE is a module-level let so all methods in this file pick it up
    // without needing it passed as a parameter.
    TILE_SIZE = tilesetManager.getTileSize();
    this.cameras.main.setZoom(tilesetManager.getCameraZoom());

    // Systems
    this.floorManager = new FloorManager();
    this.turnManager = new TurnManager();
    this.rng = createRNG(Date.now());
    // Wipe achievements at the start of a new run; preserve them on continue.
    if (data.mode !== 'continue') {
      resetAchievementStore();
    }

    // Load global stats from storage so they are ready for recording.
    loadGlobalStats();

    // AchievementSystem self-registers on the EventBus in its constructor.
    // Store the reference so listeners can be cleaned up when the scene stops,
    // preventing stale handlers accumulating if the player starts a new game.
    this._achievementSystem = new AchievementSystem();
    this.events.once('shutdown', () => this._achievementSystem.destroy());

    // Autosave every 2 minutes so progress is preserved even if the browser
    // is closed without using Save and Exit.
    this._autosaveTimer = new AutosaveTimer(
      120_000,
      () => saveGame(this.player, this.floorManager,
        serializeFloor(this.dungeonMap, this.enemies, this.items, this.player, uniqueRoomRegistry),
        this._slot),
    );
    this._autosaveTimer.start();

    // Track whether the message log history panel is open so the ESC handler
    // can close it instead of opening the Achievements screen.
    this._messageLogOpen = false;
    /** @type {object|null} The shop object currently open in the ShopPanel, or null. */
    this._activeShop = null;
    /**
     * When true the player has pressed R (or the BOW button) and the next
     * direction key / button fires the ranged weapon instead of moving.
     * @type {boolean}
     */
    this._aimingRanged = false;
    EventBus.on(GameEvents.MESSAGE_LOG_TOGGLED, (open) => { this._messageLogOpen = open; }, this);

    // Restore player input when the shop panel closes; clear the active shop reference.
    EventBus.on(GameEvents.SELL_PANEL_TOGGLED, (open) => {
      if (!open) {
        this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
        this._activeShop = null;
      }
    }, this);

    // Restore player input when the dialogue panel closes.
    EventBus.on(GameEvents.DIALOGUE_TOGGLED, (open) => {
      if (!open) this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    }, this);

    // Restore player input when the display case panel closes.
    EventBus.on(GameEvents.DISPLAY_CASE_TOGGLED, (open) => {
      if (!open) this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    }, this);

    EventBus.on(GameEvents.SAVE_AND_EXIT, () => this._handleSaveAndExit(), this);

    // Entities lists
    this.enemies = [];
    this.npcs = [];
    this._npcRoamControllers = [];
    this.items = [];  // floor items (not in inventory)
    this._dungeonSnapshot = null; // saved floor state for Home Seeking Scroll recall

    // Player
    this.player = new Player(0, 0, new SkillSystem(this.rng, [new LuckyStrikeSkill()], [new FerocitySkill(), new DodgeSkill()]));

    // Delegate all player-turn logic to a focused handler.
    this._playerAction = new PlayerActionHandler(this);

    // Delegate all floor-building logic to a focused builder.
    this._floorBuilder = new FloorBuilder(this);

    // Delegate all combat and enemy-turn logic to a focused handler.
    this._combatHandler    = new CombatHandler(this);
    this._shopEventHandler  = new ShopEventHandler(this);
    this._skillEventHandler = new SkillEventHandler(this);
    this._lifecycleHandler  = new GameLifecycleHandler(this);
    this._inputHandler      = new InputHandler(this);
    this._fovHandler        = new FovHandler(this);

    // Reset unique-room tracking so each new game gets a fresh set of
    // discoverable rooms.
    uniqueRoomRegistry.reset();

    this._entryTracker = new UniqueRoomEntryTracker();

    // Apply developer options (level, floor, starting items) before generating
    // the first floor so that floorManager.currentFloor is already set when
    // generateFloor() evaluates enemy spawn tables.
    applyToGame(this.player, this.floorManager);

    // Continue an existing run or start fresh.  Applied after applyToGame so
    // save data takes priority over dev option defaults.
    if (data.mode === 'continue' && hasSave(this._slot)) {
      this._applyLoadedSave(loadGame(this._slot));
    } else {
      deleteSave(this._slot);
    }

    // EnemySpawner reads devOptions automatically (uses singleton by default).
    this._enemySpawner = new EnemySpawner(this.rng);

    // Restore saved floor or generate a fresh one.
    if (this._pendingFloorRestore) {
      const floorState = this._pendingFloorRestore;
      this._pendingFloorRestore = null;
      if (this.floorManager.isTown()) {
        // Town NPCs have non-serialisable contextual-line functions, and shop
        // door textures require the shops metadata array — regenerate the town
        // fresh and restore only the player's saved position within it.
        this._buildFloor(this.floorManager.generateFloor());
        this.player.x = floorState.playerX;
        this.player.y = floorState.playerY;
        this.playerSprite.setPosition(
          floorState.playerX * TILE_SIZE + TILE_SIZE / 2,
          floorState.playerY * TILE_SIZE + TILE_SIZE / 2,
        );
        this._updateFOV();
      } else {
        this._restoreFloor(floorState);
      }
    } else {
      this._buildFloor(this.floorManager.generateFloor());
    }

    // Input
    this._runController  = new RunMovementController();
    this._runStartItems  = new Set();
    this._inputHandler.setup();



    // Look cursor — keyboard-driven cell inspector for non-touch devices.
    this._lookCursor = new LookCursor(this, this.dungeonMap, TILE_SIZE);

    // Cross-scene events
    this._setupEvents();

    // Push initial state to registry for UIScene
    this._syncRegistry();
  }

  // ─── Floor Construction ───────────────────────────────────────────────────

  _buildFloor(dungeonData) {
    const { map, rooms, startPos, shops, npcs: npcDefs } = dungeonData;
    this._hiddenPassages = dungeonData.hiddenPassages ?? [];
    this._hiddenPassageDraftShown = new Set();
    /** True when the current floor is a challenge floor (every 5th dungeon floor). */
    this._isChallengeFloor = dungeonData.isChallenge ?? false;
    this.dungeonMap = map;
    this.rooms = rooms;
    // shops is populated by TownGenerator; regular dungeon floors have none.
    // Each shop gets a generated stock of items to sell, keyed by player level.
    this.shops = (shops ?? []).map(s => ({
      ...s,
      stock: generateShopItems(s.type, this.player.stats.level, this.rng),
    }));

    // Reset per-floor unique room entry tracking.
    this._entryTracker.reset();

    // Clear old sprites
    this._clearFloorEntities();

    // Build Phaser tilemap
    this._floorBuilder.buildTilemap(map);

    // Spawn player
    this.player.x = startPos.x;
    this.player.y = startPos.y;

    if (!this.playerSprite) {
      this.playerSprite = this.add.sprite(
        startPos.x * TILE_SIZE + TILE_SIZE / 2,
        startPos.y * TILE_SIZE + TILE_SIZE / 2,
        tilesetManager.getTileKey('entity_player')
      ).setDepth(10);
      this.player.sprite = this.playerSprite;
    } else {
      this.playerSprite.setPosition(
        startPos.x * TILE_SIZE + TILE_SIZE / 2,
        startPos.y * TILE_SIZE + TILE_SIZE / 2
      );
    }

    // Camera — zoom is already set in create() from TilesetManager
    const mapW = map.width * TILE_SIZE;
    const mapH = map.height * TILE_SIZE;
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

    // Challenge floors use a dedicated arena spawner instead of the normal
    // room-by-room spawner.  The entry room (rooms[0]) is left empty so the
    // player can safely land and assess the situation.  The arena room (rooms[1])
    // is filled with enemies including at least one champion.
    if (this._isChallengeFloor) {
      this._floorBuilder.spawnChallengeArena(rooms[1], this.floorManager.currentFloor);
    } else {
      // Spawn enemies (skip start room)
      this._floorBuilder.spawnEnemies(rooms);

      // Boss spawning: dev override takes priority over normal floor logic
      if (devOptions.bossQuantities !== null) {
        this._floorBuilder.spawnDevBosses(rooms, devOptions.bossQuantities);
      } else {
        this._floorBuilder.trySpawnOldBones(rooms);
      }

      // Champion spawning: dev override places specific champion types at room centres
      if (devOptions.championQuantities !== null) {
        this._floorBuilder.spawnDevChampions(rooms, devOptions.championQuantities);
      }
    }

    // Spawn items
    this._floorBuilder.spawnItems(rooms);
    this._floorBuilder.spawnHiddenRoomItems(this._hiddenPassages);

    // Unique room: only on regular (non-challenge, non-town) dungeon floors.
    if (!this._isChallengeFloor && !this.floorManager.isTown()) {
      this._floorBuilder.trySpawnUniqueRoom(rooms);
    }

    // Spawn NPCs (town only — npcDefs is populated by TownGenerator)
    this._floorBuilder.spawnNpcs(npcDefs ?? []);

    // Update FOV
    this._updateFOV();
  }

  /**
   * Reconstructs a dungeon floor from a serialised floor state produced by
   * serializeFloor(), bypassing procedural generation entirely.
   *
   * @param {object} floorState - Plain object produced by serializeFloor().
   */
  _restoreFloor(floorState) {
    this._isChallengeFloor = false;
    this.rooms = [];
    this.shops = [];
    this._entryTracker.reset();
    this._hiddenPassages = [];
    this._hiddenPassageDraftShown = new Set();

    // Reconstruct the DungeonMap from saved tile data
    const map = new DungeonMap(floorState.width, floorState.height);
    for (let i = 0; i < floorState.tiles.length; i++) {
      map.tiles[i] = floorState.tiles[i];
    }
    // Restore explored state so previously revealed tiles remain visible on reload.
    // Guard for backward compat with saves that predate fovState serialization.
    if (floorState.fovState) {
      for (let i = 0; i < floorState.fovState.length; i++) {
        map.fovState[i] = floorState.fovState[i];
      }
    }
    this.dungeonMap = map;

    this._clearFloorEntities();
    this._floorBuilder.buildTilemap(map);

    // Restore player position
    this.player.x = floorState.playerX;
    this.player.y = floorState.playerY;

    if (!this.playerSprite) {
      this.playerSprite = this.add.sprite(
        floorState.playerX * TILE_SIZE + TILE_SIZE / 2,
        floorState.playerY * TILE_SIZE + TILE_SIZE / 2,
        tilesetManager.getTileKey('entity_player'),
      ).setDepth(10);
      this.player.sprite = this.playerSprite;
    } else {
      this.playerSprite.setPosition(
        floorState.playerX * TILE_SIZE + TILE_SIZE / 2,
        floorState.playerY * TILE_SIZE + TILE_SIZE / 2,
      );
    }

    // Camera
    const mapW = map.width * TILE_SIZE;
    const mapH = map.height * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.playerSprite, true, 0.12, 0.12);

    // Restore enemies
    const findTypeDef = id => Object.values(ITEM_TYPES).find(t => t.id === id);
    for (const saved of floorState.enemies) {
      if (saved.type === 'creeping_mass') {
        const mass = new CreepingMass(saved.segments.map(s => ({ x: s.x, y: s.y })));
        mass.stats.hp    = saved.hp;
        mass.stats.maxHp = saved.maxHp;
        for (const seg of mass.segments) {
          const sprite = this.add.sprite(
            seg.x * TILE_SIZE + TILE_SIZE / 2,
            seg.y * TILE_SIZE + TILE_SIZE / 2,
            tilesetManager.getTileKey(mass.textureKey),
          ).setDepth(8).setVisible(false);
          seg.sprite = sprite;
        }
        mass.sprite = mass.segments[0].sprite;
        this.enemies.push(mass);
        for (const seg of mass.segments) this.dungeonMap.setEntity(seg.x, seg.y, mass);
      } else if (saved.isBoss) {
        const boss = new OldBones(saved.x, saved.y, this.rng);
        boss.stats.hp         = saved.hp;
        boss.stats.maxHp      = saved.maxHp;
        boss.stats.attack     = saved.attack;
        boss.stats.defense    = saved.defense;
        boss.xp               = saved.xp;
        boss.minionsSpawned   = saved.minionsSpawned ?? false;
        if (saved.dropItemId) {
          const typeDef = findTypeDef(saved.dropItemId);
          if (typeDef) boss.dropItem = new Item(saved.x, saved.y, typeDef);
        }
        const sprite = this.add.sprite(
          saved.x * TILE_SIZE + TILE_SIZE / 2,
          saved.y * TILE_SIZE + TILE_SIZE / 2,
          tilesetManager.getTileKey(boss.textureKey),
        ).setDepth(8).setVisible(false);
        boss.sprite = sprite;
        this._createHealthBar(boss);
        this.enemies.push(boss);
        this.dungeonMap.setEntity(saved.x, saved.y, boss);
      } else if (saved.isChampion) {
        const champ = new Champion(saved.x, saved.y, saved.type, this.floorManager.currentFloor, this.rng);
        champ.stats.hp      = saved.hp;
        champ.stats.maxHp   = saved.maxHp;
        champ.stats.attack  = saved.attack;
        champ.stats.defense = saved.defense;
        champ.xp            = saved.xp;
        if (saved.dropItemId) {
          const typeDef = findTypeDef(saved.dropItemId);
          if (typeDef) champ.dropItem = new Item(saved.x, saved.y, typeDef);
        }
        const sprite = this.add.sprite(
          saved.x * TILE_SIZE + TILE_SIZE / 2,
          saved.y * TILE_SIZE + TILE_SIZE / 2,
          tilesetManager.getTileKey(champ.textureKey),
        ).setDepth(8).setVisible(false).setScale(CHAMPION_SCALE).setTint(CHAMPION_TINT);
        champ.sprite = sprite;
        this._createHealthBar(champ);
        this.enemies.push(champ);
        this.dungeonMap.setEntity(saved.x, saved.y, champ);
      } else {
        const enemy = new Enemy(saved.x, saved.y, saved.type);
        enemy.stats.hp      = saved.hp;
        enemy.stats.maxHp   = saved.maxHp;
        enemy.stats.attack  = saved.attack;
        enemy.stats.defense = saved.defense;
        enemy.xp            = saved.xp;
        const sprite = this.add.sprite(
          saved.x * TILE_SIZE + TILE_SIZE / 2,
          saved.y * TILE_SIZE + TILE_SIZE / 2,
          tilesetManager.getTileKey(enemy.textureKey),
        ).setDepth(8).setVisible(false);
        enemy.sprite = sprite;
        this._createHealthBar(enemy);
        this.enemies.push(enemy);
        this.dungeonMap.setEntity(saved.x, saved.y, enemy);
      }
    }

    // Restore floor items
    for (const saved of floorState.items) {
      const typeDef = findTypeDef(saved.id);
      if (!typeDef) continue;
      const item = new Item(saved.x, saved.y, typeDef);
      item.count = saved.count ?? 1;
      const sprite = this.add.sprite(
        saved.x * TILE_SIZE + TILE_SIZE / 2,
        saved.y * TILE_SIZE + TILE_SIZE / 2,
        tilesetManager.getTileKey(item.textureKey),
      ).setDepth(6).setVisible(false);
      item.sprite = sprite;
      this.items.push(item);
    }

    this._updateFOV();
  }

  _clearFloorEntities() {
    for (const e of this.enemies) {
      if (e.segments) {
        // Multi-segment enemy: destroy every segment sprite
        for (const seg of e.segments) {
          if (seg.sprite) seg.sprite.destroy();
        }
      } else if (e.sprite) {
        if (e.healthBar) { e.healthBar.destroy(); e.healthBar = null; }
        e.sprite.destroy();
      }
    }
    this.enemies = [];

    for (const npc of this.npcs) {
      if (npc.sprite) npc.sprite.destroy();
    }
    this.npcs = [];
    this._npcRoamControllers = [];

    for (const item of this.items) {
      if (item.sprite) item.sprite.destroy();
    }
    this.items = [];

    if (this.mapRT) { this.mapRT.destroy(); this.mapRT = null; }
    if (this.shadowGraphics) { this.shadowGraphics.destroy(); this.shadowGraphics = null; }
  }



  _redrawShadows() { this._fovHandler.redrawShadows(); }



  /**
   * Spawns a single enemy entity at the given tile coordinates.
   *
   * @param {number} x
   * @param {number} y
   * @param {string} type    - Enemy type key from ENEMY_DEFS.
   * @param {object} [options]
   * @param {boolean} [options.isChampion=false] - When true, spawns a Champion variant.
   */
  _spawnEnemy(x, y, type, options = {}) {
    if (type === 'creeping_mass') {
      this._spawnCreepingMass(x, y);
      return;
    }

    let enemy;
    if (type === 'old_bones') {
      // Old Bones must be constructed as OldBones (not plain Enemy) so that boss
      // properties — isBoss, minionsSpawned, dropGold, dropItem — are present.
      enemy = new OldBones(x, y, this.rng);
    } else if (options.isChampion) {
      // Champion variant: enhanced stats, more XP, and an item drop.
      enemy = new Champion(x, y, type, this.floorManager.currentFloor, this.rng);
    } else {
      enemy = new Enemy(x, y, type);
    }

    // Scale HP and ATK by the active difficulty (bosses are exempt; champions are
    // not — difficulty scaling is applied on top of their champion stat boost so
    // they remain proportionally tougher than normal enemies at every difficulty).
    if (!enemy.isBoss) {
      const { enemyHp, enemyAtk } = difficultyManager.getConfig();
      enemy.stats.hp    = Math.max(1, Math.round(enemy.stats.hp    * enemyHp));
      enemy.stats.maxHp = Math.max(1, Math.round(enemy.stats.maxHp * enemyHp));
      enemy.stats.attack = Math.max(1, Math.round(enemy.stats.attack * enemyAtk));
    }

    const sprite = this.add.sprite(
      x * TILE_SIZE + TILE_SIZE / 2,
      y * TILE_SIZE + TILE_SIZE / 2,
      tilesetManager.getTileKey(enemy.textureKey)
    ).setDepth(8).setVisible(false);

    // Champions are rendered larger and with a gold tint to stand out.
    if (enemy.isChampion) {
      sprite.setScale(CHAMPION_SCALE);
      sprite.setTint(CHAMPION_TINT);
    }

    enemy.sprite = sprite;
    this._createHealthBar(enemy);
    this.enemies.push(enemy);
    this.dungeonMap.setEntity(x, y, enemy);

    // Emit the boss hint after a short delay so the UIScene's message log is
    // guaranteed to be listening (messages emitted synchronously during scene
    // creation are dropped before the subscriber is registered).
    if (type === 'old_bones') {
      this.time.delayedCall(200, () => {
        EventBus.emit(GameEvents.MESSAGE, 'An eerie silence hangs over this level… something powerful stirs in the dark.');
      });
    }
  }

  /**
   * Spawns a Creeping Mass with 3–5 connected segments anchored at (anchorX, anchorY).
   * Each segment gets its own sprite; all segment tiles are registered in the entity map.
   *
   * @param {number} anchorX
   * @param {number} anchorY
   */
  _spawnCreepingMass(anchorX, anchorY) {
    const def = ENEMY_DEFS.creeping_mass;
    const segCount = this.rng.nextInt(def.segmentMin, def.segmentMax);
    const segments = this._buildMassSegments(anchorX, anchorY, segCount);
    const mass = new CreepingMass(segments);

    // Create a sprite for every segment
    for (const seg of mass.segments) {
      const sprite = this.add.sprite(
        seg.x * TILE_SIZE + TILE_SIZE / 2,
        seg.y * TILE_SIZE + TILE_SIZE / 2,
        tilesetManager.getTileKey(mass.textureKey),
      ).setDepth(8).setVisible(false);
      seg.sprite = sprite;
    }
    // Head sprite reference used by single-sprite systems (flash, bump direction)
    mass.sprite = mass.segments[0].sprite;

    this.enemies.push(mass);
    for (const seg of mass.segments) {
      this.dungeonMap.setEntity(seg.x, seg.y, mass);
    }
  }

  /**
   * Grows a connected list of segment positions starting at (anchorX, anchorY)
   * by repeatedly expanding to free adjacent walkable tiles.
   *
   * @param {number} anchorX
   * @param {number} anchorY
   * @param {number} count - Target number of segments.
   * @returns {Array<{x:number,y:number}>}
   */
  _buildMassSegments(anchorX, anchorY, count) {
    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
    const placed = [{ x: anchorX, y: anchorY }];

    for (let i = 1; i < count; i++) {
      const parent = this.rng.pick(placed);
      let expanded = false;
      for (const { dx, dy } of dirs) {
        const nx = parent.x + dx;
        const ny = parent.y + dy;
        if (
          this.dungeonMap.isWalkable(nx, ny) &&
          !this._getEntityAt(nx, ny) &&
          !placed.some(s => s.x === nx && s.y === ny)
        ) {
          placed.push({ x: nx, y: ny });
          expanded = true;
          break;
        }
      }
      if (!expanded) break; // No room to expand; spawn with fewer segments
    }

    return placed;
  }



  /**
   * Processes one turn of roaming for a single NPC.  If the controller returns
   * a move action the NPC's logical position is updated, the entity map is
   * patched, and the sprite is repositioned instantly (no tween — NPCs move
   * infrequently and a snap avoids interfering with the player's move tween).
   *
   * @param {NpcRoamController} roamer
   */
  _tickNpcRoam(roamer) {
    const result = roamer.tick(this.dungeonMap, (x, y) => this._getEntityAt(x, y));
    if (result.action !== 'move') return;

    const npc = roamer.npc;
    const destTile = this.dungeonMap.getTile(npc.x + result.dx, npc.y + result.dy);
    // Never roam onto a shop door tile — the player must be able to enter shops freely.
    if (destTile === TILE.DOOR) return;

    this.dungeonMap.setEntity(npc.x, npc.y, null);
    npc.x += result.dx;
    npc.y += result.dy;
    this.dungeonMap.setEntity(npc.x, npc.y, npc);
    if (npc.sprite) {
      npc.sprite.setPosition(
        npc.x * TILE_SIZE + TILE_SIZE / 2,
        npc.y * TILE_SIZE + TILE_SIZE / 2,
      );
    }
  }

  // ─── FOV ─────────────────────────────────────────────────────────────────

  _updateFOV() { this._fovHandler.updateFOV(); }

  // ─── Input ────────────────────────────────────────────────────────────────

  _setupEvents() {
    // Input-routing (D-pad, mobile menu, UI buttons) is handled by InputHandler.
    this._inputHandler.setupEvents();

    EventBus.on(GameEvents.UPGRADE_SKILL,   ({ skillId }) => this._handleUpgradeSkill(skillId),   this);
    EventBus.on(GameEvents.DOWNGRADE_SKILL, ({ skillId }) => this._handleDowngradeSkill(skillId), this);
    EventBus.on(GameEvents.ACTIVATE_SKILL,  ({ skillId }) => this._handleActivateSkill(skillId),  this);
    EventBus.on(GameEvents.INVENTORY_USE,  (index) => this._useInventoryItem(index),  this);
    EventBus.on(GameEvents.INVENTORY_DROP, (index) => this._dropInventoryItem(index), this);
    EventBus.on(GameEvents.SELL_ITEM, ({ shopType, item }) => this._handleSellItem(shopType, item), this);
    EventBus.on(GameEvents.BUY_ITEM, ({ shopType, shopItem }) => this._handleBuyItem(shopType, shopItem), this);
    EventBus.on(GameEvents.STORE_ITEM, ({ index }) => this._handleStoreItem(index), this);
    EventBus.on(GameEvents.RETRIEVE_ITEM, ({ index }) => this._handleRetrieveItem(index), this);
    EventBus.on(GameEvents.DEV_GIVE_ITEM, (key) => this._handleDevGiveItem(key), this);
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

  _handleDir(dir) { this._playerAction.handleDir(dir); }

  // ─── Ranged aim mode ──────────────────────────────────────────────────────

  /**
   * Sets the ranged-aim state and broadcasts RANGED_AIM_MODE_CHANGED.
   *
   * @param {boolean} active - True to enter aim mode, false to leave it.
   */
  _setAimingRanged(active) { this._playerAction.setAimingRanged(active); }

  /**
   * Toggles ranged-aim mode on or off.
   * If the player has no ranged weapon equipped, a message is shown and aim
   * mode is not entered.
   */
  _handleToggleRangedAim() { this._playerAction.handleToggleRangedAim(); }

  /**
   * Fires the player's equipped ranged weapon in the given direction.
   * Cancels aim mode whether or not a target is found.
   *
   * @param {number} dx - Horizontal direction (-1, 0, or 1).
   * @param {number} dy - Vertical direction (-1, 0, or 1).
   */
  _doRangedAttack(dx, dy) { this._playerAction.doRangedAttack(dx, dy); }

  /**
   * Animates a small projectile dot from one tile centre to another, then
   * calls `onComplete` after it arrives.  The travel time scales with pixel
   * distance so every shot moves at the same apparent speed.
   *
   * @param {number}   fromTileX  - Source tile X.
   * @param {number}   fromTileY  - Source tile Y.
   * @param {number}   toTileX    - Destination tile X.
   * @param {number}   toTileY    - Destination tile Y.
   * @param {function} onComplete - Called once the projectile reaches its target.
   * @param {number}   [color=0xffdd44] - Phaser hex colour for the projectile dot.
   */
  _animateProjectile(fromTileX, fromTileY, toTileX, toTileY, onComplete, color = 0xffdd44) {
    const half = TILE_SIZE / 2;
    const sx = fromTileX * TILE_SIZE + half;
    const sy = fromTileY * TILE_SIZE + half;
    const tx = toTileX  * TILE_SIZE + half;
    const ty = toTileY  * TILE_SIZE + half;

    // Draw a small coloured circle — size scales with tile size for all three tilesets.
    const radius = Math.max(2, Math.round(TILE_SIZE * 0.15));
    const projectile = this.add.graphics()
      .fillStyle(color, 1)
      .fillCircle(0, 0, radius)
      .setPosition(sx, sy)
      .setDepth(12); // above map (0), shadows (5), entities (8), player (10)

    // 500 px/s gives ~192 ms for max range (6 tiles) at 16 px/tile, fast but readable.
    const PROJECTILE_PX_PER_MS = 0.5;
    const dist = Math.hypot(tx - sx, ty - sy);
    const duration = Math.max(60, dist / PROJECTILE_PX_PER_MS);

    this.tweens.add({
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
  _continueRun() { this._playerAction.continueRun(); }

  /**
   * Returns true if any enemy occupies a tile currently visible in the FOV.
   *
   * @returns {boolean}
   */
  _anyEnemyVisible() { return this._playerAction.anyEnemyVisible(); }

  /**
   * Returns true if any item that was not visible when the current run started
   * is now visible in the FOV.  Items already visible at run-start are ignored
   * so the player is not interrupted by loot they have already seen.
   *
   * @returns {boolean}
   */
  _anyNewItemVisible() { return this._playerAction.anyNewItemVisible(); }

  // ─── Player Actions ───────────────────────────────────────────────────────

  _doPlayerMove(dx, dy) { this._playerAction.doPlayerMove(dx, dy); }

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

  _afterPlayerMove(action) { this._playerAction.afterPlayerMove(action); }

  /**
   * Scans HIDDEN_PASSAGE_WALL tiles on the current floor and emits the
   * "draft" hint the first time the player walks within DRAFT_RADIUS tiles
   * of one.  Deduplication is handled by _hiddenPassageDraftShown.
   */
  _checkHiddenPassageDraft() { this._playerAction.checkHiddenPassageDraft(); }

  _playerAttack(target) { this._playerAction.playerAttack(target); }

  /**
   * Cleans up any segments removed from a multi-tile enemy during damage
   * resolution (e.g. Creeping Mass losing segments proportional to HP loss).
   * Clears the entity map tiles and fades out the segment sprites.
   *
   * @param {object} enemy
   */
  _applyPendingRemovedSegments(enemy) { this._combatHandler.applyPendingRemovedSegments(enemy); }

  /**
   * Removes an enemy from the scene, clearing all of its dungeon-map tiles and
   * destroying all associated sprites.  Handles both single-tile and multi-segment
   * enemies (e.g. Creeping Mass).
   *
   * @param {object} target - The enemy entity to remove.
   */
  _destroyEnemy(target) { this._combatHandler.destroyEnemy(target); }

  /**
   * Spawns up to `boss.maxMinions` minions of `boss.minionType` adjacent to
   * the boss on its first hit.  Marks `minionsSpawned` so this only triggers
   * once per encounter.
   *
   * @param {object} boss
   */
  _spawnBossMinions(boss) { this._combatHandler.spawnBossMinions(boss); }

  /**
   * Flashes `sprite` with `color` for 150 ms, then restores the champion gold
   * tint if the entity is a champion, or clears the tint entirely otherwise.
   *
   * @param {Phaser.GameObjects.Sprite} sprite
   * @param {number} color       - Hex color integer for the flash.
   * @param {object} [entity]    - The owning enemy entity; used to restore tint.
   */
  _flashSprite(sprite, color, entity = null) {
    if (!sprite) return;
    sprite.setTint(color);
    this.time.delayedCall(150, () => {
      if (entity?.isChampion) {
        sprite.setTint(CHAMPION_TINT);
      } else {
        sprite.clearTint();
      }
    });
  }

  /**
   * Creates a thin health-bar Graphics object above the enemy's sprite and
   * stores it as `enemy.healthBar`.  Initially drawn at full health.
   * Should be called immediately after the enemy sprite is created.
   *
   * The bar is only shown when the enemy has taken damage (hp < maxHp)
   * and is within the player's field of view.
   *
   * @param {Enemy} enemy
   */
  _createHealthBar(enemy) {
    const barW = TILE_SIZE - 4;
    const barH = Math.max(2, Math.round(TILE_SIZE * 0.1));
    const bar = this.add.graphics()
      .setDepth(9)       // just above entity sprites (depth 8)
      .setScrollFactor(1)
      .setVisible(false); // hidden until damaged
    enemy.healthBar = bar;
    // Draw the initial (full-health) state so dimensions are established.
    this._updateHealthBar(enemy);
  }

  /**
   * Redraws `enemy.healthBar` to reflect the enemy's current HP fraction.
   * Shows the bar only when hp < maxHp and hides it at full health.
   * Should be called after every attack that damages the enemy.
   *
   * @param {Enemy} enemy
   */
  _updateHealthBar(enemy) {
    const bar = enemy.healthBar;
    if (!bar) return;

    const fraction = enemy.healthBarFraction;
    const barW = TILE_SIZE - 4;
    const barH = Math.max(2, Math.round(TILE_SIZE * 0.1));

    // Position: centred horizontally above the sprite's top edge.
    const cx = enemy.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = enemy.y * TILE_SIZE + 1; // 1 px below the top of the tile

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

  _checkItemPickup() { this._playerAction.checkItemPickup(); }

  _showStairsPrompt() { this._playerAction.showStairsPrompt(); }

  /**
   * Shows a message when the player steps onto up-stairs.
   */
  _showStairsUpPrompt() { this._playerAction.showStairsUpPrompt(); }

  /**
   * Shows a message when the player steps onto the recall portal.
   */
  _showRecallPortalPrompt() { this._playerAction.showRecallPortalPrompt(); }

  /**
   * Teleports the player directly to town after using a Home Seeking Scroll.
   * Saves a DungeonSnapshot so the player can return via the RECALL_PORTAL tile.
   * Can only be called when a snapshot has already been stored by _useInventoryItem.
   */
  _teleportToTown() { this._playerAction.teleportToTown(); }

  /**
   * Places a RECALL_PORTAL tile in the town map, just south of the stairs accent ring.
   * Draws the portal graphic onto the existing map RenderTexture.
   */
  _placeRecallPortal() { this._playerAction.placeRecallPortal(); }

  /**
   * Restores a dungeon floor from a previously saved DungeonSnapshot.
   * Re-creates enemy and item sprites, places the player at the return position,
   * and removes the snapshot so the portal can only be used once.
   */
  _returnFromSnapshot() { this._playerAction.returnFromSnapshot(); }

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
   * Opens the Achievements screen as an overlay.
   * Called by InGameMenuScene when the player selects "ACHIEVEMENTS".
   */
  _openAchievements() {
    this.scene.launch('AchievementsScene', { fromScene: 'GameScene' });
    this.scene.sleep('UIScene');
    this.scene.sleep('GameScene');
  }

  /**
   * Saves game state then returns to the main menu without deleting the save,
   * so the player can continue from this point later.
   */
  _handleSaveAndExit() { this._lifecycleHandler.handleSaveAndExit(); }

  /**
   * Gives the item identified by `key` directly to the player's inventory.
   * Emits a message log entry on success or failure.
   *
   * @param {string} key - An ITEM_TYPES key (e.g. 'SWORD').
   */
  _handleDevGiveItem(key) {
    if (!ITEM_TYPES[key]) {
      EventBus.emit(GameEvents.MESSAGE, `[DEV] Unknown item key: ${key}`);
      return;
    }
    const added = devGiveItem(this.player, key);
    if (added) {
      EventBus.emit(GameEvents.INVENTORY_CHANGED, [...this.player.inventory]);
      EventBus.emit(GameEvents.MESSAGE, `[DEV] Added ${ITEM_TYPES[key].name} to inventory.`);
    } else {
      EventBus.emit(GameEvents.MESSAGE, '[DEV] Could not add item — inventory is full.');
    }
  }

  /**
   * @param {object} saveData - Plain object returned by loadGame().
   */
  _applyLoadedSave(saveData) { this._lifecycleHandler.applyLoadedSave(saveData); }

  _tryUseStairs() { this._playerAction.tryUseStairs(); }

  _descend() { this._playerAction.descend(); }

  /**
   * Move the player back up one floor (to the town when on floor 1).
   * The player is placed at the stairsPos of the destination floor so they
   * land near the stairs they arrived from.
   */
  _ascend() { this._playerAction.ascend(); }

  _toggleInventory() {
    // Only emit the open/close event when a state transition is actually possible,
    // so the visual panel and TurnManager state can never get out of sync.
    // applyInventoryToggle only allows PLAYER_INPUT↔INVENTORY, so any other
    // active panel state (SHOP, SKILLS, …) is silently rejected.
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
  _handleAchievementSkillUnlock(achievementId) { this._skillEventHandler.handleAchievementSkillUnlock(achievementId); }

  /**
   * Removes the skill associated with a re-locked achievement from the player's
   * SkillSystem.  Mirrors _handleAchievementSkillUnlock — uses the same maps to
   * derive the skill id, then delegates to SkillSystem.removeSkill().
   * Only called via the dev-mode achievement toggle.
   *
   * @param {string} achievementId - The ID of the achievement that was reset.
   */
  _handleAchievementSkillLock(achievementId) { this._skillEventHandler.handleAchievementSkillLock(achievementId); }

  /**
   * Handles a request (from SkillsPanel in dev mode) to upgrade a named skill.
   * Upgrades the skill via SkillSystem and re-emits OPEN_SKILLS so the panel
   * refreshes in place without closing.
   *
   * @param {string} skillId - The ID of the skill to upgrade.
   */
  _handleUpgradeSkill(skillId) { this._skillEventHandler.handleUpgradeSkill(skillId); }

  /**
   * Handles a request (from SkillsPanel in dev mode) to downgrade a named skill.
   * Downgrades the skill via SkillSystem and re-emits OPEN_SKILLS so the panel
   * refreshes in place without closing.
   *
   * @param {string} skillId - The ID of the skill to downgrade.
   */
  _handleDowngradeSkill(skillId) { this._skillEventHandler.handleDowngradeSkill(skillId); }

  /**
   * Handles a request (from SkillsPanel in dev mode) to activate a named inactive skill.
   * Activates the skill via SkillSystem and re-emits OPEN_SKILLS so the panel refreshes.
   *
   * @param {string} skillId - The ID of the skill to activate.
   */
  _handleActivateSkill(skillId) { this._skillEventHandler.handleActivateSkill(skillId); }

  /**
   * Launches StatDistributionScene so the player can spend their new stat points.
   * StatDistributionScene chains to SkillLevelUpScene when finished if skill choices exist.
   * Sleeps GameScene and UIScene for the duration of both overlay scenes.
   */
  _tryLaunchSkillLevelUp() { this._playerAction.tryLaunchSkillLevelUp(); }

  /**
   * Builds the payload for the OPEN_SKILLS event, including each skill's
   * current stats, whether it can be upgraded/downgraded, and inactive skills.
   *
   * @returns {{ skills: object[], inactiveSkills: object[] }}
   */
  _buildSkillsPayload() { return this._skillEventHandler._buildSkillsPayload(); }

  /**
   * Uses the item at the given inventory index.  Passes a world-access context
   * so items with effects that need map or RNG access (e.g. teleport_near) can
   * resolve them inside `item.use()`.  If the player's position changed after
   * the call, the teleport side-effects (sprite snap, FOV update, enemy turns)
   * are applied and the inventory panel is closed.
   *
   * @param {number} index - Inventory slot to use.
   */
  _useInventoryItem(index) { this._playerAction.useInventoryItem(index); }

  /**
   * Handles INVENTORY_DROP: removes the item from the player's inventory and
   * places it as a floor item at the player's current position.
   *
   * @param {number} index - Zero-based inventory index to drop.
   */
  _dropInventoryItem(index) { this._playerAction.dropInventoryItem(index); }

  /**
   * Handles a sell request from the SellPanel.  Creates a ShopSystem for the
   * given shop type, executes the sale, then broadcasts the updated gold and
   * inventory so the HUD and SellPanel stay in sync.
   *
   * @param {string} shopType - 'potion', 'weapon', or 'armour'.
   * @param {Item} item - The item to sell (must be in player's inventory).
   */
  _handleSellItem(shopType, item) { this._shopEventHandler.handleSellItem(shopType, item); }

  /**
   * Handles a buy request from the BuyPanel.  Validates the purchase via
   * ShopSystem.buy(), removes the item from the shop's stock, and broadcasts
   * updated gold and inventory so the HUD, BuyPanel, and SellPanel stay in sync.
   *
   * @param {string} shopType - 'potion', 'weapon', or 'armour'.
   * @param {{item: import('../items/Item.js').Item, buyPrice: number}} shopItem
   */
  _handleBuyItem(shopType, shopItem) { this._shopEventHandler.handleBuyItem(shopType, shopItem); }

  // ─── Display Case ────────────────────────────────────────────────────────

  /**
   * Moves the inventory item at `index` into the player's display case.
   * Only unique items can be stored; non-unique items are silently ignored.
   *
   * @param {number} index - Zero-based index into the player's inventory.
   */
  _handleStoreItem(index) { this._shopEventHandler.handleStoreItem(index); }

  /**
   * Retrieves the display case item at `index` into the player's inventory.
   * Fails gracefully if the inventory is full.
   *
   * @param {number} index - Zero-based index into the display case items.
   */
  _handleRetrieveItem(index) { this._shopEventHandler.handleRetrieveItem(index); }

  // ─── Enemy Turns ──────────────────────────────────────────────────────────

  _startEnemyTurns() { this._combatHandler.startEnemyTurns(); }

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
  _beginPlayerTurn() { this._playerAction.beginPlayerTurn(); }

  // ─── Entity Lookup ────────────────────────────────────────────────────────

  _getEntityAt(x, y) {
    if (this.player && this.player.x === x && this.player.y === y) return this.player;
    // Support multi-segment enemies (e.g. Creeping Mass) by also checking their
    // segments array, so all occupied tiles resolve to the same entity object.
    return this.enemies.find(
      e => (e.x === x && e.y === y) ||
           (e.segments && e.segments.some(s => s.x === x && s.y === y)),
    ) || this.npcs.find(n => n.x === x && n.y === y) || null;
  }




  /**
   * Shows the LookPanel for the given tile coordinates.
   * Priority: enemy > NPC > floor item > tile label.
   *
   * @param {number} tx - Tile x.
   * @param {number} ty - Tile y.
   */
  _showLookInfoAt(tx, ty) {
    const entity = this._getEntityAt(tx, ty);
    if (entity && entity !== this.player) {
      if (entity.stats) {
        // Enemies have a stats object.
        EventBus.emit(GameEvents.LOOK_SHOW_ENEMY, entity);
      } else {
        // NPCs have a name but no stats; show their name as the tile label.
        EventBus.emit(GameEvents.LOOK_SHOW_TILE, entity.name);
      }
      return;
    }

    const item = this.items.find(i => i.x === tx && i.y === ty);
    if (item) {
      EventBus.emit(GameEvents.LOOK_SHOW_ITEM, item);
      return;
    }

    EventBus.emit(GameEvents.LOOK_SHOW_TILE, this.dungeonMap.getTile(tx, ty));
  }

  // ─── Game Over ────────────────────────────────────────────────────────────

  _gameOver()        { this._lifecycleHandler.gameOver(); }
  _resurrect()       { this._lifecycleHandler.resurrect(); }
  _restart()         { this._lifecycleHandler.restart(); }

  // ─── Registry Sync ───────────────────────────────────────────────────────

  _syncRegistry() {
    const s = this.player.stats;
    this.registry.set('playerHP', s.hp);
    this.registry.set('playerMaxHp', s.maxHp);
    // Include equipment bonuses so the HUD shows effective ATK/DEF, not base values.
    this.registry.set('playerStats', { ...s, attack: this.player.attackPower, defense: this.player.defensePower });
    this.registry.set('floor', this.floorManager.currentFloor);
    this.registry.set('inventory', [...this.player.inventory]);
    this.registry.set('playerGold', this.player.gold);
    this.registry.set('runStats', this.player.runStats);
  }
}
