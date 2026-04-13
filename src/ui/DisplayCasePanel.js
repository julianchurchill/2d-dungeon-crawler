/**
 * @module DisplayCasePanel
 * @description A panel that lets the player store unique items in the display
 * case inside their home, and retrieve them back into their inventory.
 *
 * Layout:
 *  - Header: "Your Home — Display Case" title + close button
 *  - Inventory section: unique items the player is carrying (can be stored)
 *  - Display Case section: items currently in the display case (can be retrieved)
 *  - Footer: description of the highlighted item
 *
 * Keyboard navigation moves a single cursor through all rows (inventory rows
 * first, then display case rows). ENTER stores or retrieves depending on
 * which section the cursor is in.
 */
import { FONT_FAMILY } from '../utils/FontConfig.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';

const PANEL_W = 260;
const PANEL_PAD = 14;
const ROW_H = 36;
const TITLE_H = 50;
const SECTION_HEADER_H = 22;
const FOOTER_H = 44;

/** Icon per item type. */
const ICON_MAP = { weapon: '⚔️', armor: '🛡️' };

export class DisplayCasePanel {
  /**
   * @param {Phaser.Scene} scene - UIScene instance.
   */
  constructor(scene) {
    this.scene = scene;
    /** @type {boolean} Whether the panel is currently visible. */
    this.visible = false;
    this._player = null;
    this._displayCase = null;
    /** @type {import('../items/Item.js').Item[]} Unique items currently in inventory. */
    this._inventoryUnique = [];
    /** @type {import('../items/Item.js').Item[]} Items in the display case. */
    this._caseItems = [];
    /** Unified cursor index across inventory rows then case rows. */
    this._cursorIndex = 0;
    /** @type {Array<Phaser.GameObjects.GameObject[]>} */
    this._inventoryRows = [];
    /** @type {Array<Phaser.GameObjects.GameObject[]>} */
    this._caseRows = [];
    this._build();
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Opens the display case panel.
   *
   * @param {import('../systems/DisplayCase.js').DisplayCase} displayCase
   * @param {import('../items/Item.js').Item[]} inventory - Full player inventory.
   * @param {import('../entities/Player.js').Player} player
   */
  show(displayCase, inventory, player) {
    this._displayCase = displayCase;
    this._player = player;
    this._cursorIndex = 0;
    this._inventoryUnique = inventory.filter(i => i.unique);
    this._caseItems = displayCase.items;
    this._refresh();
    this.visible = true;
    this._container.setVisible(true);
    EventBus.emit(GameEvents.DISPLAY_CASE_TOGGLED, true);
  }

  /**
   * Closes the panel.
   */
  hide() {
    this.visible = false;
    this._container.setVisible(false);
    EventBus.emit(GameEvents.DISPLAY_CASE_TOGGLED, false);
  }

  /**
   * Refreshes the panel contents after an item is stored or retrieved.
   *
   * @param {import('../systems/DisplayCase.js').DisplayCase} displayCase
   * @param {import('../items/Item.js').Item[]} inventory
   */
  refresh(displayCase, inventory) {
    if (!this.visible) return;
    this._displayCase = displayCase;
    this._inventoryUnique = inventory.filter(i => i.unique);
    this._caseItems = displayCase.items;
    this._cursorIndex = Math.min(this._cursorIndex, Math.max(0, this._totalRows() - 1));
    this._refresh();
  }

  /**
   * Moves the cursor up or down.
   * @param {number} delta - +1 for down, -1 for up.
   */
  navigate(delta) {
    if (!this.visible) return;
    const total = this._totalRows();
    if (total === 0) return;
    this._cursorIndex = (this._cursorIndex + delta + total) % total;
    this._refresh();
  }

  /**
   * Activates the currently highlighted row (store or retrieve).
   */
  select() {
    if (!this.visible) return;
    const invCount = this._inventoryUnique.length;
    if (this._cursorIndex < invCount) {
      // Cursor is in inventory section — find the actual inventory index
      const item = this._inventoryUnique[this._cursorIndex];
      const idx = this._player.inventory.indexOf(item);
      if (idx !== -1) EventBus.emit(GameEvents.STORE_ITEM, { index: idx });
    } else {
      // Cursor is in display case section
      const caseIdx = this._cursorIndex - invCount;
      EventBus.emit(GameEvents.RETRIEVE_ITEM, { index: caseIdx });
    }
  }

  /**
   * Resizes the panel to fit the new game dimensions.
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    if (!this._container) return;
    this._container.setPosition(Math.round(width / 2 - PANEL_W / 2), 40);
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  /** @returns {number} Total selectable rows (inventory unique + case items). */
  _totalRows() {
    return this._inventoryUnique.length + this._caseItems.length;
  }

  /**
   * Performs the initial one-time construction of the panel container and its
   * static elements (background, title, close button, section headers, footer
   * placeholder).  Row objects are created dynamically during `_refresh()`.
   */
  _build() {
    const s = this.scene;
    const { width } = s.scale;
    const x = Math.round(width / 2 - PANEL_W / 2);

    // Placeholder height — will be resized in _refresh() once row counts are known
    this._container = s.add.container(x, 40).setDepth(300).setVisible(false);

    // Background (sized in _refresh)
    this._bg = s.add.rectangle(0, 0, PANEL_W, 200, 0x1a1a2e, 0.97)
      .setOrigin(0).setStrokeStyle(1, 0x8888cc);
    this._container.add(this._bg);

    // Title
    this._titleText = s.add.text(PANEL_PAD, 14, '🏠  Your Home — Display Case', {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#eeddaa',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    });
    this._container.add(this._titleText);

    // Close button
    const closeBtn = s.add.text(PANEL_W - PANEL_PAD, 14, '✕', {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#cc6666',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => EventBus.emit(GameEvents.CLOSE_DISPLAY_CASE));
    this._container.add(closeBtn);

    // Section headers (repositioned in _refresh)
    this._invHeader = s.add.text(PANEL_PAD, TITLE_H, '— INVENTORY (unique items) —', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#aaaacc', resolution: 2,
    });
    this._container.add(this._invHeader);

    this._caseHeader = s.add.text(PANEL_PAD, TITLE_H, '— DISPLAY CASE —', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#aaaacc', resolution: 2,
    });
    this._container.add(this._caseHeader);

    // Footer description
    this._footerText = s.add.text(PANEL_PAD, 0, '', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#cccccc',
      wordWrap: { width: PANEL_W - PANEL_PAD * 2 }, resolution: 2,
    });
    this._container.add(this._footerText);
  }

  /**
   * Rebuilds all dynamic row objects and repositions static elements to fit
   * the current list lengths.  Called on open and after every store/retrieve.
   */
  _refresh() {
    const s = this.scene;

    // Destroy old row objects
    for (const objs of [...this._inventoryRows, ...this._caseRows]) {
      for (const o of objs) o.destroy();
    }
    this._inventoryRows = [];
    this._caseRows = [];

    let y = TITLE_H;

    // ── Inventory section ─────────────────────────────────────────────────
    this._invHeader.setY(y);
    y += SECTION_HEADER_H;

    if (this._inventoryUnique.length === 0) {
      const empty = s.add.text(PANEL_PAD, y, '(no unique items in inventory)', {
        fontSize: '11px', fontFamily: FONT_FAMILY, color: '#666688', resolution: 2,
      });
      this._container.add(empty);
      this._inventoryRows.push([empty]);
      y += ROW_H;
    } else {
      for (let i = 0; i < this._inventoryUnique.length; i++) {
        const item = this._inventoryUnique[i];
        const globalIdx = i;
        const isSelected = globalIdx === this._cursorIndex;
        const objs = this._makeRow(item, y, isSelected, '→ Store');
        objs.forEach(o => {
          o.setInteractive({ useHandCursor: true });
          o.on('pointerdown', () => {
            this._cursorIndex = globalIdx;
            this.select();
          });
          o.on('pointerover', () => {
            this._cursorIndex = globalIdx;
            this._refresh();
          });
        });
        this._inventoryRows.push(objs);
        y += ROW_H;
      }
    }

    // ── Display case section ──────────────────────────────────────────────
    this._caseHeader.setY(y);
    y += SECTION_HEADER_H;

    if (this._caseItems.length === 0) {
      const empty = s.add.text(PANEL_PAD, y, '(display case is empty)', {
        fontSize: '11px', fontFamily: FONT_FAMILY, color: '#666688', resolution: 2,
      });
      this._container.add(empty);
      this._caseRows.push([empty]);
      y += ROW_H;
    } else {
      const invCount = this._inventoryUnique.length;
      for (let i = 0; i < this._caseItems.length; i++) {
        const item = this._caseItems[i];
        const globalIdx = invCount + i;
        const isSelected = globalIdx === this._cursorIndex;
        const objs = this._makeRow(item, y, isSelected, '← Retrieve');
        objs.forEach(o => {
          o.setInteractive({ useHandCursor: true });
          o.on('pointerdown', () => {
            this._cursorIndex = globalIdx;
            this.select();
          });
          o.on('pointerover', () => {
            this._cursorIndex = globalIdx;
            this._refresh();
          });
        });
        this._caseRows.push(objs);
        y += ROW_H;
      }
    }

    // ── Footer ────────────────────────────────────────────────────────────
    y += 4;
    this._footerText.setY(y);
    const selectedItem = this._selectedItem();
    this._footerText.setText(selectedItem ? selectedItem.description || '' : '');
    y += FOOTER_H;

    // Resize background to fit
    this._bg.setSize(PANEL_W, y);
  }

  /**
   * Builds a single item row (icon + name + action label + optional highlight).
   *
   * @param {import('../items/Item.js').Item} item
   * @param {number} y - Y position within the container.
   * @param {boolean} isSelected - Whether this row has the cursor.
   * @param {string} actionLabel - E.g. '→ Store' or '← Retrieve'.
   * @returns {Phaser.GameObjects.GameObject[]}
   */
  _makeRow(item, y, isSelected, actionLabel) {
    const s = this.scene;
    const objs = [];

    if (isSelected) {
      const highlight = s.add.rectangle(0, y, PANEL_W, ROW_H, 0x333366, 0.8).setOrigin(0);
      this._container.add(highlight);
      objs.push(highlight);
    }

    const icon = ICON_MAP[item.itemType] || '✦';
    const nameText = s.add.text(PANEL_PAD, y + 8, `${icon} ${item.name}`, {
      fontSize: '12px', fontFamily: FONT_FAMILY,
      color: isSelected ? '#ffffff' : '#dddddd',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    });
    this._container.add(nameText);
    objs.push(nameText);

    const actionText = s.add.text(PANEL_W - PANEL_PAD, y + 8, actionLabel, {
      fontSize: '10px', fontFamily: FONT_FAMILY,
      color: isSelected ? '#aaddff' : '#8888aa',
      resolution: 2,
    }).setOrigin(1, 0);
    this._container.add(actionText);
    objs.push(actionText);

    return objs;
  }

  /**
   * Returns the item currently under the cursor, or null.
   * @returns {import('../items/Item.js').Item|null}
   */
  _selectedItem() {
    const invCount = this._inventoryUnique.length;
    if (this._cursorIndex < invCount) {
      return this._inventoryUnique[this._cursorIndex] ?? null;
    }
    return this._caseItems[this._cursorIndex - invCount] ?? null;
  }
}
