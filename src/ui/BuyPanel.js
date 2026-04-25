/**
 * @module BuyPanel
 * @description A UI panel displayed in town shops, showing the items the shop
 * has for sale and allowing the player to purchase them with gold.
 *
 * Interaction:
 *  - Opens alongside the SellPanel when the player bumps a shop door.
 *  - Keyboard navigation is delegated to UIScene's shop keyboard controller.
 *    Call navigate(delta) and select() from outside.
 *  - UP/DOWN navigate the item list; ENTER buys the highlighted item.
 *  - LEFT/RIGHT switch keyboard focus between BuyPanel and SellPanel.
 *  - Direction keys are blocked for player movement while in SHOP state.
 */
import { FONT_FAMILY } from '../utils/FontConfig.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { SHOP_NAMES } from './ShopNames.js';

const PANEL_W = 220;
const PANEL_PAD = 14;
const ROW_H = 36;
const TITLE_H = 46;
const FOOTER_H = 32;

/** Maps itemType to emoji icon. */
const ICON_MAP = {
  consumable: '🧪', weapon: '⚔️', ranged_weapon: '🏹', armor: '🛡️',
  helmet: '⛑️', chest: '🦺', legs: '👖', arms: '🧤', boots: '👢',
  ring: '💍', amulet: '📿',
};

export class BuyPanel {
  /**
   * @param {Phaser.Scene} scene - UIScene instance.
   */
  constructor(scene) {
    this.scene = scene;
    /** @type {boolean} Whether the panel is currently visible. */
    this.visible = false;
    this._shopType = null;
    /** @type {Array<{item: import('../items/Item.js').Item, buyPrice: number}>} Current shop stock. */
    this._shopStock = [];
    /** @type {number} Index of the currently highlighted row. */
    this._cursorIndex = 0;
    /** @type {Array<Phaser.GameObjects.GameObject[]>} One array of objects per item row. */
    this._rows = [];
    /** @type {number} Horizontal offset from the centered position, in pixels. */
    this._xOffset = 0;
    /** @type {import('../entities/Player.js').Player|null} The current player instance. */
    this._player = null;
    this._build();
  }

  /** Constructs the static panel chrome (background, title, close button, headers). */
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

    // Close button
    this._closeBtn = s.add.text(PANEL_W - PANEL_PAD / 2, 10, '✕', {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#aaccff',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this._closeBtn.on('pointerover', () => this._closeBtn.setColor('#ffffff'));
    this._closeBtn.on('pointerout',  () => this._closeBtn.setColor('#aaccff'));
    // Closing the buy panel closes the whole shop
    this._closeBtn.on('pointerdown', () => EventBus.emit(GameEvents.CLOSE_SELL_PANEL));
    this._container.add(this._closeBtn);

    // Column headers
    this._stockColHeader = s.add.text(PANEL_W - PANEL_PAD - 38, TITLE_H - 16, 'Stock', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    }).setOrigin(1, 0).setVisible(false);
    this._container.add(this._stockColHeader);

    this._buyColHeader = s.add.text(PANEL_W - PANEL_PAD, TITLE_H - 16, 'Buy', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    }).setOrigin(1, 0).setVisible(false);
    this._container.add(this._buyColHeader);

    // Cursor highlight bar
    this._cursorBar = s.add.rectangle(0, 0, PANEL_W - 4, ROW_H - 2, 0x1a3a4a, 1)
      .setStrokeStyle(1, 0x44aacc)
      .setOrigin(0, 0).setVisible(false);
    this._container.add(this._cursorBar);

    // Message shown when the shop has nothing for sale
    this._emptyText = s.add.text(PANEL_W / 2, TITLE_H + 10, 'Nothing for sale.', {
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#888888',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0).setVisible(false);
    this._container.add(this._emptyText);

    // Item description footer
    this._descText = s.add.text(PANEL_PAD, 0, '', {
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#ddddaa',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
      wordWrap: { width: PANEL_W - PANEL_PAD * 2 },
    }).setOrigin(0, 0.5);
    this._container.add(this._descText);

    // Gold indicator label — shown in footer to remind the player of their balance
    this._goldLabel = s.add.text(PANEL_W - PANEL_PAD, 0, '', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#ffdd44',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    }).setOrigin(1, 0.5);
    this._container.add(this._goldLabel);
  }

  /**
   * Opens the buy panel for the given shop type.
   *
   * @param {string} shopType - 'potion', 'weapon', or 'armour'.
   * @param {Array<{item: import('../items/Item.js').Item, buyPrice: number}>} shopStock
   * @param {import('../entities/Player.js').Player} player
   * @param {number} [xOffset=0] - Horizontal pixel offset from screen centre.
   */
  show(shopType, shopStock, player, xOffset = 0) {
    this._shopType = shopType;
    this._shopStock = shopStock;
    this._player = player;
    this._xOffset = xOffset;
    this._cursorIndex = 0;
    this._refresh();
    this.visible = true;
    this._container.setVisible(true);
    EventBus.emit(GameEvents.BUY_PANEL_TOGGLED, true);
  }

  /** Hides the buy panel and clears shop state. */
  hide() {
    if (!this.visible) return;
    this.visible = false;
    this._container.setVisible(false);
    this._shopType = null;
    EventBus.emit(GameEvents.BUY_PANEL_TOGGLED, false);
  }

  /**
   * Refreshes the panel after a purchase so the stock count stays accurate.
   * The cursor is clamped so it never points out of bounds.
   */
  refresh() {
    if (!this.visible) return;
    this._refresh();
  }

  /**
   * Updates the gold display in the panel footer.
   * Called after the player's gold changes (e.g. after buying or selling).
   *
   * @param {number} gold
   */
  updateGold(gold) {
    if (!this.visible) return;
    this._goldLabel.setText(`⬡ ${gold}g`);
  }

  /**
   * Moves the cursor up (delta = -1) or down (delta = +1), wrapping at both ends.
   * Called by UIScene's shop keyboard controller when this panel has focus.
   *
   * @param {number} delta - -1 for up, +1 for down.
   */
  navigate(delta) {
    if (this._shopStock.length === 0) return;
    const count = this._shopStock.length;
    this._cursorIndex = (this._cursorIndex + delta + count) % count;
    this._updateCursorBar();
  }

  /**
   * Emits BUY_ITEM for the currently highlighted shop item, if any.
   * Called by UIScene's shop keyboard controller when this panel has focus.
   */
  select() {
    if (this._shopStock.length === 0) return;
    const shopItem = this._shopStock[this._cursorIndex];
    EventBus.emit(GameEvents.BUY_ITEM, { shopType: this._shopType, shopItem });
  }

  /**
   * Rebuilds the item rows from the current shop stock.
   */
  _refresh() {
    for (const row of this._rows) {
      for (const obj of row) this._container.remove(obj, true);
    }
    this._rows = [];

    this._title.setText(SHOP_NAMES[this._shopType] ?? 'Shop');

    const hasItems = this._shopStock.length > 0;
    this._emptyText.setVisible(!hasItems);
    this._stockColHeader.setVisible(hasItems);
    this._buyColHeader.setVisible(hasItems);
    this._cursorBar.setVisible(hasItems);

    // Clamp cursor after a purchase may have shrunk the list
    this._cursorIndex = Math.min(this._cursorIndex, Math.max(0, this._shopStock.length - 1));

    for (let i = 0; i < this._shopStock.length; i++) {
      const { item, buyPrice } = this._shopStock[i];
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
        wordWrap: { width: 70 },
      }).setOrigin(0, 0.5);

      // Stock count — always 1 (generated items are unique; potions have individual entries)
      const stockText = this.scene.add.text(
        PANEL_W - PANEL_PAD - 38, rowY + ROW_H / 2, '1',
        {
          fontSize: '10px', fontFamily: FONT_FAMILY, color: '#cccccc',
          stroke: '#000000', strokeThickness: 2, resolution: 2,
        }
      ).setOrigin(1, 0.5);

      // Buy price
      const priceText = this.scene.add.text(
        PANEL_W - PANEL_PAD, rowY + ROW_H / 2,
        `${buyPrice}g`,
        {
          fontSize: '10px', fontFamily: FONT_FAMILY, color: '#44ddff',
          stroke: '#000000', strokeThickness: 2, resolution: 2,
        }
      ).setOrigin(1, 0.5);

      // Transparent hit area covering the full row
      const rowShopItem = { item, buyPrice };
      const shopType = this._shopType;
      const rowHit = this.scene.add.rectangle(2, rowY + 1, PANEL_W - 4, ROW_H - 2, 0xffffff, 0)
        .setOrigin(0, 0).setInteractive({ useHandCursor: true });
      rowHit.on('pointerover', () => priceText.setColor('#88eeff'));
      rowHit.on('pointerout',  () => priceText.setColor('#44ddff'));
      rowHit.on('pointerdown', () => {
        if (this._cursorIndex === i) {
          EventBus.emit(GameEvents.BUY_ITEM, { shopType, shopItem: rowShopItem });
        } else {
          this._setCursor(i);
        }
      });

      const rowObjs = [sep, icon, nameText, stockText, priceText, rowHit];
      for (const obj of rowObjs) this._container.add(obj);
      this._rows.push(rowObjs);
    }

    // Resize background
    const panelH = TITLE_H + Math.max(1, this._shopStock.length) * ROW_H + FOOTER_H;
    this._bg.setSize(PANEL_W, panelH);
    this._emptyText.setY(TITLE_H + 10);
    this._updateCursorBar();

    // Re-centre panel with horizontal offset
    const { width, height } = this.scene.scale;
    this._container.setPosition(
      Math.floor((width - PANEL_W) / 2) + this._xOffset,
      Math.floor((height - panelH) / 2),
    );

    // Show current gold balance
    if (this._player) {
      this._goldLabel.setText(`⬡ ${this._player.gold}g`);
    }
  }

  // ─── Cursor ───────────────────────────────────────────────────────────────

  /**
   * Moves the cursor to the given index and updates the highlight bar.
   * @param {number} index
   */
  _setCursor(index) {
    this._cursorIndex = index;
    this._updateCursorBar();
  }

  /** Repositions the cursor highlight bar to sit behind the active row. */
  _updateCursorBar() {
    const panelH = this._bg.height;
    this._descText.setY(panelH - FOOTER_H / 2);
    this._goldLabel.setY(panelH - FOOTER_H / 2);

    if (this._shopStock.length === 0) {
      this._cursorBar.setVisible(false);
      this._descText.setText('');
      return;
    }
    const rowY = TITLE_H + this._cursorIndex * ROW_H;
    this._cursorBar.setPosition(2, rowY + 1).setVisible(true);
    const shopItem = this._shopStock[this._cursorIndex];
    this._descText.setText(shopItem ? shopItem.item.description : '');
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
      Math.floor((width - PANEL_W) / 2) + this._xOffset,
      Math.floor((height - panelH) / 2),
    );
  }
}
