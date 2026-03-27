/**
 * @module SellPanel
 * @description A UI panel displayed in town shops, showing the items in the
 * player's inventory that the shop accepts and allowing the player to sell them
 * for gold currency.
 *
 * Interaction:
 *  - Toggled open/closed by bumping the shop door (or pressing ESC / ✕ to close).
 *  - UP/DOWN (or W/S) navigate items; ENTER sells the highlighted item.
 *  - Direction keys are blocked for player movement while the panel is open
 *    (GameScene sets TurnManager to SHOP state when it opens).
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

/** Maps itemType to emoji icon. */
const ICON_MAP = { consumable: '🧪', weapon: '⚔️', armor: '🛡️' };
/** Maps shopType to display name. */
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
    /** @type {Item[]} Filtered list of items the active shop accepts. */
    this._acceptableItems = [];
    /** @type {Array<{item: Item, count: number}>} Deduplicated rows — one per unique item name. */
    this._groups = [];
    /** @type {number} Index of the currently highlighted row. */
    this._cursorIndex = 0;
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

    // Close button — same layout as InventoryPanel / SkillsPanel mobile close button
    this._closeBtn = s.add.text(PANEL_W - PANEL_PAD / 2, 10, '✕', {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#aaccff',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this._closeBtn.on('pointerover', () => this._closeBtn.setColor('#ffffff'));
    this._closeBtn.on('pointerout',  () => this._closeBtn.setColor('#aaccff'));
    this._closeBtn.on('pointerdown', () => this.hide());
    this._container.add(this._closeBtn);

    // Column headers — right-aligned above their respective columns
    this._inBagColHeader = s.add.text(PANEL_W - PANEL_PAD - 38, TITLE_H - 16, 'In bag', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    }).setOrigin(1, 0).setVisible(false);
    this._container.add(this._inBagColHeader);

    this._sellColHeader = s.add.text(PANEL_W - PANEL_PAD, TITLE_H - 16, 'Sell', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    }).setOrigin(1, 0).setVisible(false);
    this._container.add(this._sellColHeader);

    // Cursor highlight bar — repositioned when cursor moves; sits behind row content
    this._cursorBar = s.add.rectangle(0, 0, PANEL_W - 4, ROW_H - 2, 0x1a4a1a, 1)
      .setStrokeStyle(1, 0x44cc44)
      .setOrigin(0, 0).setVisible(false);
    this._container.add(this._cursorBar);

    // Message shown when the player has no acceptable items
    this._emptyText = s.add.text(PANEL_W / 2, TITLE_H + 10, 'Nothing to sell here.', {
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#888888',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0).setVisible(false);
    this._container.add(this._emptyText);
  }

  /**
   * Opens the panel for the given shop type.
   * Bumping the same door again closes it (toggle).
   *
   * @param {string} shopType - 'potion', 'weapon', or 'armour'.
   * @param {Item[]} inventory - The player's full inventory.
   * @param {Player} player - The player instance.
   */
  show(shopType, inventory, player) {
    if (this.visible && this._shopType === shopType) {
      this.hide();
      return;
    }
    this._shopType = shopType;
    this._player = player;
    this._shop = new ShopSystem(shopType);
    this._cursorIndex = 0;
    this._refresh(inventory);
    this.visible = true;
    this._container.setVisible(true);
    // Block navigation for one tick so the keydown event that triggered the
    // door bump (UP/W) doesn't immediately wrap the cursor to the last item.
    this._navigationReady = false;
    this._addKeyListeners();
    this.scene.time.delayedCall(0, () => { this._navigationReady = true; });
    EventBus.emit(GameEvents.SELL_PANEL_TOGGLED, true);
  }

  /** Hides the sell panel and clears shop state. */
  hide() {
    if (!this.visible) return;
    this.visible = false;
    this._container.setVisible(false);
    this._shopType = null;
    this._removeKeyListeners();
    EventBus.emit(GameEvents.SELL_PANEL_TOGGLED, false);
  }

  /**
   * Rebuilds the item list after a sale so the panel reflects the updated inventory.
   * Clamps the cursor to the new item count so it never points out of bounds.
   *
   * @param {Item[]} inventory - The player's updated inventory.
   */
  refresh(inventory) {
    if (!this.visible) return;
    this._refresh(inventory);
  }

  /**
   * Tears down old item rows and rebuilds them from the given inventory,
   * showing only items the active shop accepts.
   *
   * @param {Item[]} inventory - Inventory to render.
   */
  _refresh(inventory) {
    for (const row of this._rows) {
      for (const obj of row) this._container.remove(obj, true);
    }
    this._rows = [];

    const shopName = SHOP_NAMES[this._shopType] ?? 'Shop';
    this._title.setText(shopName);

    this._acceptableItems = inventory.filter(item => this._shop.accepts(item));

    // Deduplicate by item name — one row per unique type, showing a count
    const countByName = new Map();
    for (const item of this._acceptableItems) {
      if (countByName.has(item.name)) {
        countByName.get(item.name).count++;
      } else {
        countByName.set(item.name, { item, count: 1 });
      }
    }
    // Sort alphabetically so the list order is stable as items are sold
    this._groups = [...countByName.values()].sort((a, b) => a.item.name.localeCompare(b.item.name));

    const hasItems = this._groups.length > 0;
    this._emptyText.setVisible(!hasItems);
    this._inBagColHeader.setVisible(hasItems);
    this._sellColHeader.setVisible(hasItems);
    this._cursorBar.setVisible(hasItems);

    // Clamp cursor after a sale may have shrunk the list
    this._cursorIndex = Math.min(this._cursorIndex, Math.max(0, this._groups.length - 1));

    for (let i = 0; i < this._groups.length; i++) {
      const { item, count } = this._groups[i];
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

      // Item name — narrower to make room for the two right-hand columns
      const nameText = this.scene.add.text(PANEL_PAD + 22, rowY + ROW_H / 2, item.name, {
        fontSize: '10px', fontFamily: FONT_FAMILY, color: '#dddddd',
        stroke: '#000000', strokeThickness: 2, resolution: 2,
        wordWrap: { width: 70 },
      }).setOrigin(0, 0.5);

      // "In bag" count — how many of this item the player is carrying
      const countText = this.scene.add.text(
        PANEL_W - PANEL_PAD - 38, rowY + ROW_H / 2,
        String(count),
        {
          fontSize: '10px', fontFamily: FONT_FAMILY, color: '#cccccc',
          stroke: '#000000', strokeThickness: 2, resolution: 2,
        }
      ).setOrigin(1, 0.5);

      // Sell price — visual only; interaction is handled by the row hit area below
      const sellBtn = this.scene.add.text(
        PANEL_W - PANEL_PAD, rowY + ROW_H / 2,
        `${item.sellPrice}g`,
        {
          fontSize: '10px', fontFamily: FONT_FAMILY, color: '#ffdd44',
          stroke: '#000000', strokeThickness: 2, resolution: 2,
        }
      ).setOrigin(1, 0.5);

      // Transparent hit area covering the full row — sits on top of all row content
      // so it captures all pointer events for this row.
      // First click highlights the row; a second click on the already-highlighted row sells.
      const soldItem = item;
      const shopType = this._shopType;
      const rowHit = this.scene.add.rectangle(2, rowY + 1, PANEL_W - 4, ROW_H - 2, 0xffffff, 0)
        .setOrigin(0, 0).setInteractive({ useHandCursor: true });
      rowHit.on('pointerover', () => sellBtn.setColor('#ffffff'));
      rowHit.on('pointerout',  () => sellBtn.setColor('#ffdd44'));
      rowHit.on('pointerdown', () => {
        if (this._cursorIndex === i) {
          EventBus.emit(GameEvents.SELL_ITEM, { shopType, item: soldItem });
        } else {
          this._setCursor(i);
        }
      });

      const rowObjs = [sep, icon, nameText, countText, sellBtn, rowHit];
      for (const obj of rowObjs) this._container.add(obj);
      this._rows.push(rowObjs);
    }

    // Resize background and reposition cursor bar
    const panelH = TITLE_H + Math.max(1, this._groups.length) * ROW_H + FOOTER_H;
    this._bg.setSize(PANEL_W, panelH);
    this._emptyText.setY(TITLE_H + 10);
    this._updateCursorBar();

    // Re-centre panel vertically on screen
    const { width, height } = this.scene.scale;
    this._container.setPosition(
      Math.floor((width - PANEL_W) / 2),
      Math.floor((height - panelH) / 2),
    );
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

  /**
   * Repositions the cursor highlight bar to sit behind the active row.
   */
  _updateCursorBar() {
    if (this._groups.length === 0) {
      this._cursorBar.setVisible(false);
      return;
    }
    const rowY = TITLE_H + this._cursorIndex * ROW_H;
    this._cursorBar.setPosition(2, rowY + 1).setVisible(true);
  }

  // ─── Keyboard navigation ──────────────────────────────────────────────────

  /**
   * Registers keyboard handlers on the UIScene keyboard plugin while the
   * panel is open. Stored as named functions so they can be removed precisely.
   */
  _addKeyListeners() {
    const kb = this.scene.input.keyboard;
    this._kbUp    = () => this._navigate(-1);
    this._kbDown  = () => this._navigate(1);
    this._kbEnter = () => this._sellCurrent();

    kb.on('keydown-UP',    this._kbUp);
    kb.on('keydown-DOWN',  this._kbDown);
    kb.on('keydown-W',     this._kbUp);
    kb.on('keydown-S',     this._kbDown);
    kb.on('keydown-ENTER', this._kbEnter);
  }

  /**
   * Removes the keyboard handlers registered by _addKeyListeners.
   */
  _removeKeyListeners() {
    if (!this._kbUp) return;
    const kb = this.scene.input.keyboard;
    kb.off('keydown-UP',    this._kbUp);
    kb.off('keydown-DOWN',  this._kbDown);
    kb.off('keydown-W',     this._kbUp);
    kb.off('keydown-S',     this._kbDown);
    kb.off('keydown-ENTER', this._kbEnter);
    this._kbUp = this._kbDown = this._kbEnter = null;
  }

  /**
   * Moves the cursor up (-1) or down (+1), wrapping at both ends.
   * @param {number} delta - -1 for up, +1 for down.
   */
  _navigate(delta) {
    if (!this._navigationReady || this._groups.length === 0) return;
    const count = this._groups.length;
    this._cursorIndex = (this._cursorIndex + delta + count) % count;
    this._updateCursorBar();
  }

  /**
   * Emits SELL_ITEM for the currently highlighted item, if any.
   */
  _sellCurrent() {
    if (this._groups.length === 0) return;
    const { item } = this._groups[this._cursorIndex];
    EventBus.emit(GameEvents.SELL_ITEM, { shopType: this._shopType, item });
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
