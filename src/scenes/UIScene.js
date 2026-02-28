import Phaser from 'phaser';
import { HUD } from '../ui/HUD.js';
import { DPad } from '../ui/DPad.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { MessageLog } from '../ui/MessageLog.js';
import { EventBus } from '../utils/EventBus.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.cameras.main.setScroll(0, 0);

    this._playerRef = null;

    this.hud = new HUD(this);
    this.messageLog = new MessageLog(this);
    this.inventoryPanel = new InventoryPanel(this);
    this.dpad = new DPad(this);

    // Messages from game
    EventBus.on('message', (text) => this.messageLog.addMessage(text), this);

    // Inventory toggle — GameScene emits 'open-inventory' with data
    EventBus.on('open-inventory', ({ inventory, player }) => {
      this._playerRef = player;
      this.inventoryPanel.toggle(inventory, player);
    }, this);

    // Registry → HUD
    this.registry.events.on('changedata-playerHP', (parent, value) => {
      const maxHp = this.registry.get('playerMaxHp') || 30;
      this.hud.updateHP(value, maxHp);
    });

    this.registry.events.on('changedata-playerStats', (parent, stats) => {
      if (stats) this.hud.updateStats(stats);
    });

    this.registry.events.on('changedata-floor', (parent, floor) => {
      this.hud.updateFloor(floor);
    });

    this.scale.on('resize', this._onResize, this);
  }

  _onResize(gameSize) {
    const { width, height } = gameSize;
    this.hud?.resize(width, height);
    this.messageLog?.resize(width, height);
    this.inventoryPanel?.resize(width, height);
    this.dpad?.resize(width, height);
  }
}
