import Phaser from 'phaser';
import { HUD } from '../ui/HUD.js';
import { DPad } from '../ui/DPad.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { MessageLog } from '../ui/MessageLog.js';
import { EventBus } from '../utils/EventBus.js';
import { isTouchDevice } from '../utils/TouchDeviceDetector.js';

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
    // Show touch controls only on devices that support touch input
    this.dpad.setVisible(isTouchDevice());

    // Messages from game
    EventBus.on('message', (text) => this.messageLog.addMessage(text), this);

    // Level-up screen effect
    EventBus.on('player-level-up', (level) => this._showLevelUpBanner(level), this);

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

  /**
   * Displays a brief "LEVEL UP!" banner centred on screen that fades in,
   * holds for 800 ms, then fades out and destroys itself.  Rendered above all
   * other HUD elements (depth 500).
   *
   * @param {number} level - The new character level to display.
   */
  _showLevelUpBanner(level) {
    const { width, height } = this.scale;
    const txt = this.add.text(width / 2, height / 3, `LEVEL UP!\nLevel ${level}`, {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffdd88',
      stroke: '#884400',
      strokeThickness: 4,
      resolution: 2,
      align: 'center',
    }).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(500);

    // Fade in, hold, fade out, then destroy.
    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 200,
      onComplete: () => {
        this.tweens.add({
          targets: txt,
          alpha: 0,
          delay: 800,
          duration: 400,
          onComplete: () => txt.destroy(),
        });
      },
    });
  }

  _onResize(gameSize) {
    const { width, height } = gameSize;
    this.hud?.resize(width, height);
    this.messageLog?.resize(width, height);
    this.inventoryPanel?.resize(width, height);
    this.dpad?.resize(width, height);
    // Re-evaluate touch support on resize — handles DevTools device toolbar
    // toggling and detachable touchscreen laptops changing touch capability.
    this.dpad?.setVisible(isTouchDevice());
  }
}
