import Phaser from 'phaser';
import { FloorManager } from '../systems/FloorManager.js';
import { TurnManager, TURN_STATE } from '../systems/TurnManager.js';
import { resolveMeleeAttack } from '../systems/CombatSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Item } from '../items/Item.js';
import { getSpawnTable, getEnemiesPerRoom } from '../entities/EnemyTypes.js';
import { getFloorLoot } from '../items/ItemTypes.js';
import { computeFOV } from '../fov/ShadowcastFOV.js';
import { EventBus } from '../utils/EventBus.js';
import { DIR, DIR_DELTA } from '../utils/Direction.js';
import { TILE, FOV_STATE } from '../utils/TileTypes.js';
import { createRNG } from '../utils/RNG.js';

const TILE_SIZE = 16;
const FOV_RADIUS = 8;
const MOVE_DURATION = 80;

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

    // Entities lists
    this.enemies = [];
    this.items = [];  // floor items (not in inventory)

    // Player
    this.player = new Player(0, 0);

    // Generate first floor
    this._buildFloor(this.floorManager.generateFloor());

    // Input
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
    const floor = this.floorManager.currentFloor;
    const spawnTable = getSpawnTable(floor);
    const perRoom = getEnemiesPerRoom(floor);

    for (let i = 1; i < rooms.length; i++) {
      const room = rooms[i];
      const count = this.rng.nextInt(0, perRoom);
      for (let j = 0; j < count; j++) {
        const type = this.rng.pick(spawnTable);
        // Random position within room
        const ex = this.rng.nextInt(room.x + 1, room.x + room.w - 2);
        const ey = this.rng.nextInt(room.y + 1, room.y + room.h - 2);
        if (!this._getEntityAt(ex, ey)) {
          this._spawnEnemy(ex, ey, type);
        }
      }
    }
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

    this.input.keyboard.on('keydown-I', () => this._toggleInventory());
    this.input.keyboard.on('keydown-PERIOD', () => this._tryUseStairs());
    this.input.keyboard.on('keydown-GREATER_THAN', () => this._tryUseStairs());

    // Arrow keys with justDown
    this.input.keyboard.on('keydown-UP',    () => this._handleDir(DIR.UP));
    this.input.keyboard.on('keydown-DOWN',  () => this._handleDir(DIR.DOWN));
    this.input.keyboard.on('keydown-LEFT',  () => this._handleDir(DIR.LEFT));
    this.input.keyboard.on('keydown-RIGHT', () => this._handleDir(DIR.RIGHT));
    this.input.keyboard.on('keydown-W',     () => this._handleDir(DIR.UP));
    this.input.keyboard.on('keydown-S',     () => this._handleDir(DIR.DOWN));
    this.input.keyboard.on('keydown-A',     () => this._handleDir(DIR.LEFT));
    this.input.keyboard.on('keydown-D',     () => this._handleDir(DIR.RIGHT));
  }

  _setupEvents() {
    // D-pad presses from UIScene
    EventBus.on('dpad-press', (dir) => this._handleDir(dir), this);
    EventBus.on('toggle-inventory', () => this._toggleInventory(), this);
    EventBus.on('use-stairs', () => this._tryUseStairs(), this);
    EventBus.on('inventory-use', (index) => this._useInventoryItem(index), this);
    EventBus.on('floor-changed', (floor) => {
      this.registry.set('floor', floor);
    }, this);
  }

  _handleDir(dir) {
    if (!this.turnManager.isAcceptingInput()) return;
    const { dx, dy } = DIR_DELTA[dir];
    this._doPlayerMove(dx, dy);
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
        EventBus.emit('message', message);
        this._flashSprite(target.sprite, 0xff4444);

        if (killed) {
          const leveled = this.player.gainXP(target.xp);
          if (leveled) {
            EventBus.emit('message', `Level up! You are now level ${this.player.stats.level}!`);
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
    EventBus.emit('message', msg);

    if (this.player.inventory.includes(item)) {
      // Successfully picked up
      this.items.splice(itemIndex, 1);
      if (item.sprite) item.sprite.destroy();
      this._syncRegistry();
    }
  }

  _showStairsPrompt() {
    EventBus.emit('message', 'You stand on the stairs. Press > or tap ▼▼ to descend.');
  }

  _tryUseStairs() {
    if (!this.turnManager.isAcceptingInput()) return;
    const tileType = this.dungeonMap.getTile(this.player.x, this.player.y);
    if (tileType === TILE.STAIRS_DOWN) {
      this._descend();
    } else {
      EventBus.emit('message', 'No stairs here.');
    }
  }

  _descend() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      const dungeonData = this.floorManager.descend();
      this._buildFloor(dungeonData);
      this._syncRegistry();
      EventBus.emit('message', `You descend to floor ${this.floorManager.currentFloor}.`);
      this.cameras.main.fadeIn(300, 0, 0, 0);
    });
  }

  _toggleInventory() {
    EventBus.emit('open-inventory', {
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
    EventBus.emit('message', msg);
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
        EventBus.emit('message', message);
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
  }

  // ─── Entity Lookup ────────────────────────────────────────────────────────

  _getEntityAt(x, y) {
    if (this.player && this.player.x === x && this.player.y === y) return this.player;
    return this.enemies.find(e => e.x === x && e.y === y) || null;
  }

  // ─── Game Over ────────────────────────────────────────────────────────────

  _gameOver() {
    this.turnManager.setGameOver();
    EventBus.emit('message', 'You died! Press R to restart.');
    this.input.keyboard.once('keydown-R', () => this._restart());
    EventBus.once('restart-game', () => this._restart());
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
