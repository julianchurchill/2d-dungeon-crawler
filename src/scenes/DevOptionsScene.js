import { FONT_FAMILY } from '../utils/FontConfig.js';
/**
 * @module DevOptionsScene
 * A Phaser Scene that presents a UI for configuring developer options
 * (start floor, start level, starting inventory items, spawn table weights,
 * and min/max enemies per room).  Settings are written directly to the
 * `devOptions` singleton on every button press and take effect the next time
 * a new game is started.
 *
 * Accessible from the main menu; returns to MainMenuScene via the
 * "BACK TO MENU" button or the ESC key.
 */

import Phaser from 'phaser';
import { devOptions, isSpawnConfigValid } from '../systems/DevOptions.js';
import { ITEM_TYPES } from '../items/ItemTypes.js';
import { ENEMY_DEFS } from '../entities/EnemyTypes.js';

/** @type {number} Width of the [-] and [+] buttons. */
const BTN_W = 32;
/** @type {number} Height of all rows. */
const BTN_H = 28;
/** @type {number} Horizontal gap between the label and the control cluster. */
const CTRL_OFFSET = 160;
/** @type {number} Height of the fixed back-button strip at the bottom. */
const FOOTER_H = 52;

/**
 * All item rows shown in the STARTING ITEMS section, derived dynamically from
 * ITEM_TYPES so that new items are automatically included without any changes
 * here.  Each entry maps the ITEM_TYPES key to its display name.
 */
const ITEM_ROWS = Object.entries(ITEM_TYPES).map(([key, typeDef]) => ({
  label: typeDef.name,
  key,
}));

/**
 * Enemy types shown in the SPAWN TABLE section — regular (non-boss) enemies
 * only.  Boss types are controlled separately in the BOSSES section.
 */
const SPAWN_TABLE_KEYS = Object.keys(ENEMY_DEFS).filter(k => !ENEMY_DEFS[k].isBoss);

/**
 * Boss types shown in the BOSSES section — enemies flagged with `isBoss: true`
 * in ENEMY_DEFS.
 */
const BOSS_KEYS = Object.keys(ENEMY_DEFS).filter(k => ENEMY_DEFS[k].isBoss);

export class DevOptionsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DevOptionsScene' });
  }

  create() {
    const { width, height } = this.scale;
    this._buildBackground();
    this._buildUI(width, height);
    this._buildBackButton(width, height);

    // ESC returns to the main menu.
    this.input.keyboard.on('keydown-ESC', () => this._back());
    this.scale.on('resize', () => this.scene.restart());

    // Scroll the content with the mouse wheel or UP/DOWN arrow keys so that
    // all controls remain reachable even when the content exceeds the viewport.
    this.input.on('wheel', (_ptr, _objs, _dx, deltaY) => {
      this._scrollContent(deltaY > 0 ? 30 : -30);
    });
    this.input.keyboard.on('keydown-UP',   () => this._scrollContent(-30));
    this.input.keyboard.on('keydown-DOWN', () => this._scrollContent(30));
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
      fontSize: '22px', fontFamily: FONT_FAMILY, color: '#ffdd88',
      stroke: '#884400', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5);

    y += 52;

    // Numeric settings
    this._makeNumericRow('Start Floor', 'startFloor', 0, Infinity, cx, y);
    y += 40;
    this._makeNumericRow('Start Level', 'startLevel', 1, Infinity, cx, y);
    y += 52;

    // Items section heading
    this.add.text(cx, y, 'STARTING ITEMS', {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#ffdd88', resolution: 2,
    }).setOrigin(0.5);
    y += 28;

    // Item count rows (keyed by ITEM_TYPES key, range 0–5 each)
    for (const { label, key } of ITEM_ROWS) {
      y += this._makeItemRow(label, key, cx, y);
    }

    y += 16;

    // Spawn table section heading
    this.add.text(cx, y, 'SPAWN TABLE', {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#ffdd88', resolution: 2,
    }).setOrigin(0.5);
    y += 28;

    // allWeightDisplays is shared across rows so that when the first weight is
    // set (transitioning from null → object), all sibling texts update together.
    const allWeightDisplays = {};
    for (const key of SPAWN_TABLE_KEYS) {
      const { rowH, valTxt } = this._makeSpawnWeightRow(
        ENEMY_DEFS[key].name, key, cx, y, allWeightDisplays,
      );
      allWeightDisplays[key] = valTxt;
      y += rowH;
    }

    // Validation error — shown when all weights are zero; hidden otherwise.
    this._validationErrorTxt = this.add.text(cx, y, '⚠ At least one weight must be > 0', {
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#ff6666', resolution: 2,
    }).setOrigin(0.5).setVisible(false);
    y += 22;
    this._updateValidationDisplay();

    // "Reset to floor defaults" link for spawn weights
    this._makeResetLink('Reset spawn to floor defaults', cx, y, () => {
      devOptions.spawnWeights = null;
      this.scene.restart();
    });
    y += 28;

    // Enemies per room section heading
    this.add.text(cx, y, 'ENEMIES PER ROOM', {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#ffdd88', resolution: 2,
    }).setOrigin(0.5);
    y += 28;

    this._makeNullableNumericRow('Min enemies', 'minEnemiesPerRoom', 0, 20, cx, y);
    y += 36;
    this._makeNullableNumericRow('Max enemies', 'maxEnemiesPerRoom', 0, 20, cx, y);
    y += 28;

    // "Reset to floor defaults" link for enemy counts
    this._makeResetLink('Reset enemies to floor defaults', cx, y, () => {
      devOptions.minEnemiesPerRoom = null;
      devOptions.maxEnemiesPerRoom = null;
      this.scene.restart();
    });
    y += 32;

    // Bosses section heading
    this.add.text(cx, y, 'BOSSES', {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#ffdd88', resolution: 2,
    }).setOrigin(0.5);
    y += 20;

    this.add.text(cx, y, 'Total per level (overrides normal boss logic)', {
      fontSize: '10px', fontFamily: FONT_FAMILY, color: '#668899', resolution: 2,
    }).setOrigin(0.5);
    y += 22;

    for (const key of BOSS_KEYS) {
      this._makeBossQuantityRow(ENEMY_DEFS[key].name, key, cx, y);
      y += 36;
    }

    // "Reset to defaults" link for boss quantities
    this._makeResetLink('Reset bosses to normal logic', cx, y, () => {
      devOptions.bossQuantities = null;
      this.scene.restart();
    });
    y += 32;

    // Record total content height so _scrollContent can clamp correctly.
    this._contentHeight = y + 20;
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
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#88ccff', resolution: 2,
    }).setOrigin(1, 0.5);

    // Value display
    const valTxt = this.add.text(cx, y, String(devOptions[field]), {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#ffffff', resolution: 2,
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
   * The label wraps at the available horizontal space so it never overflows
   * off the left edge on narrow (mobile) viewports.
   *
   * @param {string} label - Human-readable item name.
   * @param {string} key   - ITEM_TYPES key, e.g. 'SWORD'.
   * @param {number} cx    - Horizontal centre of the scene.
   * @param {number} y     - Vertical centre of this row.
   * @returns {number} Row height in pixels (for the caller to advance `y`).
   */
  _makeItemRow(label, key, cx, y) {
    /** @returns {number} Current count of this key in startItems. */
    const count = () => devOptions.startItems.filter(k => k === key).length;

    // Wrap the label within the available space so it never overflows left.
    const labelMaxW = cx - CTRL_OFFSET / 2 - 8;
    const labelTxt = this.add.text(cx - CTRL_OFFSET / 2 - 8, y, label + ':', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#aabbcc', resolution: 2,
      wordWrap: { width: labelMaxW },
    }).setOrigin(1, 0.5);

    const valTxt = this.add.text(cx, y, String(count()), {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#ffffff', resolution: 2,
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

    // Row height grows with the label when it wraps on narrow viewports.
    return Math.max(34, labelTxt.height + 20);
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
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#88ccff', resolution: 2,
    }).setOrigin(0.5);

    bg.on('pointerover',  () => { bg.setFillStyle(0x336688); txt.setColor('#ffffff'); });
    bg.on('pointerout',   () => { bg.setFillStyle(0x224466); txt.setColor('#88ccff'); });
    bg.on('pointerdown',  onClick);
  }

  /**
   * Creates a labelled +/− control for one enemy type's weight in the spawn
   * table.  Displays "--" while `devOptions.spawnWeights` is null (floor
   * defaults active).  The first [+] press initialises all weights to 0 and
   * updates every sibling display before incrementing this type.
   *
   * @param {string} label            - Human-readable enemy name.
   * @param {string} key              - ENEMY_DEFS key, e.g. 'goblin'.
   * @param {number} cx               - Horizontal centre of the scene.
   * @param {number} y                - Vertical centre of this row.
   * @param {Object.<string, Phaser.GameObjects.Text>} allWeightDisplays
   *   Shared map of key → text object; populated by the caller as rows are
   *   created.  Used to refresh sibling displays on first weight activation.
   * @returns {{ rowH: number, valTxt: Phaser.GameObjects.Text }}
   *   `rowH` is the row height in pixels; `valTxt` is the value display object.
   */
  _makeSpawnWeightRow(label, key, cx, y, allWeightDisplays) {
    /** @returns {string} Current display value for this key. */
    const display = () =>
      devOptions.spawnWeights === null ? '--' : String(devOptions.spawnWeights[key] ?? 0);

    const labelMaxW = cx - CTRL_OFFSET / 2 - 8;
    const labelTxt = this.add.text(cx - CTRL_OFFSET / 2 - 8, y, label + ' weight:', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#aabbcc', resolution: 2,
      wordWrap: { width: labelMaxW },
    }).setOrigin(1, 0.5);

    const valTxt = this.add.text(cx, y, display(), {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#ffffff', resolution: 2,
    }).setOrigin(0.5);

    this._makeBtn(cx - 40, y, '−', () => {
      if (devOptions.spawnWeights === null) return; // nothing to decrement yet
      devOptions.spawnWeights[key] = Math.max(0, devOptions.spawnWeights[key] - 1);
      valTxt.setText(display());
      this._updateValidationDisplay();
    });

    this._makeBtn(cx + 40, y, '+', () => {
      if (devOptions.spawnWeights === null) {
        // First weight edit — initialise all enemy weights to 0 and refresh
        // every sibling's "--" text so the UI stays consistent.
        devOptions.spawnWeights = Object.fromEntries(SPAWN_TABLE_KEYS.map(k => [k, 0]));
        for (const [k, txt] of Object.entries(allWeightDisplays)) {
          txt.setText(String(devOptions.spawnWeights[k]));
        }
      }
      devOptions.spawnWeights[key] = Math.min(9, devOptions.spawnWeights[key] + 1);
      valTxt.setText(display());
      this._updateValidationDisplay();
    });

    return { rowH: Math.max(34, labelTxt.height + 20), valTxt };
  }

  /**
   * Creates a labelled +/− control for a nullable numeric field on `devOptions`.
   * When the value is `null`, displays "--" (floor default).  The first press
   * of [+] initialises the value to `min`; [−] from `min` resets to `null`.
   *
   * @param {string} label - Human-readable label shown to the left.
   * @param {string} field - Key on `devOptions` to read/write.
   * @param {number} min   - Minimum allowed value (inclusive).
   * @param {number} max   - Maximum allowed value (inclusive).
   * @param {number} cx    - Horizontal centre of the scene.
   * @param {number} y     - Vertical centre of this row.
   */
  _makeNullableNumericRow(label, field, min, max, cx, y) {
    const display = () => devOptions[field] === null ? '--' : String(devOptions[field]);

    this.add.text(cx - CTRL_OFFSET / 2 - 8, y, label + ':', {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#88ccff', resolution: 2,
    }).setOrigin(1, 0.5);

    const valTxt = this.add.text(cx, y, display(), {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#ffffff', resolution: 2,
    }).setOrigin(0.5);

    this._makeBtn(cx - 40, y, '−', () => {
      if (devOptions[field] === null) return;
      if (devOptions[field] <= min) {
        devOptions[field] = null; // back to floor default
      } else {
        devOptions[field] = devOptions[field] - 1;
      }
      valTxt.setText(display());
    });

    this._makeBtn(cx + 40, y, '+', () => {
      if (devOptions[field] === null) {
        devOptions[field] = min;
      } else {
        devOptions[field] = Math.min(max, devOptions[field] + 1);
      }
      valTxt.setText(display());
    });
  }

  /**
   * Creates a labelled +/− control for a boss type's total-per-level quantity
   * in `devOptions.bossQuantities`.  Displays "--" while `bossQuantities` is
   * null (normal boss logic active).  The first [+] press initialises all boss
   * quantities to 0 then increments this type.  [−] from 0 on the last
   * remaining non-zero boss resets the whole map to null.
   *
   * @param {string} label - Human-readable boss name.
   * @param {string} key   - ENEMY_DEFS key, e.g. 'old_bones'.
   * @param {number} cx    - Horizontal centre of the scene.
   * @param {number} y     - Vertical centre of this row.
   */
  _makeBossQuantityRow(label, key, cx, y) {
    const display = () =>
      devOptions.bossQuantities === null ? '--' : String(devOptions.bossQuantities[key] ?? 0);

    const labelMaxW = cx - CTRL_OFFSET / 2 - 8;
    this.add.text(cx - CTRL_OFFSET / 2 - 8, y, label + ' count:', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#aabbcc', resolution: 2,
      wordWrap: { width: labelMaxW },
    }).setOrigin(1, 0.5);

    const valTxt = this.add.text(cx, y, display(), {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#ffffff', resolution: 2,
    }).setOrigin(0.5);

    this._makeBtn(cx - 40, y, '−', () => {
      if (devOptions.bossQuantities === null) return;
      const current = devOptions.bossQuantities[key] ?? 0;
      if (current > 0) {
        devOptions.bossQuantities[key] = current - 1;
      }
      // If all bosses are now 0, revert to null (normal logic)
      if (Object.values(devOptions.bossQuantities).every(v => v === 0)) {
        devOptions.bossQuantities = null;
      }
      valTxt.setText(display());
    });

    this._makeBtn(cx + 40, y, '+', () => {
      if (devOptions.bossQuantities === null) {
        // First edit — initialise all boss quantities to 0
        devOptions.bossQuantities = Object.fromEntries(BOSS_KEYS.map(k => [k, 0]));
      }
      devOptions.bossQuantities[key] = Math.min(5, (devOptions.bossQuantities[key] ?? 0) + 1);
      valTxt.setText(display());
    });
  }

  /**
   * Creates a small text link that calls `onClick` when pressed.  Used for
   * "Reset to floor defaults" actions that revert an override to `null`.
   *
   * @param {string}   label   - Link text.
   * @param {number}   cx      - Horizontal centre.
   * @param {number}   y       - Vertical centre.
   * @param {Function} onClick - Callback invoked on pointer-down.
   */
  _makeResetLink(label, cx, y, onClick) {
    const txt = this.add.text(cx, y, label, {
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#668899', resolution: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    txt.on('pointerover', () => txt.setColor('#aaccdd'));
    txt.on('pointerout',  () => txt.setColor('#668899'));
    txt.on('pointerdown', onClick);
  }

  /**
   * Renders a "BACK" button pinned to the bottom of the viewport.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildBackButton(width, height) {
    // Dark footer strip so content doesn't bleed under the button.
    this.add.rectangle(0, height - FOOTER_H, width, FOOTER_H, 0x080818)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9);

    const btn = this.add.text(width / 2, height - FOOTER_H / 2, 'BACK', {
      fontSize: '18px', fontFamily: FONT_FAMILY,
      color: '#888888', stroke: '#000000', strokeThickness: 3, resolution: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setColor('#ffffff'));
    btn.on('pointerout',   () => btn.setColor('#888888'));
    btn.on('pointerdown',  () => this._back());
  }

  /**
   * Scrolls the camera by `delta` pixels, clamped so the content never
   * scrolls above its top or below its bottom.
   *
   * @param {number} delta - Positive scrolls down, negative scrolls up.
   */
  _scrollContent(delta) {
    const maxScroll = Math.max(0, this._contentHeight - this.scale.height + FOOTER_H);
    this.cameras.main.scrollY = Phaser.Math.Clamp(
      this.cameras.main.scrollY + delta, 0, maxScroll,
    );
  }

  /**
   * Shows or hides the validation error text based on whether the current
   * spawn configuration is valid.  Called after every weight change.
   */
  _updateValidationDisplay() {
    if (this._validationErrorTxt) {
      this._validationErrorTxt.setVisible(!isSpawnConfigValid(devOptions));
    }
  }

  /**
   * Attempts to return to the main menu.  Blocked when the spawn table
   * override has been activated but all weights are zero (which would crash
   * the spawner with an empty table).
   */
  _back() {
    if (!isSpawnConfigValid(devOptions)) return; // validation error already visible
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => this.scene.start('MainMenuScene'));
  }
}
