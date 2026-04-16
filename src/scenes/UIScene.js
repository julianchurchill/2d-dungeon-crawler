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
import { syncHudFromRegistry, attachHudRegistryListeners, detachHudRegistryListeners } from '../ui/HudRegistrySync.js';
import { DisplayCasePanel } from '../ui/DisplayCasePanel.js';
import { ShopPanel } from '../ui/ShopPanel.js';
import { DialoguePanel } from '../ui/DialoguePanel.js';
import { EquipmentPanel } from '../ui/EquipmentPanel.js';

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
    this.equipmentPanel = new EquipmentPanel(this);
    this.skillsPanel = new SkillsPanel(this);
    this.shopPanel = new ShopPanel(this);
    this.dialoguePanel = new DialoguePanel(this);
    this.displayCasePanel = new DisplayCasePanel(this);
    this.dpad = new DPad(this);
    // Show touch controls only on devices that support touch input
    this.dpad.setVisible(isTouchDevice());

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
      // Show or hide the equipment panel in sync with the inventory panel.
      if (this.inventoryPanel.visible) {
        this.equipmentPanel.show(player);
      } else {
        this.equipmentPanel.hide();
      }
    }, this);

    // Gold changes — update HUD and the shop panel gold display
    EventBus.on(GameEvents.PLAYER_GOLD_CHANGED, (gold) => {
      this.hud.updateGold(gold);
      this.shopPanel.updateGold(gold);
    }, this);

    // Open the combined shop panel when the player bumps a shop door.
    EventBus.on(GameEvents.OPEN_SHOP_PANEL, ({ shopType, shopStock, inventory, player }) => {
      this.shopPanel.show(shopType, shopStock, inventory, player);
    }, this);

    // Refresh sell section when inventory changes after a sale or purchase
    EventBus.on(GameEvents.INVENTORY_CHANGED, (inventory) => {
      this.shopPanel.refresh(inventory);
    }, this);

    // Close the shop panel
    EventBus.on(GameEvents.CLOSE_SELL_PANEL, () => {
      this.shopPanel?.hide();
    }, this);

    // Open dialogue panel when the player talks to an NPC
    EventBus.on(GameEvents.OPEN_DIALOGUE, ({ npcName, line }) => {
      this.dialoguePanel.show(npcName, line);
    }, this);

    // Close dialogue panel
    EventBus.on(GameEvents.CLOSE_DIALOGUE, () => {
      this.dialoguePanel?.hide();
    }, this);

    // Open the display case panel when the player enters their home
    EventBus.on(GameEvents.OPEN_DISPLAY_CASE, ({ displayCase, inventory, player }) => {
      this.displayCasePanel.show(displayCase, inventory, player);
    }, this);

    // Close the display case panel
    EventBus.on(GameEvents.CLOSE_DISPLAY_CASE, () => {
      this.displayCasePanel?.hide();
    }, this);

    // Refresh the display case panel when items are stored or retrieved
    EventBus.on(GameEvents.DISPLAY_CASE_CHANGED, ({ displayCase, inventory }) => {
      this.displayCasePanel?.refresh(displayCase, inventory);
    }, this);

    // Registry → HUD (listeners are detached on shutdown to prevent stale
    // callbacks firing against destroyed game objects after a restart).
    this._hudListenerHandle = attachHudRegistryListeners(this.registry.events, this.registry, this.hud);

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

    // Clean up listeners when the scene shuts down (e.g. game over / restart).
    // Removing registry listeners prevents stale callbacks from firing against
    // destroyed HUD game objects on the next game restart.
    this.events.once('shutdown', () => {
      window.removeEventListener('wheel', this._onWheel);
      detachHudRegistryListeners(this._hudListenerHandle);
    });
  }

  /**
   * Registers keyboard handlers for shop panel navigation.
   *
   * When the shop panel is open:
   *  - UP / W    → navigate up
   *  - DOWN / S  → navigate down
   *  - ENTER     → buy or sell the highlighted item
   *
   * These listeners are always registered; they only act when the shop panel
   * is visible (GameScene sets TurnManager to SHOP state, blocking movement).
   */
  _setupShopKeyboard() {
    const kb = this.input.keyboard;

    kb.on('keydown-UP', () => {
      if (this.shopPanel.visible) this.shopPanel.navigate(-1);
      else if (this.displayCasePanel.visible) this.displayCasePanel.navigate(-1);
    });

    kb.on('keydown-DOWN', () => {
      if (this.shopPanel.visible) this.shopPanel.navigate(1);
      else if (this.displayCasePanel.visible) this.displayCasePanel.navigate(1);
    });

    kb.on('keydown-W', () => {
      if (this.shopPanel.visible) this.shopPanel.navigate(-1);
      else if (this.displayCasePanel.visible) this.displayCasePanel.navigate(-1);
    });

    kb.on('keydown-S', () => {
      if (this.shopPanel.visible) this.shopPanel.navigate(1);
      else if (this.displayCasePanel.visible) this.displayCasePanel.navigate(1);
    });

    kb.on('keydown-ENTER', () => {
      if (this.dialoguePanel.visible) {
        EventBus.emit(GameEvents.CLOSE_DIALOGUE);
      } else if (this.shopPanel.visible) {
        this.shopPanel.select();
      } else if (this.displayCasePanel.visible) {
        this.displayCasePanel.select();
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
    this.equipmentPanel?.resize(width, height);
    this.shopPanel?.resize(width, height);
    this.dialoguePanel?.resize(width, height);
    this.displayCasePanel?.resize(width, height);
    this.dpad?.resize(width, height);
    // Re-evaluate touch support on resize — handles DevTools device toolbar
    // toggling and detachable touchscreen laptops changing touch capability.
    this.dpad?.setVisible(isTouchDevice());
  }
}
