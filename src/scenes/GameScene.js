import Phaser from 'phaser';
import { FloorManager } from '../systems/FloorManager.js';
import { TurnManager, TURN_STATE } from '../systems/TurnManager.js';
import { resolveMeleeAttack } from '../systems/CombatSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { CreepingMass } from '../entities/CreepingMass.js';
import { OldBones } from '../entities/OldBones.js';
import { Npc } from '../entities/Npc.js';
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
import { tilesetManager } from '../systems/TilesetManager.js';
import { RunMovementController } from '../systems/RunMovementController.js';
import { applyToGame, devOptions } from '../systems/DevOptions.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { ENEMY_DEFS } from '../entities/EnemyTypes.js';
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
import { getProgress, achievementStore } from '../achievements/AchievementStore.js';
import { ShopSystem } from '../systems/ShopSystem.js';
import { generateShopItems } from '../items/ShopInventory.js';
import { isTouchDevice } from '../utils/TouchDeviceDetector.js';
import { NpcRoamController } from '../systems/NpcRoamController.js';
import { LookPanel } from '../ui/LookPanel.js';
import { LookCursor } from '../ui/LookCursor.js';
import { findRangedTarget, resolveRangedAttack } from '../systems/RangedCombat.js';

// TILE_SIZE is initialised from TilesetManager in GameScene.create() so it
// reflects the active tileset (16 for Classic/Modern, 32 for HD) each time
// the scene starts.  Declared as let so the module-level references below
// stay simple while still being writable at create-time.
let TILE_SIZE = 16;
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

    // Resolve tile size and camera zoom from the active tileset.
    // TILE_SIZE is a module-level let so all methods in this file pick it up
    // without needing it passed as a parameter.
    TILE_SIZE = tilesetManager.getTileSize();
    this.cameras.main.setZoom(tilesetManager.getCameraZoom());

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

    // Entities lists
    this.enemies = [];
    this.npcs = [];
    this._npcRoamControllers = [];
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

    // Look panel — shows cell info on click/touch; does not advance the turn.
    this._lookPanel = new LookPanel(this);
    this._onLookResize = ({ width, height }) => this._lookPanel.resize(width, height);
    this.scale.on('resize', this._onLookResize);
    this.events.once('shutdown', () => this.scale.off('resize', this._onLookResize));

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
    this.dungeonMap = map;
    this.rooms = rooms;
    // shops is populated by TownGenerator; regular dungeon floors have none.
    // Each shop gets a generated stock of items to sell, keyed by player level.
    this.shops = (shops ?? []).map(s => ({
      ...s,
      stock: generateShopItems(s.type, this.player.stats.level, this.rng),
    }));

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

    // Spawn enemies (skip start room)
    this._spawnEnemies(rooms);

    // Boss spawning: dev override takes priority over normal floor logic
    if (devOptions.bossQuantities !== null) {
      this._spawnDevBosses(rooms, devOptions.bossQuantities);
    } else {
      this._trySpawnOldBones(rooms);
    }

    // Spawn items
    this._spawnItems(rooms);

    // Spawn NPCs (town only — npcDefs is populated by TownGenerator)
    this._spawnNpcs(npcDefs ?? []);

    // Update FOV
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
      [TILE.FLOOR]:       tk('tile_town_floor'),
      [TILE.WALL]:        tk('tile_town_wall'),
      [TILE.DOOR]:        tk('tile_door'),
      [TILE.STAIRS_DOWN]: tk('tile_town_stairs'),
      [TILE.TOWN_ACCENT]: tk('tile_town_accent'),
      [TILE.SHOP_ROOF]:   tk('tile_shop_roof'),
      [TILE.HOME_DOOR]:   tk('tile_home_door'),
    } : {
      [TILE.FLOOR]:       tk('tile_floor'),
      [TILE.WALL]:        tk('tile_wall'),
      [TILE.DOOR]:        tk('tile_door'),
      [TILE.STAIRS_DOWN]: tk('tile_stairs'),
      [TILE.STAIRS_UP]:   tk('tile_stairs_up'),
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
      (x, y)       => this._getEntityAt(x, y),
      (x, y, type) => this._spawnEnemy(x, y, type),
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

  _spawnEnemy(x, y, type) {
    if (type === 'creeping_mass') {
      this._spawnCreepingMass(x, y);
      return;
    }
    // Old Bones must be constructed as OldBones (not plain Enemy) so that boss
    // properties — isBoss, minionsSpawned, dropGold, dropItem — are present.
    const enemy = type === 'old_bones' ? new OldBones(x, y, this.rng) : new Enemy(x, y, type);

    // Scale HP and ATK by the active difficulty (bosses are exempt).
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
    enemy.sprite = sprite;
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
      }
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
    // 'l' — toggle look cursor (non-touch devices only).
    if (!isTouchDevice()) {
      this.input.keyboard.on('keydown-L', wrapWithRunCancel(this._runController, () => {
        if (this._lookCursor?.active) {
          this._lookCursor.deactivate();
          this._lookPanel.hide();
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
        this._lookPanel.hide();
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
    EventBus.on(GameEvents.INVENTORY_USE, (index) => this._useInventoryItem(index), this);
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

    const { damage, killed, messages } = resolveRangedAttack(
      this.player, target, this.rng,
      { defenderIsInvincible: devOptions.enemiesInvincible },
    );
    messages.forEach(msg => EventBus.emit(GameEvents.MESSAGE, msg));

    // Flash all sprites for multi-segment enemies (e.g. Creeping Mass), otherwise the single sprite.
    if (target.segments) {
      for (const seg of target.segments) this._flashSprite(seg.sprite, 0xff4444);
    } else {
      this._flashSprite(target.sprite, 0xff4444);
    }

    // Clean up any segments removed by proportional HP loss (Creeping Mass).
    this._applyPendingRemovedSegments(target);

    if (killed) {
      EventBus.emit(GameEvents.ENEMY_KILLED, target.type);
      if (target.isBoss) this._applyBossLoot(target);

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
    this._lookPanel?.hide();

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

    this.turnManager.setState(TURN_STATE.PLAYER_ACTING);

    if (result.action === 'attacked') {
      this._playerAttack(result.target);
    } else if (result.action === 'moved' || result.action === 'stairs' || result.action === 'stairs_up') {
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
    } else if (action === 'stairs_up') {
      this._showStairsUpPrompt();
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
          this._flashSprite(target.sprite, 0xff4444);
        }

        // Handle segments removed by damage (proportional HP loss for Creeping Mass)
        this._applyPendingRemovedSegments(target);

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
   * Shows a message when the player steps onto up-stairs.
   */
  _showStairsUpPrompt() {
    EventBus.emit(GameEvents.MESSAGE, 'You stand on the stairs leading up. Press > or tap ▼▼ to ascend.');
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
    } else if (tileType === TILE.STAIRS_UP) {
      this._ascend();
    } else {
      EventBus.emit(GameEvents.MESSAGE, 'No stairs here.');
    }
  }

  _descend() {
    this._lookPanel?.hide();
    this._lookCursor?.deactivate();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      const dungeonData = this.floorManager.descend();
      this._buildFloor(dungeonData);
      this._lookCursor?.updateMap(this.dungeonMap, TILE_SIZE);
      this._syncRegistry();
      EventBus.emit(GameEvents.MESSAGE, `You descend to floor ${this.floorManager.currentFloor}.`);
      this.cameras.main.fadeIn(300, 0, 0, 0);
    });
  }

  /**
   * Move the player back up one floor (to the town when on floor 1).
   * The player is placed at the stairsPos of the destination floor so they
   * land near the stairs they arrived from.
   */
  _ascend() {
    this._lookPanel?.hide();
    this._lookCursor?.deactivate();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      const dungeonData = this.floorManager.ascend();
      this._buildFloor(dungeonData);
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
    const system = new ShopSystem(shopType);
    const earned = system.sell(this.player, item);
    // Add the sold item back to the shop's stock at a 10% mark-up so the player
    // can buy it back if they change their mind.
    // Only push the buy-back entry when the sale actually succeeded (earned > 0)
    // to guard against mismatched shopType emits or other edge cases.
    if (earned > 0 && this._activeShop) {
      this._activeShop.stock.push(system.createBuyBackEntry(item));
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
        this._lookPanel.showEnemy(entity);
      } else {
        // NPCs have a name but no stats; show their name as the tile label.
        this._lookPanel.showTile(entity.name);
      }
      return;
    }

    const item = this.items.find(i => i.x === tx && i.y === ty);
    if (item) {
      this._lookPanel.showItem(item);
      return;
    }

    this._lookPanel.showTile(this.dungeonMap.getTile(tx, ty));
  }

  // ─── Game Over ────────────────────────────────────────────────────────────

  _gameOver() {
    this._lookPanel?.hide();
    this._lookCursor?.deactivate();
    EventBus.emit(GameEvents.GAME_OVER);
    this.turnManager.setState(TURN_STATE.GAME_OVER);
    EventBus.emit(GameEvents.MESSAGE, 'You died! Press R to restart.');
    this.input.keyboard.once('keydown-R', () => this._restart());
    EventBus.once(GameEvents.RESTART_GAME, () => this._restart());
  }

  _restart() {
    this._lookPanel?.hide();
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
