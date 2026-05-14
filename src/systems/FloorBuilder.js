/**
 * FloorBuilder — constructs and populates a dungeon floor for GameScene.
 *
 * Encapsulates all floor-building and entity-spawning logic that was previously
 * inline in GameScene: tilemap rendering, enemy/item/NPC placement, and unique
 * room construction.  GameScene delegates to an instance of this class, keeping
 * its own responsibility limited to orchestration and player-interaction.
 */

import { Item } from '../items/Item.js';
import { getFloorLoot, getChallengeLoot, getPickAxeFloorDrop, getHiddenRoomLoot } from '../items/LootTables.js';
import { ITEM_TYPES } from '../items/ItemTypes.js';
import { UNIQUE_ROOM_DEFS } from '../dungeon/UniqueRoomDefinitions.js';
import { uniqueRoomRegistry } from '../dungeon/UniqueRoomRegistry.js';
import { placeDecorations } from '../dungeon/RoomDecorationPlacer.js';
import { isInnerRoomSpaceAvailable } from '../dungeon/LockedRoomPlacer.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { TILE } from '../utils/TileTypes.js';
import { tilesetManager } from '../systems/TilesetManager.js';
import { devOptions } from '../systems/DevOptions.js';
import { ENEMY_DEFS, getSpawnTable } from '../entities/EnemyTypes.js';
import { difficultyManager } from '../systems/DifficultyManager.js';
import { getProgress, achievementStore } from '../achievements/AchievementStore.js';
import { Npc } from '../entities/Npc.js';
import { NpcRoamController } from '../systems/NpcRoamController.js';
import { DEFAULT_CHAMPION_CHANCE } from '../systems/EnemySpawner.js';

export class FloorBuilder {
  /**
   * @param {import('../scenes/GameScene.js').GameScene} scene
   */
  constructor(scene) {
    /** @private */
    this._scene = scene;
  }

  /** @returns {number} Current tile size from the active tileset. */
  get _tileSize() { return tilesetManager.getTileSize(); }

  // ── Public methods (called from GameScene._buildFloor) ────────────────────

  /**
   * Builds the tilemap render texture and shadow layer for the given map.
   * @param {object} map - The dungeon map data.
   */
  buildTilemap(map) {
    const sc = this._scene;
    this._buildMapGraphics(map, sc.floorManager.isTown(), sc.shops);
    this._buildShadowLayer(map);
  }

  /**
   * Spawns enemies into rooms using the enemy spawner, skipping the start room.
   * @param {object[]} rooms
   */
  spawnEnemies(rooms) {
    const sc = this._scene;
    sc._enemySpawner.spawnForRooms(
      rooms,
      sc.floorManager.currentFloor,
      // Treat non-walkable tiles (e.g. pillar walls inside rooms) as occupied
      // so enemies are never placed on top of wall tiles.
      (x, y) => !sc.dungeonMap.isWalkable(x, y) || sc._getEntityAt(x, y),
      (x, y, type, options) => sc._spawnEnemy(x, y, type, options),
    );
  }

  /**
   * Fills the challenge arena room with enemies, guaranteeing at least one
   * champion.  Boss and solitary types are excluded from the pool.
   * @param {object} arenaRoom
   * @param {number} floor
   */
  spawnChallengeArena(arenaRoom, floor) {
    const sc = this._scene;
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
      const type = sc.rng.pick(eligibleTypes);
      const ex = sc.rng.nextInt(arenaRoom.x + 1, arenaRoom.x + arenaRoom.w - 2);
      const ey = sc.rng.nextInt(arenaRoom.y + 1, arenaRoom.y + arenaRoom.h - 2);
      if (sc._getEntityAt(ex, ey)) {
        // Tile occupied — retry this slot
        i--;
        attempts++;
        continue;
      }
      // Guarantee at least one champion; after that use normal 10% chance.
      const isChampion = !championSpawned || sc.rng.next() < DEFAULT_CHAMPION_CHANCE;
      sc._spawnEnemy(ex, ey, type, { isChampion });
      if (isChampion) championSpawned = true;
      attempts++;
    }
  }

  /**
   * Spawns dev-specified boss types at room centres.
   * @param {object[]} rooms
   * @param {Record<string, number>} quantities - Map of enemy type → count.
   */
  spawnDevBosses(rooms, quantities) {
    const sc = this._scene;
    const candidates = rooms.slice(1);
    for (const [type, count] of Object.entries(quantities)) {
      let spawned = 0;
      for (const room of candidates) {
        if (spawned >= count) break;
        const cx = Math.floor(room.x + room.w / 2);
        const cy = Math.floor(room.y + room.h / 2);
        if (!sc._getEntityAt(cx, cy)) {
          sc._spawnEnemy(cx, cy, type);
          spawned++;
        }
      }
    }
  }

  /**
   * Spawns dev-specified champion types at room centres.
   * @param {object[]} rooms
   * @param {Record<string, number>} quantities - Map of enemy type → count.
   */
  spawnDevChampions(rooms, quantities) {
    const sc = this._scene;
    const candidates = rooms.slice(1);
    for (const [type, count] of Object.entries(quantities)) {
      let spawned = 0;
      for (const room of candidates) {
        if (spawned >= count) break;
        const cx = Math.floor(room.x + room.w / 2);
        const cy = Math.floor(room.y + room.h / 2);
        if (!sc._getEntityAt(cx, cy)) {
          sc._spawnEnemy(cx, cy, type, { isChampion: true });
          spawned++;
        }
      }
    }
  }

  /**
   * Conditionally spawns the Old Bones boss on floors 10–15 when the player
   * has not yet earned the old_bones_slayer achievement.
   * @param {object[]} rooms
   */
  trySpawnOldBones(rooms) {
    const sc = this._scene;
    const floor = sc.floorManager.currentFloor;
    if (floor < 10 || floor > 15) return;
    if (getProgress('old_bones_slayer', achievementStore).completed) return;
    if (!sc.rng.nextBool(0.5)) return;

    // Pick a random non-start room (index 1+)
    const candidates = rooms.slice(1);
    if (candidates.length === 0) return;
    const room = sc.rng.pick(candidates);

    // Place boss near room centre, avoiding occupied tiles
    const cx = Math.floor(room.x + room.w / 2);
    const cy = Math.floor(room.y + room.h / 2);
    if (sc._getEntityAt(cx, cy)) return;

    // Delegate to _spawnEnemy so the hint message and boss construction are
    // handled in one place, regardless of whether the boss was placed here or
    // via the dev spawn-weight override.
    sc._spawnEnemy(cx, cy, 'old_bones');
  }

  /**
   * Places floor loot items in rooms (skipping the start room).
   * Challenge floors use potions-only loot; regular floors use the standard pool.
   * @param {object[]} rooms
   */
  spawnItems(rooms) {
    const sc = this._scene;
    const floor = sc.floorManager.currentFloor;
    // Build the set of achievement-unlocked item ids for this run.
    const unlockedItems = new Set();
    if (getProgress('sprite_stalker', achievementStore).completed) {
      unlockedItems.add(ITEM_TYPES.POTION_OF_MINOR_TELEPORTATION.id);
    }
    // Place 1–2 items per room (skip start room).
    // Challenge floors use potions-only loot; regular floors use the standard pool.
    for (let i = 1; i < rooms.length; i++) {
      if (!sc.rng.nextBool(0.6)) continue;
      const room = rooms[i];
      const ix = sc.rng.nextInt(room.x + 1, room.x + room.w - 2);
      const iy = sc.rng.nextInt(room.y + 1, room.y + room.h - 2);
      // Also guard against non-walkable tiles (e.g. pillar walls) so items
      // are never placed inside a wall.
      if (sc.dungeonMap.isWalkable(ix, iy) && !sc._getEntityAt(ix, iy)) {
        const typeDef = sc._isChallengeFloor
          ? getChallengeLoot(sc.rng, unlockedItems)
          : getFloorLoot(floor, sc.rng, unlockedItems);
        this._placeItem(ix, iy, typeDef);
      }
    }
    // 10% chance of a single rare pick axe somewhere on regular floors (forced in dev mode).
    if (!sc._isChallengeFloor && rooms.length > 1) {
      const pickAxeDrop = getPickAxeFloorDrop(sc.rng, devOptions.forcedFloorItems.has('PICK_AXE'));
      if (pickAxeDrop) {
        for (let i = 1; i < rooms.length; i++) {
          const room = rooms[i];
          const ix = sc.rng.nextInt(room.x + 1, room.x + room.w - 2);
          const iy = sc.rng.nextInt(room.y + 1, room.y + room.h - 2);
          if (sc.dungeonMap.isWalkable(ix, iy) && !sc._getEntityAt(ix, iy)) {
            this._placeItem(ix, iy, pickAxeDrop);
            break;
          }
        }
      }
    }
  }

  /**
   * Places two hidden-room loot items per hidden passage.
   * @param {{ room: object }[]} passages
   */
  spawnHiddenRoomItems(passages) {
    const sc = this._scene;
    const floor = sc.floorManager.currentFloor;
    for (const { room } of passages) {
      let placed = 0;
      for (let attempt = 0; attempt < 20 && placed < 2; attempt++) {
        const ix = sc.rng.nextInt(room.x, room.x + room.w - 1);
        const iy = sc.rng.nextInt(room.y, room.y + room.h - 1);
        if (sc.dungeonMap.isWalkable(ix, iy) && !sc._getEntityAt(ix, iy)) {
          this._placeItem(ix, iy, getHiddenRoomLoot(floor, sc.rng));
          placed++;
        }
      }
    }
  }

  /**
   * Rolls for a unique room on the current floor and places it if eligible.
   * @param {object[]} rooms
   */
  trySpawnUniqueRoom(rooms) {
    const sc = this._scene;
    const floor  = sc.floorManager.currentFloor;
    const force  = devOptions.forceUniqueRoom;
    const eligible = uniqueRoomRegistry.getEligible(floor, UNIQUE_ROOM_DEFS, force);
    if (eligible.length === 0) return;

    // When a room is forced via dev options, select it directly so it is
    // guaranteed to spawn regardless of what else is eligible.
    const def = force
      ? eligible.find(d => d.id === force) ?? sc.rng.pick(eligible)
      : sc.rng.pick(eligible);

    // Force option skips the probability check; otherwise roll against def.chance.
    if (force !== def.id && sc.rng.next() >= def.chance) return;

    // Choose a room that is not the start room (index 0) and, where possible,
    // not the stairs room, to give the player room to explore.
    const candidates = rooms.length > 2 ? rooms.slice(1, -1) : rooms.slice(1);
    if (candidates.length === 0) return;
    const room = sc.rng.pick(candidates);

    uniqueRoomRegistry.markSeen(def.id);
    this._spawnUniqueRoom(room, def);
    sc._entryTracker.setRoom(room, def);

    // Notify the player that something unusual is on this floor after a short
    // delay so the UIScene message log is ready to receive it.
    sc.time.delayedCall(250, () => {
      EventBus.emit(GameEvents.MESSAGE, 'You sense a place of power on this floor.');
    });
  }

  /**
   * Repaints unique room floor and wall tiles onto mapRT.  Used when restoring
   * a floor from a save or snapshot so the themed tiles are not lost after
   * buildTilemap resets the render texture.
   *
   * @param {{ x:number, y:number, w:number, h:number }} room
   * @param {{ floorKey:string, wallKey:string }} def
   */
  paintUniqueRoomTiles(room, def) {
    this._paintUniqueRoomTiles(room, def);
  }

  /**
   * Restores dungeon NPCs from serialised floor state, using the same
   * _spawnDungeonNpc code path so NPCs do not get a NpcRoamController
   * (dungeon NPCs must not wander).
   *
   * @param {Array<{ x:number, y:number, name:string, spriteKey:string, lines:string[], lineIndex:number }>} npcSaveData
   */
  restoreNpcs(npcSaveData) {
    const sc = this._scene;
    for (const saved of npcSaveData) {
      this._spawnDungeonNpc(saved.x, saved.y, {
        name: saved.name,
        spriteKey: saved.spriteKey,
        lines: saved.lines,
      });
      if (saved.lineIndex != null) {
        sc.npcs[sc.npcs.length - 1]._lineIndex = saved.lineIndex;
      }
    }
  }

  /**
   * Spawns town NPCs from the given definitions array.
   * @param {object[]} npcDefs
   */
  spawnNpcs(npcDefs) {
    const sc = this._scene;
    const ts = this._tileSize;
    for (const def of npcDefs) {
      const npc = new Npc(def.x, def.y, def);
      // Fall back to the player sprite if the NPC texture is not loaded.
      const resolvedKey = tilesetManager.getTileKey(def.spriteKey);
      const textureKey = sc.textures.exists(resolvedKey) ? resolvedKey : tilesetManager.getTileKey('entity_player');
      const sprite = sc.add.sprite(
        def.x * ts + ts / 2,
        def.y * ts + ts / 2,
        textureKey,
      ).setDepth(8).setVisible(true);
      npc.sprite = sprite;
      sc.npcs.push(npc);
      // Register in the entity map so setEntity null/npc is consistent from the first move.
      sc.dungeonMap.setEntity(npc.x, npc.y, npc);
      // Give each NPC its own roam controller; NPCs step every 3 player turns.
      sc._npcRoamControllers.push(new NpcRoamController(npc, { interval: 3, rng: () => sc.rng.next() }));
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Renders all map tiles into a RenderTexture for the scene.
   * @param {object} map
   * @param {boolean} isTown
   * @param {object[]} shops
   */
  _buildMapGraphics(map, isTown = false, shops = []) {
    const sc = this._scene;
    const ts = this._tileSize;
    const mapW = map.width * ts;
    const mapH = map.height * ts;

    // Use a RenderTexture for the entire map (draw once)
    sc.mapRT = sc.add.renderTexture(0, 0, mapW, mapH).setDepth(0).setOrigin(0);

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
      [TILE.BREAKABLE_WALL]:        tk('tile_breakable_wall'),
      [TILE.HIDDEN_PASSAGE_WALL]:   tk('tile_breakable_wall'),
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
          sc.mapRT.drawFrame(key, undefined, x * ts, y * ts);
        }
      }
    }
  }

  /**
   * Creates the shadow graphics object used for FOV rendering.
   * @param {object} _map - Unused; accepted for call-site symmetry.
   */
  _buildShadowLayer(_map) {
    const sc = this._scene;
    // Shadow overlay: array of sprites (one per tile)
    // Using a RenderTexture for performance then updating per-tile via a Graphics layer
    // For simplicity, use individual rectangles grouped in a container
    // But for 80x60 = 4800 tiles that's too many individual objects.
    // Instead use a single Graphics object we redraw on each FOV update.

    sc.shadowGraphics = sc.add.graphics().setDepth(5);
    sc._redrawShadows();
  }

  /**
   * Creates an Item entity with a sprite and adds it to the scene item list.
   * @param {number} x
   * @param {number} y
   * @param {object} typeDef
   */
  _placeItem(x, y, typeDef) {
    const sc = this._scene;
    const ts = this._tileSize;
    const item = new Item(x, y, typeDef);
    const sprite = sc.add.sprite(
      x * ts + ts / 2,
      y * ts + ts / 2,
      tilesetManager.getTileKey(item.textureKey)
    ).setDepth(6).setVisible(false);
    item.sprite = sprite;
    sc.items.push(item);
  }

  /**
   * Places decorations, items, enemies, a locked inner room, and an NPC for
   * the given unique room definition.
   * @param {object} room
   * @param {object} def
   */
  _spawnUniqueRoom(room, def) {
    const sc = this._scene;
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
        const ix = sc.rng.nextInt(room.x + 1, room.x + room.w - 2);
        const iy = sc.rng.nextInt(room.y + 1, room.y + room.h - 2);
        if (sc.dungeonMap.isWalkable(ix, iy) && !sc._getEntityAt(ix, iy)) {
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
        if (sc.dungeonMap.isWalkable(pos.x, pos.y) && !sc._getEntityAt(pos.x, pos.y)) {
          sc._spawnEnemy(pos.x, pos.y, enemySpec.type, { isChampion: enemySpec.isChampion ?? false });
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
        if (sc.dungeonMap.isWalkable(pos.x, pos.y) && !sc._getEntityAt(pos.x, pos.y)) {
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
   * Repaints a unique room's floor and wall tiles with its themed textures.
   * @param {object} room
   * @param {object} def
   * @param {object|null} innerRoom
   */
  _paintUniqueRoomTiles(room, def, innerRoom = null) {
    const sc = this._scene;
    const ts = this._tileSize;
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
      const x1 = Math.min(sc.dungeonMap.width  - 1, rx + rw);
      const y1 = Math.min(sc.dungeonMap.height - 1, ry + rh);
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const tileType = sc.dungeonMap.getTile(tx, ty);
          let key = null;
          if (tileType === TILE.FLOOR && floorKey) key = floorKey;
          else if (tileType === TILE.WALL && wallKey) key = wallKey;
          else if (tileType === TILE.LOCKED_DOOR && lockedDoorKey) key = lockedDoorKey;
          else if (decorTile !== null && tileType === decorTile && decorKey) key = decorKey;
          if (key) sc.mapRT.drawFrame(key, undefined, tx * ts, ty * ts);
        }
      }
    };

    // Paint the parent room (and its surrounding wall ring).
    paintRect(room.x, room.y, room.w, room.h);

    // Paint the inner room (and its surrounding wall ring) if one was carved.
    if (innerRoom) paintRect(innerRoom.x, innerRoom.y, innerRoom.w, innerRoom.h);
  }

  /**
   * Attempts to carve a locked inner room adjacent to one side of the parent
   * room.  Tries all four sides and returns placement data on success, or null
   * if no side has enough space.
   * @param {object} room
   * @param {object} lockedRoomDef
   * @returns {{ doorX: number, doorY: number, innerRoom: object }|null}
   */
  _trySpawnInnerRoom(room, lockedRoomDef) {
    const sc = this._scene;
    const INNER_LONG  = Math.min(room.w - 2, 5);
    const INNER_TALL  = Math.min(room.h - 2, 5);
    const INNER_SHORT = 3;

    // Each entry: a thunk returning { ix, iy, iw, ih, doorX, doorY } or null.
    const sides = [
      () => { // bottom
        const iw = INNER_LONG, ih = INNER_SHORT;
        const ix = room.x + Math.floor((room.w - iw) / 2);
        const iy = room.y + room.h + 1;
        if (!isInnerRoomSpaceAvailable(sc.dungeonMap, ix, iy, iw, ih)) return null;
        return { ix, iy, iw, ih, doorX: ix + Math.floor(iw / 2), doorY: iy - 1 };
      },
      () => { // right
        const iw = INNER_SHORT, ih = INNER_TALL;
        const ix = room.x + room.w + 1;
        const iy = room.y + Math.floor((room.h - ih) / 2);
        if (!isInnerRoomSpaceAvailable(sc.dungeonMap, ix, iy, iw, ih)) return null;
        return { ix, iy, iw, ih, doorX: ix - 1, doorY: iy + Math.floor(ih / 2) };
      },
      () => { // top
        const iw = INNER_LONG, ih = INNER_SHORT;
        const ix = room.x + Math.floor((room.w - iw) / 2);
        const iy = room.y - ih - 1;
        if (!isInnerRoomSpaceAvailable(sc.dungeonMap, ix, iy, iw, ih)) return null;
        return { ix, iy, iw, ih, doorX: ix + Math.floor(iw / 2), doorY: iy + ih };
      },
      () => { // left
        const iw = INNER_SHORT, ih = INNER_TALL;
        const ix = room.x - iw - 1;
        const iy = room.y + Math.floor((room.h - ih) / 2);
        if (!isInnerRoomSpaceAvailable(sc.dungeonMap, ix, iy, iw, ih)) return null;
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
          sc.dungeonMap.setTile(x, y, TILE.FLOOR);
        }
      }

      // Set border walls around the inner room (buildWalls has already run).
      for (let x = ix - 1; x <= ix + iw; x++) {
        if (sc.dungeonMap.getTile(x, iy - 1) !== TILE.FLOOR)
          sc.dungeonMap.setTile(x, iy - 1, TILE.WALL);
        if (sc.dungeonMap.getTile(x, iy + ih) !== TILE.FLOOR)
          sc.dungeonMap.setTile(x, iy + ih, TILE.WALL);
      }
      for (let y = iy; y < iy + ih; y++) {
        if (sc.dungeonMap.getTile(ix - 1, y) !== TILE.FLOOR)
          sc.dungeonMap.setTile(ix - 1, y, TILE.WALL);
        if (sc.dungeonMap.getTile(ix + iw, y) !== TILE.FLOOR)
          sc.dungeonMap.setTile(ix + iw, y, TILE.WALL);
      }

      // Place the locked door in the shared wall between parent and inner room.
      sc.dungeonMap.setTile(doorX, doorY, TILE.LOCKED_DOOR);

      // Place each item at a random walkable position inside the inner room.
      for (const itemKey of lockedRoomDef.items) {
        const typeDef = ITEM_TYPES[itemKey];
        if (!typeDef) continue;
        for (let attempt = 0; attempt < 10; attempt++) {
          const px = sc.rng.nextInt(ix, ix + iw - 1);
          const py = sc.rng.nextInt(iy, iy + ih - 1);
          if (sc.dungeonMap.isWalkable(px, py) && !sc._getEntityAt(px, py)) {
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
   * Delegates to the RoomDecorationPlacer to place decorations in a room.
   * @param {object} room
   * @param {object} decorSpec
   */
  _placeRoomDecorations(room, decorSpec) {
    placeDecorations(this._scene.dungeonMap, room, decorSpec);
  }

  /**
   * Creates a dungeon NPC (non-roaming) and adds it to the scene.
   * @param {number} x
   * @param {number} y
   * @param {object} npcDef
   */
  _spawnDungeonNpc(x, y, npcDef) {
    const sc = this._scene;
    const ts = this._tileSize;
    const npc = new Npc(x, y, npcDef);
    const resolvedKey = tilesetManager.getTileKey(npcDef.spriteKey);
    const textureKey = sc.textures.exists(resolvedKey)
      ? resolvedKey
      : tilesetManager.getTileKey('entity_player');
    const sprite = sc.add.sprite(
      x * ts + ts / 2,
      y * ts + ts / 2,
      textureKey,
    ).setDepth(8).setVisible(false); // revealed by FOV like enemies
    npc.sprite = sprite;
    sc.npcs.push(npc);
    sc.dungeonMap.setEntity(x, y, npc);
    // No NpcRoamController — dungeon NPCs do not wander.
  }
}
