/**
 * @module SellPanel
 * @description A UI panel displayed in town shops, showing the items in the
 * player's inventory that the shop accepts and allowing the player to sell them
 * for gold currency.  Toggled open/closed by bumping the shop door.
 */
import { FONT_FAMILY } from '../utils/FontConfig.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { ShopSystem } from '../systems/ShopSystem.js';

const PANEL_W = 220;
const PANEL_PAD = 14;
const ROW_H = 36;
const TITLE_H = 46;
const FOOTER_H = 20;

/** @type {Object.<string, string>} Maps itemType to emoji icon. */
const ICON_MAP = { consumable: '🧪', weapon: '⚔️', armor: '🛡️' };

/** @type {Object.<string, string>} Maps shopType to display name. */
const SHOP_NAMES = { potion: 'Potion Shop', weapon: 'Weapon Shop', armour: 'Armour Shop' };

export class SellPanel {
  /**
   * @param {Phaser.Scene} scene - UIScene instance.
   */
  constructor(scene) {
    this.scene = scene;
    /** @type {boolean} Whether the panel is currently visible. */
    this.visible = false;
    this._shopType = null;
    this._player = null;
    this._shop = null;
    /** @type {Array<Phaser.GameObjects.GameObject[]>} One array of objects per item row. */
    this._rows = [];
    this._build();
  }

  /** Constructs the static panel chrome (background, title, close button, empty message). */
  _build() {
    const s = this.scene;

    this._container = s.add.container(0, 0)
      .setDepth(300).setScrollFactor(0).setVisible(false);

    // Background — height is adjusted per-refresh to fit the item list
    this._bg = s.add.rectangle(0, 0, PANEL_W, 160, 0x111122, 0.95)
      .setStrokeStyle(2, 0x44aa66).setOrigin(0, 0);
    this._container.add(this._bg);

    // Shop title
    this._title = s.add.text(PANEL_PAD, PANEL_PAD, '', {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#88ffaa',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    });
    this._container.add(this._title);

    // Close button (always visible — touch-friendly; keyboard users bump door again)
    this._closeBtn = s.add.text(PANEL_W - PANEL_PAD, PANEL_PAD, '✕', {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#aaccff',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this._closeBtn.on('pointerover', () => this._closeBtn.setColor('#ffffff'));
    this._closeBtn.on('pointerout',  () => this._closeBtn.setColor('#aaccff'));
    this._closeBtn.on('pointerdown', () => this.hide());
    this._container.add(this._closeBtn);

    // Message shown when the player has no acceptable items
    this._emptyText = s.add.text(PANEL_W / 2, TITLE_H + 10, 'Nothing to sell here.', {
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#888888',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0).setVisible(false);
    this._container.add(this._emptyText);
  }

  /**
   * Opens the panel for the given shop type.
   * If the panel is already showing the same shop, it closes instead (toggle).
   *
   * @param {string} shopType - 'potion', 'weapon', or 'armour'.
   * @param {Item[]} inventory - The player's full inventory.
   * @param {Player} player - The player instance.
   */
  show(shopType, inventory, player) {
    // Bump the same door again → close
    if (this.visible && this._shopType === shopType) {
      this.hide();
      return;
    }
    this._shopType = shopType;
    this._player = player;
    this._shop = new ShopSystem(shopType);
    this._refresh(inventory);
    this.visible = true;
    this._container.setVisible(true);
  }

  /** Hides the sell panel and clears shop state. */
  hide() {
    this.visible = false;
    this._container.setVisible(false);
    this._shopType = null;
  }

  /**
   * Rebuilds the item list after a sale so the panel reflects the updated inventory.
   *
   * @param {Item[]} inventory - The player's updated inventory.
   */
  refresh(inventory) {
    if (!this.visible) return;
    this._refresh(inventory);
  }

  /**
   * Destroys all current item rows and rebuilds them from the given inventory,
   * showing only items the active shop accepts.
   *
   * @param {Item[]} inventory - Inventory to render.
   */
  _refresh(inventory) {
    // Tear down old item rows
    for (const row of this._rows) {
      for (const obj of row) {
        this._container.remove(obj, true);
      }
    }
    this._rows = [];

    const shopName = SHOP_NAMES[this._shopType] ?? 'Shop';
    this._title.setText(`${shopName}\nSell items for gold`);

    const acceptable = inventory.filter(item => this._shop.accepts(item));
    this._emptyText.setVisible(acceptable.length === 0);

    for (let i = 0; i < acceptable.length; i++) {
      const item = acceptable[i];
      const rowY = TITLE_H + i * ROW_H;

      // Separator line above each row
      const sep = this.scene.add.graphics();
      sep.lineStyle(1, 0x334455, 0.7);
      sep.beginPath();
      sep.moveTo(PANEL_PAD, rowY);
      sep.lineTo(PANEL_W - PANEL_PAD, rowY);
      sep.strokePath();

      // Item type icon
      const icon = this.scene.add.text(PANEL_PAD, rowY + ROW_H / 2, ICON_MAP[item.itemType] ?? '?', {
        fontSize: '16px', resolution: 2,
      }).setOrigin(0, 0.5);

      // Item name
      const nameText = this.scene.add.text(PANEL_PAD + 22, rowY + ROW_H / 2, item.name, {
        fontSize: '10px', fontFamily: FONT_FAMILY, color: '#dddddd',
        stroke: '#000000', strokeThickness: 2, resolution: 2,
        wordWrap: { width: 90 },
      }).setOrigin(0, 0.5);

      // Sell button showing the gold value
      const sellBtn = this.scene.add.text(
        PANEL_W - PANEL_PAD, rowY + ROW_H / 2,
        `⬡ ${item.sellPrice}g`,
        {
          fontSize: '10px', fontFamily: FONT_FAMILY, color: '#ffdd44',
          stroke: '#000000', strokeThickness: 2, resolution: 2,
          backgroundColor: '#222233', padding: { x: 6, y: 3 },
        }
      ).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

      sellBtn.on('pointerover', () => sellBtn.setColor('#ffffff'));
      sellBtn.on('pointerout',  () => sellBtn.setColor('#ffdd44'));
      // Capture item reference so closure refers to the correct item even after list rebuild
      const soldItem = item;
      const shopType = this._shopType;
      sellBtn.on('pointerdown', () => {
        EventBus.emit(GameEvents.SELL_ITEM, { shopType, item: soldItem });
      });

      const rowObjs = [sep, icon, nameText, sellBtn];
      for (const obj of rowObjs) this._container.add(obj);
      this._rows.push(rowObjs);
    }

    // Resize background height to fit the item list
    const panelH = TITLE_H + Math.max(1, acceptable.length) * ROW_H + FOOTER_H;
    this._bg.setSize(PANEL_W, panelH);
    this._emptyText.setY(TITLE_H + 10);

    // Re-centre panel vertically on screen
    const { width, height } = this.scene.scale;
    this._container.setPosition(
      Math.floor((width - PANEL_W) / 2),
      Math.floor((height - panelH) / 2),
    );
  }

  /**
   * Repositions the panel when the game canvas is resized.
   *
   * @param {number} width - New canvas width.
   * @param {number} height - New canvas height.
   */
  resize(width, height) {
    if (!this.visible) return;
    const panelH = this._bg.height;
    this._container.setPosition(
      Math.floor((width - PANEL_W) / 2),
      Math.floor((height - panelH) / 2),
    );
  }
}
