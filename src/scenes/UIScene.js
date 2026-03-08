import Phaser from 'phaser';
import { HUD } from '../ui/HUD.js';
import { DPad } from '../ui/DPad.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { MessageLog } from '../ui/MessageLog.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { isTouchDevice } from '../utils/TouchDeviceDetector.js';
import { syncHudFromRegistry } from '../ui/HudRegistrySync.js';

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
    EventBus.on(GameEvents.MESSAGE, (text) => this.messageLog.addMessage(text), this);

    // Level-up screen effect
    EventBus.on(GameEvents.PLAYER_LEVEL_UP, (level) => this._showLevelUpBanner(level), this);

    // Achievement unlocked banner
    EventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, (achievement) => this._showAchievementBanner(achievement), this);

    // Inventory toggle — GameScene emits OPEN_INVENTORY with data
    EventBus.on(GameEvents.OPEN_INVENTORY, ({ inventory, player }) => {
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

    // GameScene.create() runs before UIScene.create(), so the initial
    // registry.set() calls happen before the changedata-* listeners above are
    // registered.  Eagerly read the current values now to ensure the HUD
    // reflects the correct initial state (including dev-option overrides).
    syncHudFromRegistry(this.registry, this.hud);

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

  /**
   * Displays a prominent "ACHIEVEMENT UNLOCKED!" banner with the achievement
   * name.  More visually distinct than the level-up banner — uses a cyan/teal
   * colour scheme and a longer hold time to give the player time to read it.
   * Self-destructs after the animation completes.
   *
   * @param {import('../achievements/AchievementDefinitions.js').AchievementDefinition} achievement
   */
  _showAchievementBanner(achievement) {
    const { width, height } = this.scale;
    const txt = this.add.text(
      width / 2, height / 4,
      `ACHIEVEMENT UNLOCKED!\n${achievement.name}`,
      {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#88ffee',
        stroke: '#004433',
        strokeThickness: 4,
        resolution: 2,
        align: 'center',
      }
    ).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(510);

    // Fade in, hold longer than level-up, fade out, then destroy.
    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        this.tweens.add({
          targets: txt,
          alpha: 0,
          delay: 1500,
          duration: 500,
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
