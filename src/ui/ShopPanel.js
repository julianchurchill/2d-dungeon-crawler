/**
 * @module ShopPanel
 * @description A single shop panel that combines buying and selling.
 *
 * Layout:
 *  - Header: shop name + player gold + close button
 *  - Sell section: items the player can sell (from their inventory), at the top
 *  - Buy section: items the shop has for sale, below the sell section
 *  - Footer: description of the highlighted item
 *
 * Keyboard navigation moves a single cursor through all rows (sell rows first,
 * then buy rows). ENTER sells or buys depending on which section the cursor is in.
 * LEFT/RIGHT arrows are no longer needed (no focus switching).
 */
import { FONT_FAMILY } from '../utils/FontConfig.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { ShopSystem } from '../systems/ShopSystem.js';
import { tilesetManager as defaultTilesetManager } from '../systems/TilesetManager.js';
import { SHOP_NAMES } from './ShopNames.js';

const PANEL_W = 240;
const PANEL_PAD = 14;
const ROW_H = 36;
const TITLE_H = 50;
const SECTION_HEADER_H = 22;
const FOOTER_H = 36;

/**
 * @typedef {import('../items/Item.js').Item} Item
 * @typedef {{ item: Item, buyPrice: number }} ShopItem
 * @typedef {{ item: Item, count: number }} SellGroup
 */

export class ShopPanel {
  /**
   * @param {Phaser.Scene} scene - UIScene instance.
   * @param {import('../systems/TilesetManager.js').TilesetManager} [tilesetManager]
   *   Injected tileset manager; defaults to the singleton. Pass a custom instance
   *   in tests to control the active tileset without touching localStorage.
   */
  constructor(scene, tilesetManager = defaultTilesetManager) {
    this.scene = scene;
    this._tilesetManager = tilesetManager;
    /** @type {boolean} Whether the panel is currently visible. */
    this.visible = false;
    this._shopType = null;
    this._player = null;
    /** @type {ShopItem[]} Current shop stock. */
    this._buyStock = [];
    /** @type {SellGroup[]} Deduplicated sell rows — player items this shop accepts. */
    this._sellGroups = [];
    /** @type {number} Unified cursor index across sell + buy rows. */
    this._cursorIndex = 0;
    /**
     * Index of the sell row awaiting confirmation for an equipped-item sale,
     * or -1 when no confirmation is pending.
     * @type {number}
     */
    this._pendingConfirmIndex = -1;
    /** @type {Array<Phaser.GameObjects.GameObject[]>} Row objects for each sell row. */
    this._sellRows = [];
    /** @type {Array<Phaser.GameObjects.GameObject[]>} Row objects for each buy row. */
    this._buyRows = [];
    this._build();
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Opens the panel for the given shop.
   *
   * @param {string} shopType - 'potion', 'weapon', 'armour', or 'general'.
   * @param {ShopItem[]} shopStock - Items the shop has for sale.
   * @param {Item[]} inventory - The player's full inventory.
   * @param {import('../entities/Player.js').Player} player
   */
  show(shopType, shopStock, inventory, player) {
    this._shopType = shopType;
    this._buyStock = shopStock;
    this._player = player;
    this._cursorIndex = 0;
    this._pendingConfirmIndex = -1;
    this._buildSellGroups(inventory, shopType);
    this._refresh();
    this.visible = true;
    this._container.setVisible(true);
    EventBus.emit(GameEvents.SELL_PANEL_TOGGLED, true);
  }

  /** Hides the panel. */
  hide() {
    if (!this.visible) return;
    this.visible = false;
    this._pendingConfirmIndex = -1;
    this._container.setVisible(false);
    this._shopType = null;
    EventBus.emit(GameEvents.SELL_PANEL_TOGGLED, false);
  }

  /**
   * Rebuilds the sell section after the player's inventory changes.
   *
   * @param {Item[]} inventory
   */
  refresh(inventory) {
    if (!this.visible) return;
    this._pendingConfirmIndex = -1;
    this._buildSellGroups(inventory, this._shopType);
    this._refresh();
  }

  /**
   * Updates the gold display after a transaction.
   *
   * @param {number} gold
   */
  updateGold(gold) {
    this._goldLabel.setText(`⬡ ${gold}g`);
  }

  /**
   * Moves the cursor up (delta = -1) or down (delta = +1) across all rows,
   * wrapping at both ends.
   *
   * @param {number} delta
   */
  navigate(delta) {
    const total = this._sellGroups.length + this._buyStock.length;
    if (total === 0) return;
    this._cursorIndex = (this._cursorIndex + delta + total) % total;
    this._pendingConfirmIndex = -1;
    this._updateCursor();
  }

  /**
   * Emits SELL_ITEM or BUY_ITEM for the highlighted row depending on which
   * section the cursor is in.
   */
  select() {
    const section = this._cursorSection();
    if (section === 'sell') {
      if (this._sellGroups.length === 0) return;
      const { item } = this._sellGroups[this._cursorIndex];
      this._trySell(this._cursorIndex, item);
    } else {
      const buyIdx = this._cursorIndex - this._sellGroups.length;
      if (buyIdx < 0 || buyIdx >= this._buyStock.length) return;
      const shopItem = this._buyStock[buyIdx];
      EventBus.emit(GameEvents.BUY_ITEM, { shopType: this._shopType, shopItem });
    }
  }

  /**
   * Sells the item at the given sell-group index, with a confirmation step
   * when the item is currently equipped.  The first press on an equipped item
   * emits a warning message; a second press on the same row confirms the sale.
   *
   * @param {number} index - Index into _sellGroups.
   * @param {import('../items/Item.js').Item} item
   */
  _trySell(index, item) {
    const isEquipped = this._player?.isEquipped?.(item);
    if (isEquipped && this._pendingConfirmIndex !== index) {
      this._pendingConfirmIndex = index;
      EventBus.emit(GameEvents.MESSAGE,
        `${item.name} is equipped! Press again to confirm selling.`);
      return;
    }
    this._pendingConfirmIndex = -1;
    EventBus.emit(GameEvents.SELL_ITEM, { shopType: this._shopType, item });
  }

  /**
   * Returns which section the cursor currently points to.
   *
   * @returns {'sell'|'buy'}
   */
  _cursorSection() {
    return this._cursorIndex < this._sellGroups.length ? 'sell' : 'buy';
  }

  /**
   * Repositions the panel when the game canvas is resized.
   *
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    if (!this.visible) return;
    const panelH = this._bg.height;
    this._container.setPosition(
      Math.floor((width - PANEL_W) / 2),
      Math.floor((height - panelH) / 2),
    );
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  /**
   * Constructs the static panel chrome: background, title, gold label, close
   * button, section headers, cursor bar, empty-state messages, and footer.
   */
  _build() {
    const s = this.scene;

    this._container = s.add.container(0, 0)
      .setDepth(300).setScrollFactor(0).setVisible(false);

    // Background — height is adjusted each refresh
    this._bg = s.add.rectangle(0, 0, PANEL_W, 160, 0x111122, 0.95)
      .setStrokeStyle(2, 0x44aa66).setOrigin(0, 0);
    this._container.add(this._bg);

    // Shop title (left-aligned in header)
    this._title = s.add.text(PANEL_PAD, PANEL_PAD, '', {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#88ffaa',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    });
    this._container.add(this._title);

    // Gold balance — always visible in the header; offset left to clear the close button
    this._goldLabel = s.add.text(PANEL_W - PANEL_PAD - 22, PANEL_PAD, '', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ffdd44',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    }).setOrigin(1, 0);
    this._container.add(this._goldLabel);

    // Close button
    this._closeBtn = s.add.text(PANEL_W - PANEL_PAD / 2, PANEL_PAD - 2, '✕', {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#aaccff',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this._closeBtn.on('pointerover', () => this._closeBtn.setColor('#ffffff'));
    this._closeBtn.on('pointerout',  () => this._closeBtn.setColor('#aaccff'));
    this._closeBtn.on('pointerdown', () => EventBus.emit(GameEvents.CLOSE_SELL_PANEL));
    this._container.add(this._closeBtn);

    // ── Sell section header ──────────────────────────────────────────────────
    this._sellSectionLabel = s.add.text(PANEL_PAD, TITLE_H, 'YOUR ITEMS', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#aaffaa',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    });
    this._container.add(this._sellSectionLabel);

    this._sellInBagHeader = s.add.text(PANEL_W - PANEL_PAD - 38, TITLE_H, 'Bag', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    }).setOrigin(1, 0);
    this._container.add(this._sellInBagHeader);

    this._sellPriceHeader = s.add.text(PANEL_W - PANEL_PAD, TITLE_H, 'Sell', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    }).setOrigin(1, 0);
    this._container.add(this._sellPriceHeader);

    // Empty sell message
    this._emptySellText = s.add.text(PANEL_W / 2, 0, 'Nothing to sell here.', {
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#888888',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0).setVisible(false);
    this._container.add(this._emptySellText);

    // ── Buy section header ───────────────────────────────────────────────────
    this._buySectionLabel = s.add.text(PANEL_PAD, 0, 'SHOP STOCK', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#aaccff',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    });
    this._container.add(this._buySectionLabel);

    this._buyStockHeader = s.add.text(PANEL_W - PANEL_PAD - 38, 0, 'Stock', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    }).setOrigin(1, 0);
    this._container.add(this._buyStockHeader);

    this._buyPriceHeader = s.add.text(PANEL_W - PANEL_PAD, 0, 'Buy', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    }).setOrigin(1, 0);
    this._container.add(this._buyPriceHeader);

    // Empty buy message
    this._emptyBuyText = s.add.text(PANEL_W / 2, 0, 'Nothing for sale.', {
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#888888',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0).setVisible(false);
    this._container.add(this._emptyBuyText);

    // ── Cursor highlight bar ─────────────────────────────────────────────────
    this._cursorBar = s.add.rectangle(0, 0, PANEL_W - 4, ROW_H - 2, 0x1a3a2a, 1)
      .setStrokeStyle(1, 0x44cc88)
      .setOrigin(0, 0).setVisible(false);
    this._container.add(this._cursorBar);

    // ── Description footer ───────────────────────────────────────────────────
    this._descText = s.add.text(PANEL_PAD, 0, '', {
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#ddddaa',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
      wordWrap: { width: PANEL_W - PANEL_PAD * 2 },
    }).setOrigin(0, 0.5);
    this._container.add(this._descText);
  }

  /**
   * Builds the deduplicated sell-group list from the player's inventory,
   * filtered to items the active shop accepts.
   *
   * @param {Item[]} inventory
   * @param {string} shopType
   */
  _buildSellGroups(inventory, shopType) {
    const shop = new ShopSystem(shopType);
    const acceptable = inventory.filter(item => shop.accepts(item));
    const countByName = new Map();
    for (const item of acceptable) {
      // Use item.count for stackable items; each non-stackable entry counts as 1.
      const qty = item.stackable ? item.count : 1;
      if (countByName.has(item.name)) {
        countByName.get(item.name).count += qty;
      } else {
        countByName.set(item.name, { item, count: qty });
      }
    }
    this._sellGroups = [...countByName.values()]
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
  }

  /**
   * Tears down all dynamic row objects and rebuilds the panel layout from the
   * current _sellGroups and _buyStock data.
   */
  _refresh() {
    // Destroy existing row objects
    for (const row of this._sellRows) for (const obj of row) this._container.remove(obj, true);
    for (const row of this._buyRows)  for (const obj of row) this._container.remove(obj, true);
    this._sellRows = [];
    this._buyRows = [];

    this._title.setText(SHOP_NAMES[this._shopType] ?? 'Shop');
    if (this._player) this._goldLabel.setText(`⬡ ${this._player.gold}g`);

    const sellCount = this._sellGroups.length;
    const buyCount  = this._buyStock.length;

    // ── Sell rows ────────────────────────────────────────────────────────────
    const sellRowsStartY = TITLE_H + SECTION_HEADER_H;
    this._emptySellText.setVisible(sellCount === 0);
    if (sellCount === 0) {
      this._emptySellText.setY(sellRowsStartY + 4);
    }

    for (let i = 0; i < sellCount; i++) {
      const { item, count } = this._sellGroups[i];
      this._sellRows.push(this._buildRow({
        y: sellRowsStartY + i * ROW_H,
        item,
        rightColA: String(count),
        rightColB: `${item.sellPrice}g`,
        rightColBColor: '#ffdd44',
        onPointerDown: () => {
          if (this._cursorIndex === i) {
            this._trySell(i, item);
          } else {
            this._cursorIndex = i;
            this._pendingConfirmIndex = -1;
            this._updateCursor();
          }
        },
        onPointerOver:  (btn) => btn.setColor('#ffffff'),
        onPointerOut:   (btn) => btn.setColor('#ffdd44'),
      }));
    }

    // ── Buy section header + rows ────────────────────────────────────────────
    const buySectionY = sellRowsStartY + Math.max(1, sellCount) * ROW_H + SECTION_HEADER_H;
    this._buySectionLabel.setY(buySectionY - SECTION_HEADER_H);
    this._buyStockHeader.setY(buySectionY - SECTION_HEADER_H);
    this._buyPriceHeader.setY(buySectionY - SECTION_HEADER_H);
    this._emptyBuyText.setVisible(buyCount === 0);
    if (buyCount === 0) {
      this._emptyBuyText.setY(buySectionY + 4);
    }

    for (let i = 0; i < buyCount; i++) {
      const { item, buyPrice } = this._buyStock[i];
      const globalIdx = sellCount + i;
      this._buyRows.push(this._buildRow({
        y: buySectionY + i * ROW_H,
        item,
        rightColA: '1',
        rightColB: `${buyPrice}g`,
        rightColBColor: '#44ddff',
        onPointerDown: () => {
          if (this._cursorIndex === globalIdx) {
            EventBus.emit(GameEvents.BUY_ITEM, { shopType: this._shopType, shopItem: { item, buyPrice } });
          } else {
            this._cursorIndex = globalIdx;
            this._pendingConfirmIndex = -1;
            this._updateCursor();
          }
        },
        onPointerOver:  (btn) => btn.setColor('#88eeff'),
        onPointerOut:   (btn) => btn.setColor('#44ddff'),
      }));
    }

    // ── Resize background ────────────────────────────────────────────────────
    const sellHeight = Math.max(1, sellCount) * ROW_H;
    const buyHeight  = Math.max(1, buyCount)  * ROW_H;
    const panelH = TITLE_H + SECTION_HEADER_H + sellHeight
                 + SECTION_HEADER_H + buyHeight + FOOTER_H;
    this._bg.setSize(PANEL_W, panelH);

    // Clamp cursor
    const total = sellCount + buyCount;
    if (total > 0) this._cursorIndex = Math.min(this._cursorIndex, total - 1);

    this._updateCursor();

    // Centre panel on screen
    const { width, height } = this.scene.scale;
    this._container.setPosition(
      Math.floor((width - PANEL_W) / 2),
      Math.floor((height - panelH) / 2),
    );
  }

  /**
   * Builds a single item row and adds it to the container.
   *
   * @param {object} opts
   * @param {number}   opts.y              - Top Y of this row within the panel.
   * @param {Item}     opts.item           - Item to display.
   * @param {string}   opts.rightColA      - Text for the left-of-price column (count/stock).
   * @param {string}   opts.rightColB      - Text for the price column.
   * @param {string}   opts.rightColBColor - Colour for the price text.
   * @param {Function} opts.onPointerDown  - Handler for row click.
   * @param {Function} opts.onPointerOver  - Handler for hover (receives price text obj).
   * @param {Function} opts.onPointerOut   - Handler for hover end.
   * @returns {Phaser.GameObjects.GameObject[]} Objects that make up this row.
   */
  _buildRow({ y, item, rightColA, rightColB, rightColBColor, onPointerDown, onPointerOver, onPointerOut }) {
    const s = this.scene;

    const sep = s.add.graphics();
    sep.lineStyle(1, 0x334455, 0.7);
    sep.beginPath();
    sep.moveTo(PANEL_PAD, y);
    sep.lineTo(PANEL_W - PANEL_PAD, y);
    sep.strokePath();

    const icon = s.add.image(PANEL_PAD + 8, y + ROW_H / 2, this._tilesetManager.getTileKey(item.textureKey))
      .setDisplaySize(16, 16).setOrigin(0.5, 0.5);

    const nameText = s.add.text(PANEL_PAD + 22, y + ROW_H / 2, item.name, {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#dddddd',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
      wordWrap: { width: 80 },
    }).setOrigin(0, 0.5);

    const colAText = s.add.text(PANEL_W - PANEL_PAD - 38, y + ROW_H / 2, rightColA, {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#cccccc',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(1, 0.5);

    const priceText = s.add.text(PANEL_W - PANEL_PAD, y + ROW_H / 2, rightColB, {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: rightColBColor,
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(1, 0.5);

    const rowHit = s.add.rectangle(2, y + 1, PANEL_W - 4, ROW_H - 2, 0xffffff, 0)
      .setOrigin(0, 0).setInteractive({ useHandCursor: true });
    rowHit.on('pointerover',  () => onPointerOver(priceText));
    rowHit.on('pointerout',   () => onPointerOut(priceText));
    rowHit.on('pointerdown',  () => onPointerDown());

    const objs = [sep, icon, nameText, colAText, priceText, rowHit];
    for (const obj of objs) this._container.add(obj);
    return objs;
  }

  /**
   * Repositions the cursor highlight bar to the active row and updates the
   * description footer text.
   */
  _updateCursor() {
    const sellCount = this._sellGroups.length;
    const buyCount  = this._buyStock.length;
    const total = sellCount + buyCount;
    const panelH = this._bg.height;

    this._descText.setY(panelH - FOOTER_H / 2);

    if (total === 0) {
      this._cursorBar.setVisible(false);
      this._descText.setText('');
      return;
    }

    this._cursorBar.setVisible(true);

    if (this._cursorSection() === 'sell') {
      const rowY = (TITLE_H + SECTION_HEADER_H) + this._cursorIndex * ROW_H;
      this._cursorBar.setPosition(2, rowY + 1);
      const group = this._sellGroups[this._cursorIndex];
      this._descText.setText(group ? group.item.description : '');
    } else {
      const buyIdx = this._cursorIndex - sellCount;
      const buySectionY = (TITLE_H + SECTION_HEADER_H) + Math.max(1, sellCount) * ROW_H + SECTION_HEADER_H;
      const rowY = buySectionY + buyIdx * ROW_H;
      this._cursorBar.setPosition(2, rowY + 1);
      const shopItem = this._buyStock[buyIdx];
      this._descText.setText(shopItem ? shopItem.item.description : '');
    }
  }
}
