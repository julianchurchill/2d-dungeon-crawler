/**
 * @module DevGiveItemScene
 * @description Full-screen dev-mode overlay that lets the developer give any
 * item from ITEM_TYPES directly to the player's inventory during a run.
 *
 * Each item row shows a GIVE button. Pressing it emits DEV_GIVE_ITEM with the
 * item's ITEM_TYPES key; GameScene handles the event and calls
 * player.addItem(). A message is appended to the log if the inventory is full.
 *
 * Items are grouped by equipment slot (consumables, weapons, etc.) to keep
 * the list readable. The content scrolls with the mouse wheel or UP/DOWN keys.
 *
 * Pressing BACK or ESC returns to DevMenuScene.
 */

import Phaser from 'phaser';
import { FONT_FAMILY } from '../utils/FontConfig.js';
import { ITEM_TYPES } from '../items/ItemTypes.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';

/** Height of the fixed header strip. */
const HEADER_H = 80;

/** Height of the fixed footer strip. */
const FOOTER_H = 52;

/** Display heading for each item type slot, in preferred display order. */
const SLOT_HEADINGS = {
  consumable:    'Consumables',
  weapon:        'Weapons',
  ranged_weapon: 'Ranged Weapons',
  armor:         'Armour',
  helmet:        'Helmet',
  chest:         'Chest',
  legs:          'Legs',
  arms:          'Arms',
  boots:         'Boots',
  ring:          'Rings',
  amulet:        'Amulets',
  quest_item:    'Quest Items',
};

/**
 * All ITEM_TYPES entries grouped by slot type, in SLOT_HEADINGS order.
 * Groups with no items are omitted. Items not matched by any slot fall into a
 * trailing "Other" group.
 *
 * @type {Array<{ heading: string, items: Array<{ key: string, label: string }> }>}
 */
const ITEM_GROUPS = (() => {
  const groups = Object.entries(SLOT_HEADINGS).reduce((acc, [type, heading]) => {
    const items = Object.entries(ITEM_TYPES)
      .filter(([, def]) => def.type === type)
      .map(([key, def]) => ({ key, label: def.name }));
    if (items.length > 0) acc.push({ heading, items });
    return acc;
  }, []);

  // Catch any types not listed in SLOT_HEADINGS.
  const knownTypes = new Set(Object.keys(SLOT_HEADINGS));
  const other = Object.entries(ITEM_TYPES)
    .filter(([, def]) => !knownTypes.has(def.type))
    .map(([key, def]) => ({ key, label: def.name }));
  if (other.length > 0) groups.push({ heading: 'Other', items: other });

  return groups;
})();

export class DevGiveItemScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DevGiveItemScene' });
  }

  create() {
    const { width, height } = this.scale;

    this._buildBackground(width, height);
    this._buildHeader(width);
    this._buildItemList(width);
    this._buildBackButton(width, height);

    this.input.keyboard.on('keydown-ESC', () => this._back());
    this.scale.on('resize', () => this.scene.restart());

    this.input.on('wheel', (_ptr, _objs, _dx, deltaY) => {
      this._scrollContent(deltaY > 0 ? 30 : -30);
    });
    this.input.keyboard.on('keydown-UP',   () => this._scrollContent(-30));
    this.input.keyboard.on('keydown-DOWN', () => this._scrollContent(30));
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Dark tiled background matching other dev scenes.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildBackground(width, height) {
    this.add.rectangle(0, 0, width, height, 0x080818).setOrigin(0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a1a3a, 0.4);
    for (let x = 0; x < width; x += 32) g.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 32) g.lineBetween(0, y, width, y);
  }

  /**
   * Fixed header with the scene title.
   *
   * @param {number} width
   */
  _buildHeader(width) {
    this.add.rectangle(0, 0, width, HEADER_H, 0x080818)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9);

    this.add.text(width / 2, 28, 'GIVE ITEMS', {
      fontSize: '28px', fontFamily: FONT_FAMILY,
      color: '#ff9999', stroke: '#660000', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);

    this.add.text(width / 2, 62, 'Adds one item to the player\'s inventory immediately', {
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#668899', resolution: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
  }

  /**
   * Renders all item groups, each preceded by a sub-heading.
   * Records total content height so _scrollContent can clamp correctly.
   *
   * @param {number} width
   */
  _buildItemList(width) {
    const cx = width / 2;
    let y = HEADER_H + 16;

    for (const { heading, items } of ITEM_GROUPS) {
      this.add.text(cx, y, heading.toUpperCase(), {
        fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ffdd88', resolution: 2,
      }).setOrigin(0.5);
      y += 24;

      for (const { key, label } of items) {
        y += this._makeGiveRow(label, key, cx, y);
      }
      y += 10;
    }

    this._contentHeight = y + 20;
  }

  /**
   * Renders a single GIVE row: item name on the left, [GIVE] button on the
   * right. Clicking emits DEV_GIVE_ITEM with the item key.
   *
   * @param {string} label - Display name of the item.
   * @param {string} key   - ITEM_TYPES key.
   * @param {number} cx    - Horizontal centre of the screen.
   * @param {number} y     - Top of this row.
   * @returns {number} Row height consumed (for the caller to advance y).
   */
  _makeGiveRow(label, key, cx, y) {
    const ROW_H  = 32;
    const ROW_W  = 280;

    this.add.text(cx - ROW_W / 2, y + ROW_H / 2, label, {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#cccccc', resolution: 2,
    }).setOrigin(0, 0.5);

    const btn = this.add.text(cx + ROW_W / 2, y + ROW_H / 2, '[GIVE]', {
      fontSize: '14px', fontFamily: FONT_FAMILY,
      color: '#88ff88', stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setColor('#ffffff'));
    btn.on('pointerout',   () => btn.setColor('#88ff88'));
    btn.on('pointerdown',  () => EventBus.emit(GameEvents.DEV_GIVE_ITEM, key));

    return ROW_H;
  }

  /**
   * Fixed footer containing the BACK button.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildBackButton(width, height) {
    this.add.rectangle(0, height - FOOTER_H, width, FOOTER_H, 0x080818)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9);

    const btn = this.add.text(width / 2, height - FOOTER_H / 2, 'BACK', {
      fontSize: '20px', fontFamily: FONT_FAMILY,
      color: '#888888', stroke: '#000000', strokeThickness: 3, resolution: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .setScrollFactor(0).setDepth(10);

    btn.on('pointerover',  () => btn.setColor('#cccccc'));
    btn.on('pointerout',   () => btn.setColor('#888888'));
    btn.on('pointerdown',  () => this._back());
  }

  /**
   * Scrolls the camera by the given pixel delta, clamped to content bounds.
   *
   * @param {number} delta
   */
  _scrollContent(delta) {
    const maxScroll = Math.max(0, this._contentHeight - this.scale.height + FOOTER_H);
    this.cameras.main.scrollY = Phaser.Math.Clamp(
      this.cameras.main.scrollY + delta, 0, maxScroll,
    );
  }

  /**
   * Returns to DevMenuScene.
   */
  _back() {
    this.scene.launch('DevMenuScene');
    this.scene.stop();
  }
}
