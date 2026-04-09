import { FONT_FAMILY } from '../utils/FontConfig.js';
import Phaser from 'phaser';
import { HUD } from '../ui/HUD.js';
import { DPad } from '../ui/DPad.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { SkillsPanel } from '../ui/SkillsPanel.js';
import { MessageLog } from '../ui/MessageLog.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { isTouchDevice } from '../utils/TouchDeviceDetector.js';
import { syncHudFromRegistry } from '../ui/HudRegistrySync.js';
import { SellPanel } from '../ui/SellPanel.js';
import { BuyPanel } from '../ui/BuyPanel.js';

/**
 * Horizontal pixel offset from screen centre applied to each shop panel so
 * they appear side-by-side. Each panel shifts away from centre by this amount.
 * Total combined panel width = PANEL_W * 2 + PANEL_GAP = ~450px.
 */
const SHOP_PANEL_OFFSET = 115;

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
    this.skillsPanel = new SkillsPanel(this);
    this.sellPanel = new SellPanel(this);
    this.buyPanel = new BuyPanel(this);
    this.dpad = new DPad(this);
    // Show touch controls only on devices that support touch input
    this.dpad.setVisible(isTouchDevice());

    /**
     * Which shop panel currently owns keyboard focus.
     * 'buy'  → BuyPanel responds to UP/DOWN/ENTER
     * 'sell' → SellPanel responds to UP/DOWN/ENTER
     * @type {'buy'|'sell'}
     */
    this._shopFocus = 'buy';

    this._setupShopKeyboard();

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

    // Gold changes — update HUD and refresh BuyPanel (stock may have changed after a purchase)
    EventBus.on(GameEvents.PLAYER_GOLD_CHANGED, (gold) => {
      this.hud.updateGold(gold);
      this.buyPanel.updateGold(gold);
      // Refresh the buy panel so it shows the updated stock and gold balance
      this.buyPanel.refresh();
    }, this);

    // Open (or toggle) the buy panel when the player bumps a shop door.
    // Positioned to the LEFT of centre; sell panel goes to the RIGHT.
    EventBus.on(GameEvents.OPEN_BUY_PANEL, ({ shopType, shopStock, player }) => {
      this._shopFocus = 'buy';
      this.buyPanel.show(shopType, shopStock, player, -SHOP_PANEL_OFFSET);
    }, this);

    // Open (or toggle) the sell panel when the player bumps a shop door.
    EventBus.on(GameEvents.OPEN_SELL_PANEL, ({ shopType, inventory, player }) => {
      this.sellPanel.show(shopType, inventory, player, SHOP_PANEL_OFFSET);
    }, this);

    // Refresh sell panel when inventory changes after a sale or purchase
    EventBus.on(GameEvents.INVENTORY_CHANGED, (inventory) => {
      this.sellPanel.refresh(inventory);
    }, this);

    // Closing the sell panel also closes the buy panel (they open/close together).
    EventBus.on(GameEvents.CLOSE_SELL_PANEL, () => {
      this.sellPanel?.hide();
      this.buyPanel?.hide();
    }, this);

    // Closing the buy panel also closes the sell panel.
    EventBus.on(GameEvents.CLOSE_BUY_PANEL, () => {
      this.buyPanel?.hide();
      this.sellPanel?.hide();
    }, this);

    // Refresh buy panel stock after a purchase
    EventBus.on(GameEvents.BUY_PANEL_TOGGLED, () => {
      // No-op currently; BuyPanel manages its own stock via shopStock reference.
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

    this.registry.events.on('changedata-playerGold', (parent, gold) => {
      this.hud.updateGold(gold);
    });

    // GameScene.create() runs before UIScene.create(), so the initial
    // registry.set() calls happen before the changedata-* listeners above are
    // registered.  Eagerly read the current values now to ensure the HUD
    // reflects the correct initial state (including dev-option overrides).
    syncHudFromRegistry(this.registry, this.hud);

    // GameScene sends CLOSE_MESSAGE_LOG when ESC is pressed while the panel is open.
    EventBus.on(GameEvents.CLOSE_MESSAGE_LOG, () => this.messageLog?.close(), this);

    // Mouse wheel scrolls the history panel when it is open.
    this._onWheel = (e) => {
      if (this.messageLog) {
        this.messageLog.scrollHistory(e.deltaY > 0 ? 3 : -3);
      }
    };
    window.addEventListener('wheel', this._onWheel, { passive: true });

    this.scale.on('resize', this._onResize, this);

    // Clean up DOM listener when the scene shuts down (e.g. game over).
    this.events.once('shutdown', () => {
      window.removeEventListener('wheel', this._onWheel);
    });
  }

  /**
   * Registers keyboard handlers for shop panel navigation.
   *
   * When a shop is open:
   *  - LEFT arrow  → focus BuyPanel
   *  - RIGHT arrow → focus SellPanel
   *  - UP / W      → navigate up in the focused panel
   *  - DOWN / S    → navigate down in the focused panel
   *  - ENTER       → buy / sell the highlighted item in the focused panel
   *
   * These listeners are always registered; they only act when a shop panel
   * is visible (GameScene sets TurnManager to SHOP state, blocking movement).
   */
  _setupShopKeyboard() {
    const kb = this.input.keyboard;

    kb.on('keydown-LEFT', () => {
      if (this.buyPanel.visible || this.sellPanel.visible) {
        this._shopFocus = 'buy';
      }
    });

    kb.on('keydown-RIGHT', () => {
      if (this.buyPanel.visible || this.sellPanel.visible) {
        this._shopFocus = 'sell';
      }
    });

    kb.on('keydown-UP', () => {
      if (this._shopFocus === 'buy' && this.buyPanel.visible) {
        this.buyPanel.navigate(-1);
      } else if (this._shopFocus === 'sell' && this.sellPanel.visible) {
        this.sellPanel.navigate(-1);
      }
    });

    kb.on('keydown-DOWN', () => {
      if (this._shopFocus === 'buy' && this.buyPanel.visible) {
        this.buyPanel.navigate(1);
      } else if (this._shopFocus === 'sell' && this.sellPanel.visible) {
        this.sellPanel.navigate(1);
      }
    });

    kb.on('keydown-W', () => {
      if (this._shopFocus === 'buy' && this.buyPanel.visible) {
        this.buyPanel.navigate(-1);
      } else if (this._shopFocus === 'sell' && this.sellPanel.visible) {
        this.sellPanel.navigate(-1);
      }
    });

    kb.on('keydown-S', () => {
      if (this._shopFocus === 'buy' && this.buyPanel.visible) {
        this.buyPanel.navigate(1);
      } else if (this._shopFocus === 'sell' && this.sellPanel.visible) {
        this.sellPanel.navigate(1);
      }
    });

    kb.on('keydown-ENTER', () => {
      if (this._shopFocus === 'buy' && this.buyPanel.visible) {
        this.buyPanel.select();
      } else if (this._shopFocus === 'sell' && this.sellPanel.visible) {
        this.sellPanel.select();
      }
    });
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
      fontFamily: FONT_FAMILY,
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
        fontFamily: FONT_FAMILY,
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
    this.sellPanel?.resize(width, height);
    this.buyPanel?.resize(width, height);
    this.dpad?.resize(width, height);
    // Re-evaluate touch support on resize — handles DevTools device toolbar
    // toggling and detachable touchscreen laptops changing touch capability.
    this.dpad?.setVisible(isTouchDevice());
  }
}
