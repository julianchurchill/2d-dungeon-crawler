import Phaser from 'phaser';
import { FloorManager } from '../systems/FloorManager.js';
import { TurnManager, TURN_STATE } from '../systems/TurnManager.js';
import { resolveMeleeAttack } from '../systems/CombatSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { Player } from '../entities/Player.js';
import { Enemy, getHealthBarColor } from '../entities/Enemy.js';
import { Champion } from '../entities/Champion.js';
import { CreepingMass } from '../entities/CreepingMass.js';
import { OldBones } from '../entities/OldBones.js';
import { Npc } from '../entities/Npc.js';
import { Item } from '../items/Item.js';
import { getFloorLoot, getChallengeLoot } from '../items/ItemTypes.js';
import { DungeonMap } from '../dungeon/DungeonMap.js';
import { AlcoveCarver } from '../dungeon/AlcoveCarver.js';
import { UNIQUE_ROOM_DEFS } from '../dungeon/UniqueRoomDefinitions.js';
import { uniqueRoomRegistry } from '../dungeon/UniqueRoomRegistry.js';
import { placeDecorations } from '../dungeon/RoomDecorationPlacer.js';
import { isInnerRoomSpaceAvailable } from '../dungeon/LockedRoomPlacer.js';
import { startFloorTransition } from '../systems/FloorTransition.js';
import { DungeonSnapshot } from '../dungeon/DungeonSnapshot.js';
import { UniqueRoomEntryTracker } from '../dungeon/UniqueRoomEntryTracker.js';
import { computeFOV, computeDaylightFOV } from '../fov/ShadowcastFOV.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { DIR, DIR_DELTA } from '../utils/Direction.js';
import { TILE, FOV_STATE } from '../utils/TileTypes.js';
import { createRNG } from '../utils/RNG.js';
import { HeldMovementTracker } from '../systems/HeldMovementTracker.js';
import { HoldRepeatScheduler } from '../systems/HoldRepeatScheduler.js';
import { tilesetManager } from '../systems/TilesetManager.js';
import { RunMovementController } from '../systems/RunMovementController.js';
import { applyToGame, devOptions } from '../systems/DevOptions.js';
import { EnemySpawner, DEFAULT_CHAMPION_CHANCE } from '../systems/EnemySpawner.js';
import { ENEMY_DEFS, getSpawnTable } from '../entities/EnemyTypes.js';
import { AchievementSystem } from '../achievements/AchievementSystem.js';
import { handleMobileMenuPress } from '../systems/MobileMenuHandler.js';
import { wrapWithRunCancel } from '../utils/ActionWrapper.js';
import { applyInventoryToggle } from '../systems/InventoryToggle.js';
import { applySkillsToggle } from '../systems/SkillsToggle.js';
import { difficultyManager } from '../systems/DifficultyManager.js';
import { applyEscPanelClose } from '../systems/EscPanelClose.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { LuckyStrikeSkill } from '../skills/LuckyStrikeSkill.js';
import { FerocitySkill } from '../skills/FerocitySkill.js';
import { DodgeSkill } from '../skills/DodgeSkill.js';
import { HuntingSkill } from '../skills/HuntingSkill.js';
import { NightVisionSkill } from '../skills/NightVisionSkill.js';
import { ITEM_TYPES } from '../items/ItemTypes.js';
import { getProgress, achievementStore, resetAchievementStore } from '../achievements/AchievementStore.js';
import { ShopSystem } from '../systems/ShopSystem.js';
import { generateShopItems } from '../items/ShopInventory.js';
import { isTouchDevice } from '../utils/TouchDeviceDetector.js';
import { NpcRoamController } from '../systems/NpcRoamController.js';
import { LookCursor } from '../ui/LookCursor.js';
import { findRangedTarget, resolveRangedAttack } from '../systems/RangedCombat.js';
import { saveGame, serializeFloor, loadGame, hasSave, deleteSave } from '../save/SaveGame.js';
import { createSkillFromData } from '../save/SkillFactory.js';
import { AutosaveTimer } from '../save/AutosaveTimer.js';

// TILE_SIZE is initialised from TilesetManager in GameScene.create() so it
// reflects the active tileset (16 for Classic/Modern, 32 for HD) each time
// the scene starts.  Declared as let so the module-level references below
// stay simple while still being writable at create-time.
let TILE_SIZE = 16;
const FOV_RADIUS = 8;
/** Gold tint applied to champion sprites to distinguish them from normal enemies. */
const CHAMPION_TINT  = 0xffaa00;
/** Scale factor applied to champion sprites to make them visibly larger. */
const CHAMPION_SCALE = 1.35;
const MOVE_DURATION = 80;
// Additional delay after the move animation before auto-repeat fires.
// Total repeat interval ≈ MOVE_DURATION + MOVE_REPEAT_DELAY_MS (~150 ms).
const MOVE_REPEAT_DELAY_MS = 70;

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
    this._setupInput();



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
    this._buildTilemap(map);

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
      this._spawnChallengeArena(rooms[1], this.floorManager.currentFloor);
    } else {
      // Spawn enemies (skip start room)
      this._spawnEnemies(rooms);

      // Boss spawning: dev override takes priority over normal floor logic
      if (devOptions.bossQuantities !== null) {
        this._spawnDevBosses(rooms, devOptions.bossQuantities);
      } else {
        this._trySpawnOldBones(rooms);
      }

      // Champion spawning: dev override places specific champion types at room centres
      if (devOptions.championQuantities !== null) {
        this._spawnDevChampions(rooms, devOptions.championQuantities);
      }
    }

    // Spawn items
    this._spawnItems(rooms);

    // Unique room: only on regular (non-challenge, non-town) dungeon floors.
    if (!this._isChallengeFloor && !this.floorManager.isTown()) {
      this._trySpawnUniqueRoom(rooms);
    }

    // Spawn NPCs (town only — npcDefs is populated by TownGenerator)
    this._spawnNpcs(npcDefs ?? []);

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
    this._buildTilemap(map);

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

    // Resolve tile texture keys through the tileset manager so the active
    // tileset prefix ('classic_' or 'modern_') is applied automatically.
    const tk = (base) => tilesetManager.getTileKey(base);

    const tileKeys = isTown ? {
      [TILE.FLOOR]:          tk('tile_town_floor'),
      [TILE.WALL]:           tk('tile_town_wall'),
      [TILE.DOOR]:           tk('tile_door'),
      [TILE.STAIRS_DOWN]:    tk('tile_town_stairs'),
      [TILE.TOWN_ACCENT]:    tk('tile_town_accent'),
      [TILE.SHOP_ROOF]:      tk('tile_shop_roof'),
      [TILE.HOME_DOOR]:      tk('tile_home_door'),
      [TILE.RECALL_PORTAL]:  tk('tile_recall_portal'),
    } : {
      [TILE.FLOOR]:          tk('tile_floor'),
      [TILE.WALL]:           tk('tile_wall'),
      [TILE.DOOR]:           tk('tile_door'),
      [TILE.STAIRS_DOWN]:    tk('tile_stairs'),
      [TILE.STAIRS_UP]:      tk('tile_stairs_up'),
      [TILE.TRASH_PILE_1]:   tk('tile_trash_pile_1'),
      [TILE.TRASH_PILE_2]:   tk('tile_trash_pile_2'),
      [TILE.TRASH_PILE_3]:   tk('tile_trash_pile_3'),
      [TILE.BREAKABLE_WALL]: tk('tile_breakable_wall'),
    };

    // Build position → texture-key overrides for typed shop doors (town only)
    const doorTextureAt = {};
    if (isTown) {
      for (const shop of shops) {
        doorTextureAt[`${shop.doorX},${shop.doorY}`] = tk(`tile_door_${shop.type}`);
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
      // Treat non-walkable tiles (e.g. pillar walls inside rooms) as occupied
      // so enemies are never placed on top of wall tiles.
      (x, y) => !this.dungeonMap.isWalkable(x, y) || this._getEntityAt(x, y),
      (x, y, type, options) => this._spawnEnemy(x, y, type, options),
    );
  }

  /**
   * Attempts to place the Old Bones boss on the current floor.
   * Conditions: floor 10–15, boss not yet defeated (achievement incomplete),
   * and a 50% random chance per floor visit.  Spawns in a random non-start room.
   *
   * @param {Array<{x:number,y:number,w:number,h:number}>} rooms
   */
  _trySpawnOldBones(rooms) {
    const floor = this.floorManager.currentFloor;
    if (floor < 10 || floor > 15) return;
    if (getProgress('old_bones_slayer', achievementStore).completed) return;
    if (!this.rng.nextBool(0.5)) return;

    // Pick a random non-start room (index 1+)
    const candidates = rooms.slice(1);
    if (candidates.length === 0) return;
    const room = this.rng.pick(candidates);

    // Place boss near room centre, avoiding occupied tiles
    const cx = Math.floor(room.x + room.w / 2);
    const cy = Math.floor(room.y + room.h / 2);
    if (this._getEntityAt(cx, cy)) return;

    // Delegate to _spawnEnemy so the hint message and boss construction are
    // handled in one place, regardless of whether the boss was placed here or
    // via the dev spawn-weight override.
    this._spawnEnemy(cx, cy, 'old_bones');
  }

  /**
   * Dev-only: spawns an exact number of each boss type specified in the
   * `bossQuantities` map, ignoring normal floor-range and achievement gates.
   * Bosses are placed at the centre of non-start rooms (first-fit order).
   *
   * @param {Array<{x:number,y:number,w:number,h:number}>} rooms
   * @param {Object.<string,number>} quantities - Map of boss type → total count.
   */
  _spawnDevBosses(rooms, quantities) {
    const candidates = rooms.slice(1);
    for (const [type, count] of Object.entries(quantities)) {
      let spawned = 0;
      for (const room of candidates) {
        if (spawned >= count) break;
        const cx = Math.floor(room.x + room.w / 2);
        const cy = Math.floor(room.y + room.h / 2);
        if (!this._getEntityAt(cx, cy)) {
          this._spawnEnemy(cx, cy, type);
          spawned++;
        }
      }
    }
  }

  /**
   * Dev-only: spawns an exact number of champion variants of each enemy type
   * specified in the `championQuantities` map.  Champions are placed at the
   * centre of non-start rooms (first-fit order).  This runs in addition to the
   * normal enemy spawner so that dev champions appear alongside regular enemies.
   *
   * @param {Array<{x:number,y:number,w:number,h:number}>} rooms
   * @param {Object.<string,number>} quantities - Map of enemy type → total champion count.
   */
  _spawnDevChampions(rooms, quantities) {
    const candidates = rooms.slice(1);
    for (const [type, count] of Object.entries(quantities)) {
      let spawned = 0;
      for (const room of candidates) {
        if (spawned >= count) break;
        const cx = Math.floor(room.x + room.w / 2);
        const cy = Math.floor(room.y + room.h / 2);
        if (!this._getEntityAt(cx, cy)) {
          this._spawnEnemy(cx, cy, type, { isChampion: true });
          spawned++;
        }
      }
    }
  }

  /**
   * Populates the challenge arena room with a large wave of enemies, including
   * at least one champion.  Enemy types and positions are chosen from the current
   * floor's spawn table.  Non-boss, non-solitary enemies are eligible.
   *
   * The arena is filled more densely than a normal room: a base of 8 enemies
   * scaled by the difficulty `enemyCount` multiplier, with at least 1 champion
   * guaranteed among them.
   *
   * @param {{ x:number, y:number, w:number, h:number }} arenaRoom
   * @param {number} floor
   */
  _spawnChallengeArena(arenaRoom, floor) {
    const spawnTable = getSpawnTable(floor, devOptions.spawnWeights);
    // Filter out boss and solitary types — only standard enemies fill the arena.
    const eligibleTypes = spawnTable.filter(type => {
      const def = ENEMY_DEFS[type];
      return !def.isBoss && !def.solitary && def.clusterMin === undefined;
    });
    if (eligibleTypes.length === 0) return;

    const { enemyCount } = difficultyManager.getConfig();
    const totalEnemies = Math.max(4, Math.round(8 * enemyCount));

    let championSpawned = false;
    let attempts = 0;
    const maxAttempts = totalEnemies * 5;

    for (let i = 0; i < totalEnemies && attempts < maxAttempts; i++) {
      const type = this.rng.pick(eligibleTypes);
      const ex = this.rng.nextInt(arenaRoom.x + 1, arenaRoom.x + arenaRoom.w - 2);
      const ey = this.rng.nextInt(arenaRoom.y + 1, arenaRoom.y + arenaRoom.h - 2);
      if (this._getEntityAt(ex, ey)) {
        // Tile occupied — retry this slot
        i--;
        attempts++;
        continue;
      }
      // Guarantee at least one champion; after that use normal 10% chance.
      const isChampion = !championSpawned || this.rng.next() < DEFAULT_CHAMPION_CHANCE;
      this._spawnEnemy(ex, ey, type, { isChampion });
      if (isChampion) championSpawned = true;
      attempts++;
    }
  }

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

  _spawnItems(rooms) {
    const floor = this.floorManager.currentFloor;
    // Build the set of achievement-unlocked item ids for this run.
    const unlockedItems = new Set();
    if (getProgress('sprite_stalker', achievementStore).completed) {
      unlockedItems.add(ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION.id);
    }
    // Place 1–2 items per room (skip start room).
    // Challenge floors use potions-only loot; regular floors use the standard pool.
    for (let i = 1; i < rooms.length; i++) {
      if (!this.rng.nextBool(0.6)) continue;
      const room = rooms[i];
      const ix = this.rng.nextInt(room.x + 1, room.x + room.w - 2);
      const iy = this.rng.nextInt(room.y + 1, room.y + room.h - 2);
      // Also guard against non-walkable tiles (e.g. pillar walls) so items
      // are never placed inside a wall.
      if (this.dungeonMap.isWalkable(ix, iy) && !this._getEntityAt(ix, iy)) {
        const typeDef = this._isChallengeFloor
          ? getChallengeLoot(this.rng, unlockedItems)
          : getFloorLoot(floor, this.rng, unlockedItems);
        this._placeItem(ix, iy, typeDef);
      }
    }
  }

  /**
   * Checks whether a unique room should appear on the current floor and, if so,
   * selects an eligible definition, marks it as seen, and calls `_spawnUniqueRoom`.
   *
   * Unique rooms are skipped on the town (floor 0) and challenge floors.
   * Each definition has its own `chance` probability; the dev `forceUniqueRoom`
   * option bypasses both the chance roll and the already-seen check.
   *
   * At most one unique room is placed per floor visit.
   *
   * @param {Array<{x:number,y:number,w:number,h:number}>} rooms
   */
  _trySpawnUniqueRoom(rooms) {
    const floor  = this.floorManager.currentFloor;
    const force  = devOptions.forceUniqueRoom;
    const eligible = uniqueRoomRegistry.getEligible(floor, UNIQUE_ROOM_DEFS, force);
    if (eligible.length === 0) return;

    // When a room is forced via dev options, select it directly so it is
    // guaranteed to spawn regardless of what else is eligible.
    const def = force
      ? eligible.find(d => d.id === force) ?? this.rng.pick(eligible)
      : this.rng.pick(eligible);

    // Force option skips the probability check; otherwise roll against def.chance.
    if (force !== def.id && this.rng.next() >= def.chance) return;

    // Choose a room that is not the start room (index 0) and, where possible,
    // not the stairs room, to give the player room to explore.
    const candidates = rooms.length > 2 ? rooms.slice(1, -1) : rooms.slice(1);
    if (candidates.length === 0) return;
    const room = this.rng.pick(candidates);

    uniqueRoomRegistry.markSeen(def.id);
    this._spawnUniqueRoom(room, def);
    this._entryTracker.setRoom(room, def);

    // Notify the player that something unusual is on this floor after a short
    // delay so the UIScene message log is ready to receive it.
    this.time.delayedCall(250, () => {
      EventBus.emit(GameEvents.MESSAGE, 'You sense a place of power on this floor.');
    });
  }

  /**
   * Spawns the contents of a unique room: guaranteed items, optional enemies,
   * and an optional NPC.  Emits a discovery message after a short delay so the
   * UIScene's message log is ready to receive it.
   *
   * @param {{ x:number, y:number, w:number, h:number }} room  - The BSP room to populate.
   * @param {import('../dungeon/UniqueRoomDefinitions.js').UniqueRoomDef} def
   */
  _spawnUniqueRoom(room, def) {
    const cx = Math.floor(room.x + room.w / 2);
    const cy = Math.floor(room.y + room.h / 2);

    // Place decorations first so their tiles are non-walkable before items/enemies
    // are placed — ensuring nothing spawns on top of a weapon mount or bookcase.
    if (def.decorations) {
      this._placeRoomDecorations(room, def.decorations);
    }

    // Place each guaranteed item at a random walkable position in the room.
    for (const itemKey of def.items) {
      const typeDef = ITEM_TYPES[itemKey];
      if (!typeDef) continue;
      // Try a few positions to avoid overlap.
      for (let attempt = 0; attempt < 8; attempt++) {
        const ix = this.rng.nextInt(room.x + 1, room.x + room.w - 2);
        const iy = this.rng.nextInt(room.y + 1, room.y + room.h - 2);
        if (this.dungeonMap.isWalkable(ix, iy) && !this._getEntityAt(ix, iy)) {
          this._placeItem(ix, iy, typeDef);
          break;
        }
      }
    }

    // Spawn any enemies defined for the room, placed near the centre.
    for (const enemySpec of def.enemies ?? []) {
      // Try centre first, then nearby tiles.
      const candidates = [
        { x: cx,     y: cy     },
        { x: cx + 1, y: cy     },
        { x: cx - 1, y: cy     },
        { x: cx,     y: cy + 1 },
        { x: cx,     y: cy - 1 },
      ];
      for (const pos of candidates) {
        if (this.dungeonMap.isWalkable(pos.x, pos.y) && !this._getEntityAt(pos.x, pos.y)) {
          this._spawnEnemy(pos.x, pos.y, enemySpec.type, { isChampion: enemySpec.isChampion ?? false });
          break;
        }
      }
    }

    // Carve an inner room adjacent to one wall of this room, connected only via a
    // locked door.  Returns placement info (including innerRoom bounds) or null.
    let innerRoom = null;
    if (def.lockedRoom) {
      const lockedResult = this._trySpawnInnerRoom(room, def.lockedRoom);
      if (lockedResult) innerRoom = lockedResult.innerRoom;
    }

    // Spawn the unique room's NPC (if any) near the centre of the parent room.
    if (def.npc) {
      const candidates = [
        { x: cx,     y: cy     },
        { x: cx + 1, y: cy     },
        { x: cx - 1, y: cy     },
        { x: cx,     y: cy + 1 },
        { x: cx,     y: cy - 1 },
      ];
      for (const pos of candidates) {
        if (this.dungeonMap.isWalkable(pos.x, pos.y) && !this._getEntityAt(pos.x, pos.y)) {
          this._spawnDungeonNpc(pos.x, pos.y, def.npc);
          break;
        }
      }
    }

    // Paint the room's themed floor and wall tiles over the base dungeon tilemap.
    if (def.floorKey || def.wallKey) {
      this._paintUniqueRoomTiles(room, def, innerRoom);
    }

  }

  /**
   * Tries each of the four cardinal sides of `room` in order (bottom, right,
   * top, left) and carves the first side where a small inner room fits without
   * overlapping any existing floor tile.  The inner room is connected to the
   * parent room only via a LOCKED_DOOR placed in the shared wall tile.
   *
   * Because the inner room is carved after BSP generation, no BSP corridor can
   * ever reach it — the locked door is the only entrance.
   *
   * @param {{ x:number, y:number, w:number, h:number }} room
   * @param {{ keyId:string, items:string[] }} lockedRoomDef
   * @returns {{ doorX:number, doorY:number, innerRoom:{x,y,w,h} }|null}
   */
  _trySpawnInnerRoom(room, lockedRoomDef) {
    const INNER_LONG  = Math.min(room.w - 2, 5);
    const INNER_TALL  = Math.min(room.h - 2, 5);
    const INNER_SHORT = 3;

    // Each entry: a thunk returning { ix, iy, iw, ih, doorX, doorY } or null.
    const sides = [
      () => { // bottom
        const iw = INNER_LONG, ih = INNER_SHORT;
        const ix = room.x + Math.floor((room.w - iw) / 2);
        const iy = room.y + room.h + 1;
        if (!isInnerRoomSpaceAvailable(this.dungeonMap, ix, iy, iw, ih)) return null;
        return { ix, iy, iw, ih, doorX: ix + Math.floor(iw / 2), doorY: iy - 1 };
      },
      () => { // right
        const iw = INNER_SHORT, ih = INNER_TALL;
        const ix = room.x + room.w + 1;
        const iy = room.y + Math.floor((room.h - ih) / 2);
        if (!isInnerRoomSpaceAvailable(this.dungeonMap, ix, iy, iw, ih)) return null;
        return { ix, iy, iw, ih, doorX: ix - 1, doorY: iy + Math.floor(ih / 2) };
      },
      () => { // top
        const iw = INNER_LONG, ih = INNER_SHORT;
        const ix = room.x + Math.floor((room.w - iw) / 2);
        const iy = room.y - ih - 1;
        if (!isInnerRoomSpaceAvailable(this.dungeonMap, ix, iy, iw, ih)) return null;
        return { ix, iy, iw, ih, doorX: ix + Math.floor(iw / 2), doorY: iy + ih };
      },
      () => { // left
        const iw = INNER_SHORT, ih = INNER_TALL;
        const ix = room.x - iw - 1;
        const iy = room.y + Math.floor((room.h - ih) / 2);
        if (!isInnerRoomSpaceAvailable(this.dungeonMap, ix, iy, iw, ih)) return null;
        return { ix, iy, iw, ih, doorX: ix + iw, doorY: iy + Math.floor(ih / 2) };
      },
    ];

    for (const trySide of sides) {
      const p = trySide();
      if (!p) continue;
      const { ix, iy, iw, ih, doorX, doorY } = p;

      // Carve inner room floor.
      for (let y = iy; y < iy + ih; y++) {
        for (let x = ix; x < ix + iw; x++) {
          this.dungeonMap.setTile(x, y, TILE.FLOOR);
        }
      }

      // Set border walls around the inner room (buildWalls has already run).
      for (let x = ix - 1; x <= ix + iw; x++) {
        if (this.dungeonMap.getTile(x, iy - 1) !== TILE.FLOOR)
          this.dungeonMap.setTile(x, iy - 1, TILE.WALL);
        if (this.dungeonMap.getTile(x, iy + ih) !== TILE.FLOOR)
          this.dungeonMap.setTile(x, iy + ih, TILE.WALL);
      }
      for (let y = iy; y < iy + ih; y++) {
        if (this.dungeonMap.getTile(ix - 1, y) !== TILE.FLOOR)
          this.dungeonMap.setTile(ix - 1, y, TILE.WALL);
        if (this.dungeonMap.getTile(ix + iw, y) !== TILE.FLOOR)
          this.dungeonMap.setTile(ix + iw, y, TILE.WALL);
      }

      // Place the locked door in the shared wall between parent and inner room.
      this.dungeonMap.setTile(doorX, doorY, TILE.LOCKED_DOOR);

      // Place each item at a random walkable position inside the inner room.
      for (const itemKey of lockedRoomDef.items) {
        const typeDef = ITEM_TYPES[itemKey];
        if (!typeDef) continue;
        for (let attempt = 0; attempt < 10; attempt++) {
          const px = this.rng.nextInt(ix, ix + iw - 1);
          const py = this.rng.nextInt(iy, iy + ih - 1);
          if (this.dungeonMap.isWalkable(px, py) && !this._getEntityAt(px, py)) {
            this._placeItem(px, py, typeDef);
            break;
          }
        }
      }

      return { doorX, doorY, innerRoom: { x: ix, y: iy, w: iw, h: ih } };
    }

    return null;
  }

  /**
   * Overdraw floor and wall tiles within a unique room (and its surrounding
   * wall border) with themed textures defined in the room's definition.  When
   * an inner room was successfully carved, its tiles are painted too.
   *
   * The base dungeon tilemap has already been rendered to `this.mapRT`; this
   * method draws on top of that RenderTexture for only the affected tiles,
   * following the same pattern as the shop-door texture overrides.
   *
   * @param {{ x:number, y:number, w:number, h:number }} room
   * @param {import('../dungeon/UniqueRoomDefinitions.js').UniqueRoomDef} def
   * @param {{ x:number, y:number, w:number, h:number }|null} [innerRoom]
   */
  _paintUniqueRoomTiles(room, def, innerRoom = null) {
    const floorKey = def.floorKey ? tilesetManager.getTileKey(def.floorKey) : null;
    const wallKey  = def.wallKey  ? tilesetManager.getTileKey(def.wallKey)  : null;

    // Resolve decoration texture key once if a decoration type is defined.
    const decorKey = def.decorations?.tileType
      ? tilesetManager.getTileKey(`tile_${def.decorations.tileType.toLowerCase()}`)
      : null;
    const decorTile = def.decorations?.tileType ? TILE[def.decorations.tileType] : null;

    // Locked door gets its own themed texture when the room has a lockedRoom.
    const lockedDoorKey = def.lockedRoom
      ? tilesetManager.getTileKey('tile_locked_door')
      : null;

    /** Paint all tiles in the axis-aligned bounding box with 1-tile border. */
    const paintRect = (rx, ry, rw, rh) => {
      const x0 = Math.max(0, rx - 1);
      const y0 = Math.max(0, ry - 1);
      const x1 = Math.min(this.dungeonMap.width  - 1, rx + rw);
      const y1 = Math.min(this.dungeonMap.height - 1, ry + rh);
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const tileType = this.dungeonMap.getTile(tx, ty);
          let key = null;
          if (tileType === TILE.FLOOR && floorKey) key = floorKey;
          else if (tileType === TILE.WALL && wallKey) key = wallKey;
          else if (tileType === TILE.LOCKED_DOOR && lockedDoorKey) key = lockedDoorKey;
          else if (decorTile !== null && tileType === decorTile && decorKey) key = decorKey;
          if (key) this.mapRT.drawFrame(key, undefined, tx * TILE_SIZE, ty * TILE_SIZE);
        }
      }
    };

    // Paint the parent room (and its surrounding wall ring).
    paintRect(room.x, room.y, room.w, room.h);

    // Paint the inner room (and its surrounding wall ring) if one was carved.
    if (innerRoom) paintRect(innerRoom.x, innerRoom.y, innerRoom.w, innerRoom.h);
  }

  /**
   * Places decoration tiles (e.g. WEAPON_MOUNT, BOOKCASE) into the dungeon map.
   * Delegates to RoomDecorationPlacer which handles corridor-avoidance logic.
   *
   * @param {{ x:number, y:number, w:number, h:number }} room
   * @param {{ tileType:string, placement:string, spacing?:number }} decorSpec
   */
  _placeRoomDecorations(room, decorSpec) {
    placeDecorations(this.dungeonMap, room, decorSpec);
  }

  /**
   * Spawns a single NPC in a dungeon room (no roam controller — dungeon NPCs
   * stay put).  Visibility is driven by FOV like enemies, not forced visible
   * like town NPCs.
   *
   * @param {number} x
   * @param {number} y
   * @param {{ name:string, spriteKey:string, lines:string[] }} npcDef
   */
  _spawnDungeonNpc(x, y, npcDef) {
    const npc = new Npc(x, y, npcDef);
    const resolvedKey = tilesetManager.getTileKey(npcDef.spriteKey);
    const textureKey = this.textures.exists(resolvedKey)
      ? resolvedKey
      : tilesetManager.getTileKey('entity_player');
    const sprite = this.add.sprite(
      x * TILE_SIZE + TILE_SIZE / 2,
      y * TILE_SIZE + TILE_SIZE / 2,
      textureKey,
    ).setDepth(8).setVisible(false); // revealed by FOV like enemies
    npc.sprite = sprite;
    this.npcs.push(npc);
    this.dungeonMap.setEntity(x, y, npc);
    // No NpcRoamController — dungeon NPCs do not wander.
  }

  _placeItem(x, y, typeDef) {
    const item = new Item(x, y, typeDef);
    const sprite = this.add.sprite(
      x * TILE_SIZE + TILE_SIZE / 2,
      y * TILE_SIZE + TILE_SIZE / 2,
      tilesetManager.getTileKey(item.textureKey)
    ).setDepth(6).setVisible(false);
    item.sprite = sprite;
    this.items.push(item);
  }

  /**
   * Spawns NPC entities from their definitions and adds them to this.npcs.
   * Each NPC gets a sprite placed at its tile position (always visible — NPCs
   * are only present in the town which is fully lit).
   *
   * @param {Array<{name:string,x:number,y:number,spriteKey:string,lines:string[]}>} npcDefs
   */
  _spawnNpcs(npcDefs) {
    for (const def of npcDefs) {
      const npc = new Npc(def.x, def.y, def);
      // Fall back to the player sprite if the NPC texture is not loaded.
      const resolvedKey = tilesetManager.getTileKey(def.spriteKey);
      const textureKey = this.textures.exists(resolvedKey) ? resolvedKey : tilesetManager.getTileKey('entity_player');
      const sprite = this.add.sprite(
        def.x * TILE_SIZE + TILE_SIZE / 2,
        def.y * TILE_SIZE + TILE_SIZE / 2,
        textureKey,
      ).setDepth(8).setVisible(true);
      npc.sprite = sprite;
      this.npcs.push(npc);
      // Register in the entity map so setEntity null/npc is consistent from the first move.
      this.dungeonMap.setEntity(npc.x, npc.y, npc);
      // Give each NPC its own roam controller; NPCs step every 3 player turns.
      this._npcRoamControllers.push(new NpcRoamController(npc, { interval: 3, rng: () => this.rng.next() }));
    }
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
      if (enemy.segments) {
        // Multi-segment enemy: each segment has its own sprite and visibility
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
    for (const item of this.items) {
      const visible = map.getFovState(item.x, item.y) === FOV_STATE.VISIBLE;
      if (item.sprite) item.sprite.setVisible(visible);
    }
    // Reveal dungeon NPCs (spawned hidden) when they enter the player's FOV.
    // Town NPCs are spawned with setVisible(true) and are never hidden, so
    // including them here is safe — the entire town is always fully visible.
    for (const npc of this.npcs) {
      const visible = map.getFovState(npc.x, npc.y) === FOV_STATE.VISIBLE;
      if (npc.sprite) npc.sprite.setVisible(visible);
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
    // 'l' — toggle look cursor (non-touch devices only).
    if (!isTouchDevice()) {
      this.input.keyboard.on('keydown-L', wrapWithRunCancel(this._runController, () => {
        if (this._lookCursor?.active) {
          this._lookCursor.deactivate();
          EventBus.emit(GameEvents.LOOK_HIDE);
        } else {
          this._lookCursor?.activate(this.player.x, this.player.y);
          this._showLookInfoAt(this.player.x, this.player.y);
        }
      }));

      // 'r' — toggle ranged-aim mode.
      this.input.keyboard.on('keydown-R', wrapWithRunCancel(this._runController, () => {
        this._handleToggleRangedAim();
      }));
    }

    // ESC closes whichever panel is open (message log, sell, inventory, skills)
    // before falling through to the in-game menu — evaluated in priority order.
    this.input.keyboard.on('keydown-ESC', wrapWithRunCancel(this._runController, () => {
      // Look cursor takes highest priority — ESC deactivates it first.
      if (this._lookCursor?.active) {
        this._lookCursor.deactivate();
        EventBus.emit(GameEvents.LOOK_HIDE);
        return;
      }
      // Ranged aim mode — ESC cancels it.
      if (this._aimingRanged) {
        this._setAimingRanged(false);
        EventBus.emit(GameEvents.MESSAGE, 'Ranged aim cancelled.');
        return;
      }
      if (this._messageLogOpen) {
        EventBus.emit(GameEvents.CLOSE_MESSAGE_LOG);
      } else if (this.turnManager.state === TURN_STATE.DIALOGUE) {
        EventBus.emit(GameEvents.CLOSE_DIALOGUE);
      } else if (this.turnManager.state === TURN_STATE.DISPLAY_CASE) {
        EventBus.emit(GameEvents.CLOSE_DISPLAY_CASE);
      } else if (this.turnManager.state === TURN_STATE.SHOP) {
        // Close both shop panels together — UIScene handles the cascade
        EventBus.emit(GameEvents.CLOSE_SELL_PANEL);
      } else {
        const action = applyEscPanelClose(this.turnManager);
        if (action === 'close-inventory') {
          EventBus.emit(GameEvents.OPEN_INVENTORY, { inventory: this.player.inventory, player: this.player });
        } else if (action === 'close-skills') {
          EventBus.emit(GameEvents.OPEN_SKILLS, this._buildSkillsPayload());
        } else {
          this._openInGameMenu();
        }
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

    // Pointer click/touch — look at the tapped cell without advancing the turn.
    this.input.on('pointerdown', (pointer) => this._handleLookClick(pointer));
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
    EventBus.on(GameEvents.TOGGLE_INVENTORY,  wrapWithRunCancel(this._runController, () => this._toggleInventory()), this);
    EventBus.on(GameEvents.TOGGLE_SKILLS,     wrapWithRunCancel(this._runController, () => this._toggleSkills()), this);
    EventBus.on(GameEvents.TOGGLE_RANGED_AIM, wrapWithRunCancel(this._runController, () => this._handleToggleRangedAim()), this);
    EventBus.on(GameEvents.UPGRADE_SKILL,   ({ skillId }) => this._handleUpgradeSkill(skillId),   this);
    EventBus.on(GameEvents.DOWNGRADE_SKILL, ({ skillId }) => this._handleDowngradeSkill(skillId), this);
    EventBus.on(GameEvents.ACTIVATE_SKILL,  ({ skillId }) => this._handleActivateSkill(skillId),  this);
    EventBus.on(GameEvents.USE_STAIRS, wrapWithRunCancel(this._runController, () => this._tryUseStairs()), this);
    EventBus.on(GameEvents.INVENTORY_USE,  (index) => this._useInventoryItem(index),  this);
    EventBus.on(GameEvents.INVENTORY_DROP, (index) => this._dropInventoryItem(index), this);
    EventBus.on(GameEvents.SELL_ITEM, ({ shopType, item }) => this._handleSellItem(shopType, item), this);
    EventBus.on(GameEvents.BUY_ITEM, ({ shopType, shopItem }) => this._handleBuyItem(shopType, shopItem), this);
    EventBus.on(GameEvents.STORE_ITEM, ({ index }) => this._handleStoreItem(index), this);
    EventBus.on(GameEvents.RETRIEVE_ITEM, ({ index }) => this._handleRetrieveItem(index), this);
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
    // When the look cursor is active, direction keys move the cursor instead
    // of the player — the game turn is not advanced.
    if (this._lookCursor?.active) {
      if (this.turnManager.state !== TURN_STATE.PLAYER_INPUT) return;
      const { dx, dy } = DIR_DELTA[dir];
      this._lookCursor.move(dx, dy);
      this._showLookInfoAt(this._lookCursor.x, this._lookCursor.y);
      return;
    }
    // When ranged aim mode is active, the direction fires the ranged weapon.
    if (this._aimingRanged) {
      if (!this.turnManager.isAcceptingInput()) return;
      const { dx, dy } = DIR_DELTA[dir];
      this._doRangedAttack(dx, dy);
      return;
    }
    if (!this.turnManager.isAcceptingInput()) return;
    const { dx, dy } = DIR_DELTA[dir];
    this._doPlayerMove(dx, dy);
  }

  // ─── Ranged aim mode ──────────────────────────────────────────────────────

  /**
   * Sets the ranged-aim state and broadcasts RANGED_AIM_MODE_CHANGED.
   *
   * @param {boolean} active - True to enter aim mode, false to leave it.
   */
  _setAimingRanged(active) {
    this._aimingRanged = active;
    EventBus.emit(GameEvents.RANGED_AIM_MODE_CHANGED, active);
  }

  /**
   * Toggles ranged-aim mode on or off.
   * If the player has no ranged weapon equipped, a message is shown and aim
   * mode is not entered.
   */
  _handleToggleRangedAim() {
    if (!this.turnManager.isAcceptingInput()) return;
    if (this._aimingRanged) {
      this._setAimingRanged(false);
      EventBus.emit(GameEvents.MESSAGE, 'Ranged aim cancelled.');
      return;
    }
    if (!this.player.equippedRangedWeapon) {
      EventBus.emit(GameEvents.MESSAGE, 'No ranged weapon equipped.');
      return;
    }
    this._setAimingRanged(true);
    EventBus.emit(GameEvents.MESSAGE, 'Aim — choose a direction to fire.');
  }

  /**
   * Fires the player's equipped ranged weapon in the given direction.
   * Cancels aim mode whether or not a target is found.
   *
   * @param {number} dx - Horizontal direction (-1, 0, or 1).
   * @param {number} dy - Vertical direction (-1, 0, or 1).
   */
  _doRangedAttack(dx, dy) {
    // Always exit aim mode after a direction is pressed.
    this._setAimingRanged(false);

    const RANGED_RANGE = 6;
    const { target, outOfRange } = findRangedTarget(
      this.player.x, this.player.y,
      dx, dy,
      RANGED_RANGE,
      (x, y) => !this.dungeonMap.isWalkable(x, y),
      (x, y) => this._getEntityAt(x, y),
    );

    if (!target) {
      const msg = outOfRange ? 'Target is out of range.' : 'No target in that direction.';
      EventBus.emit(GameEvents.MESSAGE, msg);
      return;
    }

    this.turnManager.setState(TURN_STATE.PLAYER_ACTING);

    // Animate the projectile first; resolve damage in the onComplete callback so
    // the hit visuals play after the projectile arrives.
    this._animateProjectile(this.player.x, this.player.y, target.x, target.y, () => {
      const { damage, killed, messages } = resolveRangedAttack(
        this.player, target, this.rng,
        { defenderIsInvincible: devOptions.enemiesInvincible },
      );
      messages.forEach(msg => EventBus.emit(GameEvents.MESSAGE, msg));

      // Flash all sprites for multi-segment enemies (e.g. Creeping Mass), otherwise the single sprite.
      if (target.segments) {
        for (const seg of target.segments) this._flashSprite(seg.sprite, 0xff4444);
      } else {
        this._flashSprite(target.sprite, 0xff4444, target);
      }

      // Clean up any segments removed by proportional HP loss (Creeping Mass).
      this._applyPendingRemovedSegments(target);

      // Refresh the health bar to reflect the new HP.
      this._updateHealthBar(target);

      if (killed) {
        EventBus.emit(GameEvents.ENEMY_KILLED, target.type);
        if (target.isBoss) this._applyBossLoot(target);
        if (target.isChampion) this._applyChampionLoot(target);

        const leveled = this.player.gainXP(target.xp);
        if (leveled) {
          EventBus.emit(GameEvents.MESSAGE, `Level up! You are now level ${this.player.stats.level}!`);
          EventBus.emit(GameEvents.PLAYER_LEVEL_UP, this.player.stats.level);
          this.cameras.main.flash(600, 255, 220, 100);
          this._tryLaunchSkillLevelUp();
        }
        this._destroyEnemy(target);
      }

      this._syncRegistry();
      this._startEnemyTurns();
    });
  }

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
    return this.enemies.some(e => {
      // Multi-segment enemies (e.g. Creeping Mass): visible if ANY segment tile is in FOV
      if (e.segments) {
        return e.segments.some(s => this.dungeonMap.getFovState(s.x, s.y) === FOV_STATE.VISIBLE);
      }
      return this.dungeonMap.getFovState(e.x, e.y) === FOV_STATE.VISIBLE;
    });
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
    EventBus.emit(GameEvents.LOOK_HIDE);

    const result = this.player.move(dx, dy, this.dungeonMap, (x, y) => this._getEntityAt(x, y));

    if (result.action === 'blocked') {
      return; // No turn spent on blocked moves
    }

    if (result.action === 'npc') {
      // Cancel any active run and open the dialogue panel; no turn spent
      this._runController.cancel();
      this.turnManager.setState(TURN_STATE.DIALOGUE);
      const line = result.npc.talk(this.player, () => this.rng.next());
      EventBus.emit(GameEvents.OPEN_DIALOGUE, { npcName: result.npc.name, line });
      return;
    }

    if (result.action === 'home') {
      // Cancel any active run; no turn spent on home interactions
      this._runController.cancel();
      this.turnManager.setState(TURN_STATE.DISPLAY_CASE);
      EventBus.emit(GameEvents.OPEN_DISPLAY_CASE, {
        displayCase: this.player.displayCase,
        inventory: this.player.inventory,
        player: this.player,
      });
      return;
    }

    if (result.action === 'shop') {
      // Cancel any active run so it doesn't resume into the door on the next turn
      this._runController.cancel();
      // Open both buy and sell panels; no turn spent on door interactions
      const shop = this.shops.find(s => s.doorX === result.doorX && s.doorY === result.doorY);
      if (shop) {
        // Use TURN_STATE.SHOP so the state machine blocks I/K panel keys naturally
        this.turnManager.setState(TURN_STATE.SHOP);
        // Track which shop is active so _handleSellItem can add buy-back stock
        this._activeShop = shop;
        EventBus.emit(GameEvents.OPEN_SHOP_PANEL, {
          shopType: shop.type,
          shopStock: shop.stock,
          inventory: this.player.inventory,
          player: this.player,
        });
      }
      return;
    }

    if (result.action === 'locked_door') {
      this._runController.cancel();
      const roomId = this._entryTracker.getRoomId();
      const roomDef = roomId ? UNIQUE_ROOM_DEFS.find(d => d.id === roomId) : null;
      const requiredKeyId = roomDef?.lockedRoom?.keyId;
      const keyIdx = requiredKeyId
        ? this.player.inventory.findIndex(i => i.id === requiredKeyId)
        : -1;
      if (keyIdx >= 0) {
        this.player.removeItem(keyIdx);
        this.dungeonMap.setTile(result.doorX, result.doorY, TILE.FLOOR);
        // Repaint the now-open tile with the room's themed floor.
        const floorBase = roomDef?.floorKey ?? 'tile_floor';
        this.mapRT.drawFrame(tilesetManager.getTileKey(floorBase), undefined, result.doorX * TILE_SIZE, result.doorY * TILE_SIZE);
        this._updateFOV();
        EventBus.emit(GameEvents.MESSAGE, 'You use the Key to Elsewhere. The sealed door swings open.');
      } else {
        EventBus.emit(GameEvents.MESSAGE, 'The door is sealed. Martel mentioned a key — the Key to Elsewhere.');
      }
      return;
    }

    if (result.action === 'break_wall') {
      this._runController.cancel();
      this.dungeonMap.setTile(result.wallX, result.wallY, TILE.FLOOR);
      const _bwRoomId = this._entryTracker.getRoomId();
      const _bwRoomDef = _bwRoomId ? UNIQUE_ROOM_DEFS.find(d => d.id === _bwRoomId) : null;
      const _bwFloorBase = _bwRoomDef?.floorKey ?? 'tile_floor';
      this.mapRT.drawFrame(
        tilesetManager.getTileKey(_bwFloorBase), undefined,
        result.wallX * TILE_SIZE, result.wallY * TILE_SIZE,
      );
      // Carve a small alcove beyond the broken wall and repaint changed tiles.
      const alcoveChanges = new AlcoveCarver().carve(
        this.dungeonMap, result.wallX, result.wallY, result.dx, result.dy, this.rng,
      );
      for (const { x, y, tile } of alcoveChanges) {
        let tileKey;
        if (tile === TILE.FLOOR)           tileKey = tilesetManager.getTileKey(_bwFloorBase);
        else if (tile === TILE.WALL)       tileKey = tilesetManager.getTileKey('tile_wall');
        else if (tile === TILE.BREAKABLE_WALL) tileKey = tilesetManager.getTileKey('tile_breakable_wall');
        if (tileKey) this.mapRT.drawFrame(tileKey, undefined, x * TILE_SIZE, y * TILE_SIZE);
      }
      this.turnManager.setState(TURN_STATE.PLAYER_ACTING);
      this._updateFOV();
      EventBus.emit(GameEvents.MESSAGE, 'You swing your pick axe and break through the rocky wall!');
      this._syncRegistry();
      this._startEnemyTurns();
      return;
    }

    this.turnManager.setState(TURN_STATE.PLAYER_ACTING);

    if (result.action === 'attacked') {
      this._playerAttack(result.target);
    } else if (result.action === 'moved' || result.action === 'stairs' || result.action === 'stairs_up' || result.action === 'recall_portal') {
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
    const entryMessages = this._entryTracker.checkEntry(this.player.x, this.player.y);
    if (entryMessages) {
      entryMessages.forEach(msg => EventBus.emit(GameEvents.MESSAGE, msg));
      const enteredRoomId = this._entryTracker.getRoomId();
      EventBus.emit(GameEvents.UNIQUE_ROOM_ENTERED, enteredRoomId);
      if (enteredRoomId) uniqueRoomRegistry.markEntered(enteredRoomId);
    }
    if (action === 'stairs') {
      this._showStairsPrompt();
    } else if (action === 'stairs_up') {
      this._showStairsUpPrompt();
    } else if (action === 'recall_portal') {
      this._showRecallPortalPrompt();
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

        // Flash all sprites for multi-segment enemies, otherwise the single sprite
        if (target.segments) {
          for (const seg of target.segments) this._flashSprite(seg.sprite, 0xff4444);
        } else {
          this._flashSprite(target.sprite, 0xff4444, target);
        }

        // Handle segments removed by damage (proportional HP loss for Creeping Mass)
        this._applyPendingRemovedSegments(target);

        // Refresh the health bar to reflect the new HP.
        this._updateHealthBar(target);

        // First-hit minion spawning for bosses that support it
        if (target.isBoss && target.shouldSpawnMinions && !target.minionsSpawned && damage > 0) {
          this._spawnBossMinions(target);
          // Immediately reveal minions — without this call their sprites stay
          // hidden (setVisible(false) at spawn) until the player's next action.
          this._updateFOV();
        }

        if (killed) {
          // Notify achievement system via event so it can update kill-based progress.
          EventBus.emit(GameEvents.ENEMY_KILLED, target.type);

          // Boss-specific loot: gold and a unique item drop
          if (target.isBoss) {
            this._applyBossLoot(target);
          }
          // Champion-specific loot: item drop
          if (target.isChampion) {
            this._applyChampionLoot(target);
          }

          const leveled = this.player.gainXP(target.xp);
          if (leveled) {
            EventBus.emit(GameEvents.MESSAGE, `Level up! You are now level ${this.player.stats.level}!`);
            EventBus.emit(GameEvents.PLAYER_LEVEL_UP, this.player.stats.level);
            // Golden flash over the game world to make the moment unmissable.
            this.cameras.main.flash(600, 255, 220, 100);
            // Offer skill selection if there are choices available.
            this._tryLaunchSkillLevelUp();
          }
          this._destroyEnemy(target);
        }

        this._syncRegistry();
        this._startEnemyTurns();
      },
    });
  }

  /**
   * Cleans up any segments removed from a multi-tile enemy during damage
   * resolution (e.g. Creeping Mass losing segments proportional to HP loss).
   * Clears the entity map tiles and fades out the segment sprites.
   *
   * @param {object} enemy
   */
  _applyPendingRemovedSegments(enemy) {
    if (!enemy.pendingRemovedSegments?.length) return;
    for (const seg of enemy.pendingRemovedSegments) {
      this.dungeonMap.setEntity(seg.x, seg.y, null);
      if (seg.sprite) {
        this.tweens.add({
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
   * Removes an enemy from the scene, clearing all of its dungeon-map tiles and
   * destroying all associated sprites.  Handles both single-tile and multi-segment
   * enemies (e.g. Creeping Mass).
   *
   * @param {object} target - The enemy entity to remove.
   */
  _destroyEnemy(target) {
    this.enemies = this.enemies.filter(e => e !== target);
    if (target.segments) {
      // Multi-segment: clear every tile and destroy every sprite
      for (const seg of target.segments) {
        this.dungeonMap.setEntity(seg.x, seg.y, null);
        if (seg.sprite) {
          this.tweens.add({
            targets: seg.sprite,
            alpha: 0,
            duration: 200,
            onComplete: () => seg.sprite?.destroy(),
          });
        }
      }
    } else {
      this.dungeonMap.setEntity(target.x, target.y, null);
      target.healthBar?.destroy();
      target.healthBar = null;
      if (target.sprite) {
        this.tweens.add({
          targets: target.sprite,
          alpha: 0,
          duration: 200,
          onComplete: () => target.sprite?.destroy(),
        });
      }
    }
  }

  /**
   * Spawns up to `boss.maxMinions` minions of `boss.minionType` adjacent to
   * the boss on its first hit.  Marks `minionsSpawned` so this only triggers
   * once per encounter.
   *
   * @param {object} boss - A boss entity with minionType, maxMinions, and minionSpawnMessage fields.
   */
  _spawnBossMinions(boss) {
    boss.minionsSpawned = true;
    const count = this.rng.nextInt(0, boss.maxMinions);
    if (count === 0) return;

    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
    let spawned = 0;
    for (const { dx, dy } of dirs) {
      if (spawned >= count) break;
      const nx = boss.x + dx;
      const ny = boss.y + dy;
      if (this.dungeonMap.isWalkable(nx, ny) && !this._getEntityAt(nx, ny)) {
        this._spawnEnemy(nx, ny, boss.minionType);
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
   * @param {OldBones} boss
   */
  _applyBossLoot(boss) {
    if (boss.dropGold > 0) {
      this.player.gold = (this.player.gold ?? 0) + boss.dropGold;
      EventBus.emit(GameEvents.PLAYER_GOLD_CHANGED, this.player.gold);
      EventBus.emit(GameEvents.MESSAGE, `You find ${boss.dropGold} gold on the remains!`);
    }
    if (boss.dropItem) {
      this._placeItem(boss.x, boss.y, boss.dropItem);
      EventBus.emit(GameEvents.MESSAGE, `${boss.name} dropped: ${boss.dropItem.name}!`);
    }
  }

  /**
   * Places the champion's drop item on the floor at the champion's position
   * and notifies the player via the message log.
   *
   * @param {Champion} champion
   */
  _applyChampionLoot(champion) {
    if (champion.dropItem) {
      this._placeItem(champion.x, champion.y, champion.dropItem);
      EventBus.emit(GameEvents.MESSAGE, `${champion.name} dropped: ${champion.dropItem.name}!`);
    }
  }

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

  _checkItemPickup() {
    const px = this.player.x;
    const py = this.player.y;
    const itemIndex = this.items.findIndex(i => i.x === px && i.y === py);
    if (itemIndex === -1) return;

    const item = this.items[itemIndex];
    // Determine success before calling pickUp so that stackable items that
    // merge into an existing stack (and are therefore never pushed into the
    // inventory array) are still removed from the floor.
    const willPickUp = this.player.canPickUp(item);
    const msg = InventorySystem.pickUp(this.player, item);
    EventBus.emit(GameEvents.MESSAGE, msg);

    if (willPickUp) {
      // Successfully picked up (either added to inventory or merged into a stack)
      this.items.splice(itemIndex, 1);
      if (item.sprite) item.sprite.destroy();
      this._syncRegistry();
    }
  }

  _showStairsPrompt() {
    EventBus.emit(GameEvents.MESSAGE, 'You stand on the stairs. Press > or tap ▼▼ to descend.');
  }

  /**
   * Shows a message when the player steps onto up-stairs.
   */
  _showStairsUpPrompt() {
    EventBus.emit(GameEvents.MESSAGE, 'You stand on the stairs leading up. Press > or tap ▼▼ to ascend.');
  }

  /**
   * Shows a message when the player steps onto the recall portal.
   */
  _showRecallPortalPrompt() {
    EventBus.emit(GameEvents.MESSAGE, 'A shimmering portal hums at your feet. Press > or tap ▼▼ to return to the dungeon.');
  }

  /**
   * Teleports the player directly to town after using a Home Seeking Scroll.
   * Saves a DungeonSnapshot so the player can return via the RECALL_PORTAL tile.
   * Can only be called when a snapshot has already been stored by _useInventoryItem.
   */
  _teleportToTown() {
    if (!startFloorTransition(this.turnManager)) return;
    EventBus.emit(GameEvents.LOOK_HIDE);
    this._lookCursor?.deactivate();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      const dungeonData = this.floorManager.jumpToTown();
      this._buildFloor(dungeonData);
      this._placeRecallPortal();
      this._lookCursor?.updateMap(this.dungeonMap, TILE_SIZE);
      this._syncRegistry();
      EventBus.emit(GameEvents.MESSAGE, 'You are whisked back to town. A shimmering portal lingers near the stairs.');
      this.cameras.main.fadeIn(300, 0, 0, 0);
      this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    });
  }

  /**
   * Places a RECALL_PORTAL tile in the town map, just south of the stairs accent ring.
   * Draws the portal graphic onto the existing map RenderTexture.
   */
  _placeRecallPortal() {
    // Fixed portal position: one tile below the town stairs accent ring (stairs at 10,10)
    const portalX = 10;
    const portalY = 12;
    this.dungeonMap.setTile(portalX, portalY, TILE.RECALL_PORTAL);
    const key = tilesetManager.getTileKey('tile_recall_portal');
    this.mapRT.drawFrame(key, undefined, portalX * TILE_SIZE, portalY * TILE_SIZE);
  }

  /**
   * Restores a dungeon floor from a previously saved DungeonSnapshot.
   * Re-creates enemy and item sprites, places the player at the return position,
   * and removes the snapshot so the portal can only be used once.
   */
  _returnFromSnapshot() {
    if (!this._dungeonSnapshot) {
      EventBus.emit(GameEvents.MESSAGE, 'The portal fades — there is nowhere to return to.');
      return;
    }
    if (!startFloorTransition(this.turnManager)) return;

    const snapshot = this._dungeonSnapshot;
    this._dungeonSnapshot = null;

    EventBus.emit(GameEvents.LOOK_HIDE);
    this._lookCursor?.deactivate();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      // Restore floor number without regenerating; emit FLOOR_CHANGED for the HUD
      this.floorManager.currentFloor = snapshot.floor;
      EventBus.emit(GameEvents.FLOOR_CHANGED, this.floorManager.currentFloor);

      // Build map visuals from the snapshot's preserved map; rooms:[] skips spawning
      this._buildFloor({
        map: snapshot.dungeonMap,
        rooms: [],
        startPos: { x: snapshot.returnX, y: snapshot.returnY },
        shops: [],
        npcs: [],
      });

      // _buildFloor sets _isChallengeFloor from dungeonData.isChallenge (absent → false).
      // Re-derive it from the restored floor number so the staircase lock stays correct.
      this._isChallengeFloor = this.floorManager.isChallengeFloor();

      // Re-create sprites for all snapshotted enemies.
      // Multi-segment enemies (CreepingMass) are skipped — their segment topology
      // cannot be safely rebuilt from a shallow snapshot without re-running segment logic.
      for (const enemy of snapshot.enemies) {
        if (enemy.segments) continue;
        const sprite = this.add.sprite(
          enemy.x * TILE_SIZE + TILE_SIZE / 2,
          enemy.y * TILE_SIZE + TILE_SIZE / 2,
          tilesetManager.getTileKey(enemy.textureKey),
        ).setDepth(8).setVisible(false);
        if (enemy.isChampion) {
          sprite.setScale(CHAMPION_SCALE);
          sprite.setTint(CHAMPION_TINT);
        }
        enemy.sprite = sprite;
        this._createHealthBar(enemy);
        this.enemies.push(enemy);
        this.dungeonMap.setEntity(enemy.x, enemy.y, enemy);
      }

      // Re-create sprites for all snapshotted floor items
      for (const item of snapshot.items) {
        const sprite = this.add.sprite(
          item.x * TILE_SIZE + TILE_SIZE / 2,
          item.y * TILE_SIZE + TILE_SIZE / 2,
          tilesetManager.getTileKey(item.textureKey),
        ).setDepth(6).setVisible(false);
        item.sprite = sprite;
        this.items.push(item);
      }

      // Place player at the saved return position
      this.player.x = snapshot.returnX;
      this.player.y = snapshot.returnY;
      this.playerSprite.setPosition(
        snapshot.returnX * TILE_SIZE + TILE_SIZE / 2,
        snapshot.returnY * TILE_SIZE + TILE_SIZE / 2,
      );

      this._lookCursor?.updateMap(this.dungeonMap, TILE_SIZE);
      this._updateFOV();
      this._syncRegistry();
      EventBus.emit(GameEvents.MESSAGE, `You step through the portal and return to floor ${snapshot.floor}.`);
      this.cameras.main.fadeIn(300, 0, 0, 0);
      this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    });
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
  _handleSaveAndExit() {
    saveGame(this.player, this.floorManager,
      serializeFloor(this.dungeonMap, this.enemies, this.items, this.player, uniqueRoomRegistry),
      this._slot);
    this._restart();
  }

  /**
   * Applies a loaded save object to the current player and floorManager,
   * restoring stats, gold, inventory, equipment, skills, and floor number.
   *
   * @param {object} saveData - Plain object returned by loadGame().
   */
  _applyLoadedSave(saveData) {
    if (!saveData) return;

    // Stats and gold
    Object.assign(this.player.stats, saveData.player.stats);
    this.player.gold = saveData.player.gold;

    // Inventory — reconstruct Item objects from saved ids
    const findTypeDef = id => Object.values(ITEM_TYPES).find(t => t.id === id);
    this.player.inventory = saveData.player.inventory
      .map(({ id, count }) => {
        const typeDef = findTypeDef(id);
        if (!typeDef) return null;
        const item = new Item(0, 0, typeDef);
        item.count = count;
        return item;
      })
      .filter(Boolean);

    // Equipment slots
    const makeEquipped = id => {
      if (!id) return null;
      const typeDef = findTypeDef(id);
      return typeDef ? new Item(0, 0, typeDef) : null;
    };
    const eq = saveData.player.equipped;
    this.player.equippedWeapon       = makeEquipped(eq.weapon);
    this.player.equippedRangedWeapon = makeEquipped(eq.rangedWeapon);
    this.player.equippedArmor        = makeEquipped(eq.armor);
    this.player.equippedHelmet       = makeEquipped(eq.helmet);
    this.player.equippedChest        = makeEquipped(eq.chest);
    this.player.equippedLegs         = makeEquipped(eq.legs);
    this.player.equippedArms         = makeEquipped(eq.arms);
    this.player.equippedBoots        = makeEquipped(eq.boots);
    this.player.equippedRing1        = makeEquipped(eq.ring1);
    this.player.equippedRing2        = makeEquipped(eq.ring2);
    this.player.equippedAmulet       = makeEquipped(eq.amulet);

    // Skills
    if (this.player.skillSystem && saveData.player.activeSkills) {
      this.player.skillSystem._activeSkills =
        saveData.player.activeSkills.map(createSkillFromData).filter(Boolean);
      this.player.skillSystem._inactiveSkills =
        saveData.player.inactiveSkills.map(createSkillFromData).filter(Boolean);
    }

    // Floor — set before generateFloor() so it generates the correct floor
    this.floorManager.currentFloor = saveData.floor;

    // Unique room registry — restore seen/entered sets from saved floor state
    // so rooms already visited are not re-discoverable on continue.
    if (saveData.floorState?.uniqueRooms) {
      const { seen, entered } = saveData.floorState.uniqueRooms;
      for (const id of seen)    uniqueRoomRegistry.markSeen(id);
      for (const id of entered) uniqueRoomRegistry.markEntered(id);
    }

    // Store floor state for restore after EnemySpawner init (in create()).
    this._pendingFloorRestore = saveData.floorState ?? null;
  }

  _tryUseStairs() {
    if (!this.turnManager.isAcceptingInput()) return;
    const tileType = this.dungeonMap.getTile(this.player.x, this.player.y);
    if (tileType === TILE.STAIRS_DOWN) {
      // On challenge floors the down-staircase is locked until all enemies
      // in the arena have been defeated.
      if (this._isChallengeFloor && this.enemies.length > 0) {
        EventBus.emit(GameEvents.MESSAGE, 'Defeat all enemies before you can descend!');
        return;
      }
      this._descend();
    } else if (tileType === TILE.STAIRS_UP) {
      this._ascend();
    } else if (tileType === TILE.RECALL_PORTAL) {
      this._returnFromSnapshot();
    } else {
      EventBus.emit(GameEvents.MESSAGE, 'No stairs here.');
    }
  }

  _descend() {
    if (!startFloorTransition(this.turnManager)) return;
    EventBus.emit(GameEvents.LOOK_HIDE);
    this._lookCursor?.deactivate();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      const dungeonData = this.floorManager.descend();
      this._buildFloor(dungeonData);
      saveGame(this.player, this.floorManager,
        serializeFloor(this.dungeonMap, this.enemies, this.items, this.player, uniqueRoomRegistry),
        this._slot);
      this._lookCursor?.updateMap(this.dungeonMap, TILE_SIZE);
      this._syncRegistry();
      if (this._isChallengeFloor) {
        EventBus.emit(GameEvents.MESSAGE, `Floor ${this.floorManager.currentFloor} — a challenge floor! Defeat all enemies to proceed.`);
      } else {
        EventBus.emit(GameEvents.MESSAGE, `You descend to floor ${this.floorManager.currentFloor}.`);
      }
      this.cameras.main.fadeIn(300, 0, 0, 0);
      this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    });
  }

  /**
   * Move the player back up one floor (to the town when on floor 1).
   * The player is placed at the stairsPos of the destination floor so they
   * land near the stairs they arrived from.
   */
  _ascend() {
    if (!startFloorTransition(this.turnManager)) return;
    EventBus.emit(GameEvents.LOOK_HIDE);
    this._lookCursor?.deactivate();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      const dungeonData = this.floorManager.ascend();
      this._buildFloor(dungeonData);
      saveGame(this.player, this.floorManager,
        serializeFloor(this.dungeonMap, this.enemies, this.items, this.player, uniqueRoomRegistry),
        this._slot);
      this._lookCursor?.updateMap(this.dungeonMap, TILE_SIZE);
      // Place the player at the stairs position of the destination floor,
      // and sync the sprite so the camera centres on the correct tile.
      this.player.x = dungeonData.stairsPos.x;
      this.player.y = dungeonData.stairsPos.y;
      this.playerSprite.setPosition(
        dungeonData.stairsPos.x * TILE_SIZE + TILE_SIZE / 2,
        dungeonData.stairsPos.y * TILE_SIZE + TILE_SIZE / 2,
      );
      // Recompute FOV from the actual landing position (stairsPos), not the
      // startPos that _buildFloor() used — without this the revealed area would
      // be centred on the wrong tile.
      this._updateFOV();
      this._syncRegistry();
      if (this.floorManager.isTown()) {
        EventBus.emit(GameEvents.MESSAGE, 'You ascend back to town.');
      } else {
        EventBus.emit(GameEvents.MESSAGE, `You ascend to floor ${this.floorManager.currentFloor}.`);
      }
      this.cameras.main.fadeIn(300, 0, 0, 0);
      this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    });
  }

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
  _handleAchievementSkillUnlock(achievementId) {
    const skillSystem = this.player?.skillSystem;
    if (!skillSystem) return;

    // Permanent skills are applied immediately and are never shown in the
    // level-up pool — the player cannot activate or upgrade them.
    const PERMANENT_SKILLS = {
      goblin_killer:            () => new HuntingSkill('GOBLIN_HUNTING'),
      orc_killer:               () => new HuntingSkill('ORC_HUNTING'),
      troll_killer:             () => new HuntingSkill('TROLL_HUNTING'),
      cockroach_killer:         () => new HuntingSkill('COCKROACH_HUNTING'),
      sprite_killer:            () => new HuntingSkill('SPRITE_HUNTING'),
      mass_slayer:              () => new HuntingSkill('CREEPING_MASS_HUNTING'),
      skeleton_killer:          () => new HuntingSkill('SKELETON_HUNTING'),
      skeleton_warrior_killer:  () => new HuntingSkill('SKELETON_WARRIOR_HUNTING'),
      skeleton_mage_killer:     () => new HuntingSkill('SKELETON_MAGE_HUNTING'),
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
      goblin_killer:            'goblin_hunting',
      orc_killer:               'orc_hunting',
      troll_killer:             'troll_hunting',
      cockroach_killer:         'cockroach_hunting',
      sprite_killer:            'sprite_hunting',
      mass_slayer:              'creeping_mass_hunting',
      skeleton_killer:          'skeleton_hunting',
      skeleton_warrior_killer:  'skeleton_warrior_hunting',
      skeleton_mage_killer:     'skeleton_mage_hunting',
      burrower:                 'night_vision',
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
   * Launches StatDistributionScene so the player can spend their new stat points.
   * StatDistributionScene chains to SkillLevelUpScene when finished if skill choices exist.
   * Sleeps GameScene and UIScene for the duration of both overlay scenes.
   */
  _tryLaunchSkillLevelUp() {
    // Clear movement state before sleeping so missed key-release events
    // cannot cause phantom auto-repeat or run movement on wake.
    this.heldMovement.clear();
    this._runController.cancel();
    this.scene.launch('StatDistributionScene', {
      player:      this.player,
      skillSystem: this.player.skillSystem ?? null,
    });
    this.scene.sleep('UIScene');
    this.scene.sleep('GameScene');
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
    const item = this.player.inventory[index];

    const context = {
      rng: this.rng,
      isWalkable: (x, y) => this.dungeonMap.isWalkable(x, y),
      getEntityAt: (x, y) => this._getEntityAt(x, y),
    };

    // Handle teleport_to_town before consuming the item so we can snapshot first
    if (item?.effect?.type === 'teleport_to_town') {
      if (this.floorManager.isTown()) {
        EventBus.emit(GameEvents.MESSAGE, 'You are already in town — the scroll would be wasted here.');
        return;
      }
      this._dungeonSnapshot = DungeonSnapshot.create(
        this.floorManager.currentFloor,
        this.player.x,
        this.player.y,
        this.dungeonMap,
        this.enemies,
        this.items,
      );
      const msg = InventorySystem.useItem(this.player, index, context);
      EventBus.emit(GameEvents.MESSAGE, msg);
      if (this.turnManager.state === TURN_STATE.INVENTORY) {
        this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
        EventBus.emit(GameEvents.OPEN_INVENTORY, { inventory: this.player.inventory, player: this.player });
      }
      this._teleportToTown();
      return;
    }

    const prevX = this.player.x;
    const prevY = this.player.y;

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
   * Handles INVENTORY_DROP: removes the item from the player's inventory and
   * places it as a floor item at the player's current position.
   *
   * @param {number} index - Zero-based inventory index to drop.
   */
  _dropInventoryItem(index) {
    const result = InventorySystem.dropItem(this.player, index);
    if (!result) return;

    const { item, message } = result;
    const sprite = this.add.sprite(
      item.x * TILE_SIZE + TILE_SIZE / 2,
      item.y * TILE_SIZE + TILE_SIZE / 2,
      tilesetManager.getTileKey(item.textureKey),
    ).setDepth(6).setVisible(
      this.dungeonMap.getFovState(item.x, item.y) === FOV_STATE.VISIBLE,
    );
    item.sprite = sprite;
    this.items.push(item);
    EventBus.emit(GameEvents.MESSAGE, message);
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
    const system = new ShopSystem(shopType);
    const earned = system.sell(this.player, item);
    // Add the sold item back to the shop's stock at a 10% mark-up so the player
    // can buy it back if they change their mind.
    // Only push the buy-back entry when the sale actually succeeded (earned > 0)
    // to guard against mismatched shopType emits or other edge cases.
    if (earned > 0 && this._activeShop) {
      // For stackable items the stack object is still in inventory (count
      // decremented), so we must clone it to avoid aliasing the live slot.
      const buyBackItem = item.stackable ? item._cloneOne() : item;
      this._activeShop.stock.push(system.createBuyBackEntry(buyBackItem));
    }
    EventBus.emit(GameEvents.MESSAGE, `Sold ${item.name} for ${earned} gold.`);
    EventBus.emit(GameEvents.PLAYER_GOLD_CHANGED, this.player.gold);
    EventBus.emit(GameEvents.INVENTORY_CHANGED, [...this.player.inventory]);
    this._syncRegistry();
  }

  /**
   * Handles a buy request from the BuyPanel.  Validates the purchase via
   * ShopSystem.buy(), removes the item from the shop's stock, and broadcasts
   * updated gold and inventory so the HUD, BuyPanel, and SellPanel stay in sync.
   *
   * @param {string} shopType - 'potion', 'weapon', or 'armour'.
   * @param {{item: import('../items/Item.js').Item, buyPrice: number}} shopItem
   */
  _handleBuyItem(shopType, shopItem) {
    if (!shopItem || !shopItem.item) return;
    // Find the shop whose stock still contains this shopItem reference
    const shop = this.shops.find(s => s.type === shopType && s.stock.includes(shopItem));
    if (!shop) return;

    const system = new ShopSystem(shopType);
    const success = system.buy(this.player, shopItem.item, shopItem.buyPrice);
    if (!success) {
      if (this.player.gold < shopItem.buyPrice) {
        EventBus.emit(GameEvents.MESSAGE, `You can't afford the ${shopItem.item.name} (${shopItem.buyPrice}g needed).`);
      } else {
        EventBus.emit(GameEvents.MESSAGE, 'Your inventory is full!');
      }
      return;
    }

    // Remove the purchased item from the shop's persistent stock
    const idx = shop.stock.indexOf(shopItem);
    if (idx !== -1) shop.stock.splice(idx, 1);

    EventBus.emit(GameEvents.MESSAGE, `Bought ${shopItem.item.name} for ${shopItem.buyPrice} gold.`);
    EventBus.emit(GameEvents.PLAYER_GOLD_CHANGED, this.player.gold);
    EventBus.emit(GameEvents.INVENTORY_CHANGED, [...this.player.inventory]);
    this._syncRegistry();
  }

  // ─── Display Case ────────────────────────────────────────────────────────

  /**
   * Moves the inventory item at `index` into the player's display case.
   * Only unique items can be stored; non-unique items are silently ignored.
   *
   * @param {number} index - Zero-based index into the player's inventory.
   */
  _handleStoreItem(index) {
    const item = this.player.inventory[index];
    if (!item) return;
    const stored = this.player.displayCase.store(item);
    if (!stored) {
      EventBus.emit(GameEvents.MESSAGE, `${item.name} cannot be stored in the display case.`);
      return;
    }
    this.player.removeItem(index);
    EventBus.emit(GameEvents.MESSAGE, `You place the ${item.name} in the display case.`);
    EventBus.emit(GameEvents.DISPLAY_CASE_CHANGED, {
      displayCase: this.player.displayCase,
      inventory: this.player.inventory,
    });
    EventBus.emit(GameEvents.INVENTORY_CHANGED, [...this.player.inventory]);
  }

  /**
   * Retrieves the display case item at `index` into the player's inventory.
   * Fails gracefully if the inventory is full.
   *
   * @param {number} index - Zero-based index into the display case items.
   */
  _handleRetrieveItem(index) {
    if (!this.player.canPickUp()) {
      EventBus.emit(GameEvents.MESSAGE, 'Your pack is full!');
      return;
    }
    const item = this.player.displayCase.retrieve(index);
    if (!item) return;
    this.player.addItem(item);
    EventBus.emit(GameEvents.MESSAGE, `You take the ${item.name} from the display case.`);
    EventBus.emit(GameEvents.DISPLAY_CASE_CHANGED, {
      displayCase: this.player.displayCase,
      inventory: this.player.inventory,
    });
    EventBus.emit(GameEvents.INVENTORY_CHANGED, [...this.player.inventory]);
  }

  // ─── Enemy Turns ──────────────────────────────────────────────────────────

  _startEnemyTurns() {
    this.turnManager.setState(TURN_STATE.ENEMY_ACTING);

    /**
     * Ranged attacks whose projectile animations are deferred until after the
     * synchronous turn loop completes, so all projectiles can fly simultaneously.
     * Damage is resolved immediately; only the visual is deferred.
     *
     * @type {Array<{fromX: number, fromY: number, toX: number, toY: number, color: number, killed: boolean}>}
     */
    const pendingProjectiles = [];

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
      } else if (result.action === 'ranged_attack') {
        const { damage, killed, messages } = resolveRangedAttack(
          enemy, this.player, this.rng,
          { defenderIsInvincible: devOptions.playerInvincible },
        );
        messages.forEach(msg => EventBus.emit(GameEvents.MESSAGE, msg));
        this._syncRegistry();

        // Queue a projectile animation — visual flies after all enemy actions resolve.
        pendingProjectiles.push({
          fromX: enemy.x,
          fromY: enemy.y,
          toX: this.player.x,
          toY: this.player.y,
          color: enemy.projectileColor,
          killed,
        });

        // Player died — stop processing enemies; the deferred path handles game over.
        if (killed) break;
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
        // Reposition health bar at new tile coordinates.
        this._updateHealthBar(enemy);
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
        // Reposition health bar at new tile coordinates.
        this._updateHealthBar(enemy);
      } else if (result.action === 'creeping_move') {
        // Creeping Mass movement: one tail segment removed, one new segment added
        const { removeSegment, addSegment } = result;
        const seg = enemy.segments.find(s => s.x === removeSegment.x && s.y === removeSegment.y);
        if (seg) {
          this.dungeonMap.setEntity(seg.x, seg.y, null);
          seg.x = addSegment.x;
          seg.y = addSegment.y;
          this.dungeonMap.setEntity(seg.x, seg.y, enemy);
          if (seg.sprite) {
            seg.sprite.setPosition(
              seg.x * TILE_SIZE + TILE_SIZE / 2,
              seg.y * TILE_SIZE + TILE_SIZE / 2,
            );
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
    for (const roamer of this._npcRoamControllers) {
      this._tickNpcRoam(roamer);
    }

    // If any enemy fired a ranged attack, animate all projectiles simultaneously
    // then flash the player and hand control back (or trigger game over).
    if (pendingProjectiles.length > 0) {
      const playerWasKilled = pendingProjectiles.some(p => p.killed);
      this._launchEnemyProjectiles(pendingProjectiles, () => {
        this._flashSprite(this.playerSprite, 0xff8800);
        if (playerWasKilled) {
          this._gameOver();
        } else {
          this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
          this._beginPlayerTurn();
        }
      });
      return;
    }

    this.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    this._beginPlayerTurn();
  }

  /**
   * Fires all pending enemy projectile animations simultaneously.
   * `onComplete` is called once every projectile has reached its target.
   *
   * @param {Array<{fromX: number, fromY: number, toX: number, toY: number, color: number}>} projectiles
   * @param {function} onComplete
   */
  _launchEnemyProjectiles(projectiles, onComplete) {
    let remaining = projectiles.length;
    for (const { fromX, fromY, toX, toY, color } of projectiles) {
      this._animateProjectile(fromX, fromY, toX, toY, () => {
        remaining -= 1;
        if (remaining === 0) onComplete();
      }, color);
    }
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
    // Support multi-segment enemies (e.g. Creeping Mass) by also checking their
    // segments array, so all occupied tiles resolve to the same entity object.
    return this.enemies.find(
      e => (e.x === x && e.y === y) ||
           (e.segments && e.segments.some(s => s.x === x && s.y === y)),
    ) || this.npcs.find(n => n.x === x && n.y === y) || null;
  }

  /**
   * Handles a pointer click or touch on the game canvas.
   * Deactivates the look cursor if active, then shows the LookPanel for the
   * clicked tile (if it is in the player's FOV).  Never advances the turn.
   *
   * @param {Phaser.Input.Pointer} pointer
   */
  _handleLookClick(pointer) {
    // Only act when the player can take input (blocks DPad side-effects, enemy
    // turn animations, and clicks through open UI panels in UIScene).
    if (this.turnManager.state !== TURN_STATE.PLAYER_INPUT) return;

    // A click while the cursor is active deactivates it.
    if (this._lookCursor?.active) {
      this._lookCursor.deactivate();
    }

    // Convert screen-space pointer position to world-space tile coordinates.
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE_SIZE);
    const ty = Math.floor(world.y / TILE_SIZE);

    // Only reveal info for tiles currently in the player's line of sight.
    if (!this.dungeonMap.inBounds(tx, ty)) return;
    if (this.dungeonMap.getFovState(tx, ty) !== FOV_STATE.VISIBLE) return;

    this._showLookInfoAt(tx, ty);
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

  _gameOver() {
    EventBus.emit(GameEvents.LOOK_HIDE);
    this._lookCursor?.deactivate();
    deleteSave(this._slot);
    EventBus.emit(GameEvents.GAME_OVER);
    this.turnManager.setState(TURN_STATE.GAME_OVER);
    EventBus.emit(GameEvents.MESSAGE, 'You died! Press R to restart.');
    this.input.keyboard.once('keydown-R', () => this._restart());
    EventBus.once(GameEvents.RESTART_GAME, () => this._restart());
  }

  _restart() {
    this._autosaveTimer?.stop();
    EventBus.emit(GameEvents.LOOK_HIDE);
    this._lookCursor?.deactivate();
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
    // Include equipment bonuses so the HUD shows effective ATK/DEF, not base values.
    this.registry.set('playerStats', { ...s, attack: this.player.attackPower, defense: this.player.defensePower });
    this.registry.set('floor', this.floorManager.currentFloor);
    this.registry.set('inventory', [...this.player.inventory]);
    this.registry.set('playerGold', this.player.gold);
  }
}
