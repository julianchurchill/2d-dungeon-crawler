/**
 * @module DevOptionsScene
 * A Phaser Scene that presents a UI for configuring developer options
 * (start floor, start level, and starting inventory items).  Settings are
 * written directly to the `devOptions` singleton on every button press and
 * take effect the next time a new game is started.
 *
 * Accessible from the main menu; returns to MainMenuScene via the
 * "BACK TO MENU" button or the ESC key.
 */

import Phaser from 'phaser';
import { devOptions } from '../systems/DevOptions.js';
import { ITEM_TYPES } from '../items/ItemTypes.js';

/** @type {number} Width of the [-] and [+] buttons. */
const BTN_W = 32;
/** @type {number} Height of all rows. */
const BTN_H = 28;
/** @type {number} Horizontal gap between the label and the control cluster. */
const CTRL_OFFSET = 160;

/**
 * All item rows shown in the STARTING ITEMS section, derived dynamically from
 * ITEM_TYPES so that new items are automatically included without any changes
 * here.  Each entry maps the ITEM_TYPES key to its display name.
 */
const ITEM_ROWS = Object.entries(ITEM_TYPES).map(([key, typeDef]) => ({
  label: typeDef.name,
  key,
}));

export class DevOptionsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DevOptionsScene' });
  }

  create() {
    const { width, height } = this.scale;
    this._buildBackground();
    this._buildUI(width, height);

    // ESC returns to the main menu.
    this.input.keyboard.on('keydown-ESC', () => this._back());
    this.scale.on('resize', () => this.scene.restart());
  }

  // ─── Background ──────────────────────────────────────────────────────────

  /** Draws the same dark grid background used by MainMenuScene. */
  _buildBackground() {
    this.add.rectangle(0, 0, 2000, 2000, 0x080818).setOrigin(0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a1a3a, 0.4);
    for (let x = 0; x < 2000; x += 32) g.lineBetween(x, 0, x, 2000);
    for (let y = 0; y < 2000; y += 32) g.lineBetween(0, y, 2000, y);
  }

  // ─── UI layout ───────────────────────────────────────────────────────────

  /**
   * Builds all UI elements — title, numeric rows, item rows, and back button.
   *
   * @param {number} width  - Canvas width.
   * @param {number} height - Canvas height.
   */
  _buildUI(width, height) {
    const cx = width / 2;
    let y = height * 0.12;

    // Title
    this.add.text(cx, y, 'DEVELOPER OPTIONS', {
      fontSize: '22px', fontFamily: 'monospace', color: '#ffdd88',
      stroke: '#884400', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5);

    y += 52;

    // Numeric settings
    this._makeNumericRow('Start Floor', 'startFloor', 1, 10, cx, y);
    y += 40;
    this._makeNumericRow('Start Level', 'startLevel', 1, 20, cx, y);
    y += 52;

    // Items section heading
    this.add.text(cx, y, 'STARTING ITEMS', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffdd88', resolution: 2,
    }).setOrigin(0.5);
    y += 28;

    // Item count rows (keyed by ITEM_TYPES key, range 0–5 each)
    for (const { label, key } of ITEM_ROWS) {
      this._makeItemRow(label, key, cx, y);
      y += 34;
    }

    y += 16;

    // Back button
    this._makeBackButton(cx, y);
  }

  /**
   * Creates a labelled +/− control for a numeric field on `devOptions`.
   * The value display updates immediately on each button press.
   *
   * @param {string} label      - Human-readable label shown to the left.
   * @param {string} field      - Key on `devOptions` to read/write.
   * @param {number} min        - Minimum allowed value (inclusive).
   * @param {number} max        - Maximum allowed value (inclusive).
   * @param {number} cx         - Horizontal centre of the scene.
   * @param {number} y          - Vertical centre of this row.
   */
  _makeNumericRow(label, field, min, max, cx, y) {
    // Label (right-aligned, ending at cx - CTRL_OFFSET/2)
    this.add.text(cx - CTRL_OFFSET / 2 - 8, y, label + ':', {
      fontSize: '13px', fontFamily: 'monospace', color: '#88ccff', resolution: 2,
    }).setOrigin(1, 0.5);

    // Value display
    const valTxt = this.add.text(cx, y, String(devOptions[field]), {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffffff', resolution: 2,
    }).setOrigin(0.5);

    // [-] button
    this._makeBtn(cx - 40, y, '−', () => {
      devOptions[field] = Math.max(min, devOptions[field] - 1);
      valTxt.setText(String(devOptions[field]));
    });

    // [+] button
    this._makeBtn(cx + 40, y, '+', () => {
      devOptions[field] = Math.min(max, devOptions[field] + 1);
      valTxt.setText(String(devOptions[field]));
    });
  }

  /**
   * Creates a labelled +/− control for one item type in the starting items
   * array.  The count reflects how many times the given key appears in
   * `devOptions.startItems`.
   *
   * @param {string} label - Human-readable item name.
   * @param {string} key   - ITEM_TYPES key, e.g. 'SWORD'.
   * @param {number} cx    - Horizontal centre of the scene.
   * @param {number} y     - Vertical centre of this row.
   */
  _makeItemRow(label, key, cx, y) {
    /** @returns {number} Current count of this key in startItems. */
    const count = () => devOptions.startItems.filter(k => k === key).length;

    this.add.text(cx - CTRL_OFFSET / 2 - 8, y, label + ':', {
      fontSize: '12px', fontFamily: 'monospace', color: '#aabbcc', resolution: 2,
    }).setOrigin(1, 0.5);

    const valTxt = this.add.text(cx, y, String(count()), {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffffff', resolution: 2,
    }).setOrigin(0.5);

    this._makeBtn(cx - 40, y, '−', () => {
      const idx = devOptions.startItems.lastIndexOf(key);
      if (idx !== -1) devOptions.startItems.splice(idx, 1);
      valTxt.setText(String(count()));
    });

    this._makeBtn(cx + 40, y, '+', () => {
      if (count() < 5) devOptions.startItems.push(key);
      valTxt.setText(String(count()));
    });
  }

  /**
   * Creates a single interactive rectangle + text button.
   *
   * @param {number}   x        - Centre x.
   * @param {number}   y        - Centre y.
   * @param {string}   label    - Button text.
   * @param {Function} onClick  - Callback invoked on pointer-down.
   */
  _makeBtn(x, y, label, onClick) {
    const bg = this.add.rectangle(x, y, BTN_W, BTN_H, 0x224466)
      .setStrokeStyle(1, 0x4488cc)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, label, {
      fontSize: '14px', fontFamily: 'monospace', color: '#88ccff', resolution: 2,
    }).setOrigin(0.5);

    bg.on('pointerover',  () => { bg.setFillStyle(0x336688); txt.setColor('#ffffff'); });
    bg.on('pointerout',   () => { bg.setFillStyle(0x224466); txt.setColor('#88ccff'); });
    bg.on('pointerdown',  onClick);
  }

  /**
   * Creates the "BACK TO MENU" button that returns to MainMenuScene.
   *
   * @param {number} cx - Horizontal centre.
   * @param {number} y  - Vertical centre.
   */
  _makeBackButton(cx, y) {
    const bg = this.add.rectangle(cx, y, 180, 36, 0x224466)
      .setStrokeStyle(2, 0x4488cc)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(cx, y, '◀  BACK TO MENU', {
      fontSize: '13px', fontFamily: 'monospace', color: '#88ccff', resolution: 2,
    }).setOrigin(0.5);

    bg.on('pointerover',  () => { bg.setFillStyle(0x336688); txt.setColor('#ffffff'); });
    bg.on('pointerout',   () => { bg.setFillStyle(0x224466); txt.setColor('#88ccff'); });
    bg.on('pointerdown',  () => this._back());
  }

  /** Transitions back to the main menu with a short fade. */
  _back() {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => this.scene.start('MainMenuScene'));
  }
}
