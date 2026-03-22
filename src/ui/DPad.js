import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { DIR } from '../utils/Direction.js';
import { DoubleTapDetector } from '../systems/DoubleTapDetector.js';

const BTN_SIZE = 52;
const PAD = BTN_SIZE + 5;

// ── Colour palette ─────────────────────────────────────────────────────────────
/** Directional button normal fill colour — dark blue-purple. */
const COLOR_DIR_FILL    = 0x333355;
/** Directional button border colour — medium purple. */
const COLOR_DIR_STROKE  = 0x7777aa;
/** Directional button fill colour when pressed — bright purple. */
const COLOR_DIR_PRESSED = 0x5555aa;
/** Directional button label text colour — light purple. */
const COLOR_DIR_LABEL   = '#aaaacc';

/** Action button (INV / K) fill colour — dark steel blue. */
const COLOR_ACTION_FILL   = 0x334455;
/** Action button border colour — medium steel blue. */
const COLOR_ACTION_STROKE = 0x88aacc;
/** Action button label text colour — light blue. */
const COLOR_ACTION_LABEL  = '#aaccff';

/** Menu button (≡) fill colour — dark olive green. */
const COLOR_MENU_FILL   = 0x334433;
/** Menu button border colour — medium sage green. */
const COLOR_MENU_STROKE = 0x88aa88;
/** Menu button label text colour — light mint green. */
const COLOR_MENU_LABEL  = '#aaffaa';

/** Stairs button (▼▼) fill colour — dark brown. */
const COLOR_STAIRS_FILL   = 0x554433;
/** Stairs button border colour — medium tan. */
const COLOR_STAIRS_STROKE = 0xccaa88;
/** Stairs button label text colour — light amber. */
const COLOR_STAIRS_LABEL  = '#ffcc88';

/**
 * Pixels from the bottom of the screen to the D-pad anchor (centre of the
 * directional cross).  Must clear the compact message-log strip
 * (4 lines × 18 px + 20 px margin ≈ 92 px from the bottom) plus a
 * comfortable gap so the controls do not overlap it.
 */
const DPAD_BOTTOM_OFFSET = 175;

/**
 * Pixels from the left edge of the screen to the D-pad anchor.
 * The left column of buttons (Menu, LEFT, Stairs) extends PAD + BTN_SIZE/2 px
 * to the left of the anchor; this offset ensures they remain on screen with a
 * small margin.
 */
const DPAD_LEFT_OFFSET = PAD + Math.ceil(BTN_SIZE / 2) + 12; // ≈ 95 px

/** Maximum milliseconds between two taps on the same button to count as a double-tap (run trigger). */
const DOUBLE_TAP_MS = 300;

export class DPad {
  /**
   * @param {Phaser.Scene} scene - The parent scene that owns this D-pad.
   */
  constructor(scene) {
    this.scene = scene;
    this._container = null;
    /** @type {DoubleTapDetector} Detects double-taps to trigger runs. */
    this._doubleTap = new DoubleTapDetector(DOUBLE_TAP_MS);
    /** @type {boolean} Whether the centre sub-menu is currently open. */
    this._subMenuOpen = false;
    /** @type {Phaser.GameObjects.Text|null} Label of the centre toggle button. */
    this._centreTxt = null;
    /** @type {Array<Phaser.GameObjects.GameObject>} Objects shown only in sub-menu state. */
    this._subMenuItems = [];
    this._build();
  }

  _build() {
    const s = this.scene;
    const { width, height } = s.scale;

    // Container anchored at bottom-left, raised above the message-log strip.
    // anchorX is offset enough to keep the left column of buttons on screen.
    const anchorX = DPAD_LEFT_OFFSET;
    const anchorY = height - DPAD_BOTTOM_OFFSET;

    this._container = s.add.container(anchorX, anchorY)
      .setDepth(200).setScrollFactor(0);

    // Directional buttons — all positioned relative to container origin.
    const dirs = [
      { dir: DIR.UP,    x: 0,    y: -PAD, label: '▲' },
      { dir: DIR.DOWN,  x: 0,    y:  PAD, label: '▼' },
      { dir: DIR.LEFT,  x: -PAD, y: 0,    label: '◀' },
      { dir: DIR.RIGHT, x:  PAD, y: 0,    label: '▶' },
    ];

    for (const { dir, x, y, label } of dirs) {
      const bg = s.add.rectangle(x, y, BTN_SIZE, BTN_SIZE, COLOR_DIR_FILL, 0.75)
        .setStrokeStyle(1, COLOR_DIR_STROKE)
        .setInteractive({ useHandCursor: false });

      const txt = s.add.text(x, y, label, {
        fontSize: '22px', color: COLOR_DIR_LABEL, resolution: 2,
      }).setOrigin(0.5);

      bg.on('pointerdown', (ptr, lx, ly, evt) => {
        evt.stopPropagation();
        bg.setFillStyle(COLOR_DIR_PRESSED, 0.9);
        // Notify HeldMovementTracker so auto-repeat kicks in after each turn.
        EventBus.emit(GameEvents.DPAD_HOLD_START, dir);
        if (this._doubleTap.tap(dir)) {
          // Second tap in quick succession — start a run instead of a single move.
          EventBus.emit(GameEvents.DPAD_RUN, dir);
        } else {
          EventBus.emit(GameEvents.DPAD_PRESS, dir);
        }
      });

      bg.on('pointerup', () => {
        bg.setFillStyle(COLOR_DIR_FILL, 0.75);
        EventBus.emit(GameEvents.DPAD_HOLD_END, dir);
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(COLOR_DIR_FILL, 0.75);
        EventBus.emit(GameEvents.DPAD_HOLD_END, dir);
      });

      this._container.add([bg, txt]);
    }

    // ── Action buttons ────────────────────────────────────────────────────────
    //
    //   Normal:                Sub-menu open:
    //   [≡]  [▲]  [ ]         [≡]  [▲] [INV]
    //   [◀] [···] [▶]    →    [◀]  [✕] [▶]
    //   [▼▼] [▼]  [ ]         [▼▼] [▼] [ K ]

    // Centre ··· — toggles the INV / K sub-menu.
    this._buildCentreButton();

    // Menu (≡) — top-left corner; opens the in-game menu or closes the message log.
    this._addActionBtn(-PAD, -PAD, COLOR_MENU_FILL, COLOR_MENU_STROKE, '≡', COLOR_MENU_LABEL,
      () => EventBus.emit(GameEvents.OPEN_IN_GAME_MENU));

    // Stairs — bottom-left corner; less frequently used.
    this._addActionBtn(-PAD, PAD, COLOR_STAIRS_FILL, COLOR_STAIRS_STROKE, '▼▼', COLOR_STAIRS_LABEL,
      () => EventBus.emit(GameEvents.USE_STAIRS));

    // Sub-menu buttons — hidden until the centre button is tapped.
    this._buildSubMenuButtons();
  }

  /**
   * Creates the centre ··· / ✕ toggle button.
   * Tapping it opens or closes the INV / K sub-menu.
   */
  _buildCentreButton() {
    const s = this.scene;
    const bg = s.add.rectangle(0, 0, BTN_SIZE, BTN_SIZE, COLOR_ACTION_FILL, 0.8)
      .setStrokeStyle(1, COLOR_ACTION_STROKE)
      .setInteractive({ useHandCursor: false });

    this._centreTxt = s.add.text(0, 0, '···', {
      fontSize: '13px', fontFamily: 'monospace', color: COLOR_ACTION_LABEL, resolution: 2,
    }).setOrigin(0.5);

    bg.on('pointerdown', (ptr, lx, ly, evt) => {
      evt.stopPropagation();
      bg.setAlpha(1);
      this._toggleSubMenu();
    });
    bg.on('pointerup',  () => bg.setAlpha(0.8));
    bg.on('pointerout', () => bg.setAlpha(0.8));

    this._container.add([bg, this._centreTxt]);
  }

  /**
   * Creates the INV (top-right) and K (bottom-right) sub-menu buttons and
   * registers them in _subMenuItems so they can be shown/hidden as a group.
   * Both buttons are hidden by default.
   */
  _buildSubMenuButtons() {
    const invItems = this._createSubBtn(PAD, -PAD, 'INV', () => {
      this._closeSubMenu();
      EventBus.emit(GameEvents.TOGGLE_INVENTORY);
    });
    const skillItems = this._createSubBtn(PAD, PAD, 'K', () => {
      this._closeSubMenu();
      EventBus.emit(GameEvents.TOGGLE_SKILLS);
    });

    this._subMenuItems = [...invItems, ...skillItems];
    for (const obj of this._subMenuItems) obj.setVisible(false);
    this._container.add(this._subMenuItems);
  }

  /**
   * Creates a sub-menu action button and returns the [bg, txt] pair.
   *
   * @param {number}   x        - Container-relative X position.
   * @param {number}   y        - Container-relative Y position.
   * @param {string}   label    - Button label text.
   * @param {function} onPress  - Called when the button is tapped.
   * @returns {Phaser.GameObjects.GameObject[]}
   */
  _createSubBtn(x, y, label, onPress) {
    const s = this.scene;
    const bg = s.add.rectangle(x, y, BTN_SIZE, BTN_SIZE, COLOR_ACTION_FILL, 0.8)
      .setStrokeStyle(1, COLOR_ACTION_STROKE)
      .setInteractive({ useHandCursor: false });

    const txt = s.add.text(x, y, label, {
      fontSize: '13px', fontFamily: 'monospace', color: COLOR_ACTION_LABEL, resolution: 2,
    }).setOrigin(0.5);

    bg.on('pointerdown', (ptr, lx, ly, evt) => {
      evt.stopPropagation();
      bg.setAlpha(1);
      onPress();
    });
    bg.on('pointerup',  () => bg.setAlpha(0.8));
    bg.on('pointerout', () => bg.setAlpha(0.8));

    return [bg, txt];
  }

  /**
   * Opens the INV / K sub-menu and updates the centre button label to ✕.
   */
  _openSubMenu() {
    this._subMenuOpen = true;
    this._centreTxt.setText('✕');
    for (const obj of this._subMenuItems) obj.setVisible(true);
  }

  /**
   * Closes the INV / K sub-menu and restores the centre button label to ···.
   */
  _closeSubMenu() {
    this._subMenuOpen = false;
    this._centreTxt.setText('···');
    for (const obj of this._subMenuItems) obj.setVisible(false);
  }

  /**
   * Toggles the sub-menu open or closed.
   */
  _toggleSubMenu() {
    if (this._subMenuOpen) {
      this._closeSubMenu();
    } else {
      this._openSubMenu();
    }
  }

  /**
   * Adds a labelled action button at the given container-relative position.
   *
   * @param {number}   x          - X position relative to the container origin.
   * @param {number}   y          - Y position relative to the container origin.
   * @param {number}   fillColor  - Button background colour.
   * @param {number}   strokeColor - Button border colour.
   * @param {string}   label      - Text label for the button.
   * @param {string}   textColor  - CSS colour string for the label.
   * @param {function} onPress    - Called when the button is tapped.
   */
  _addActionBtn(x, y, fillColor, strokeColor, label, textColor, onPress) {
    const s = this.scene;
    const bg = s.add.rectangle(x, y, BTN_SIZE, BTN_SIZE, fillColor, 0.8)
      .setStrokeStyle(1, strokeColor)
      .setInteractive({ useHandCursor: false });
    const txt = s.add.text(x, y, label, {
      fontSize: '13px', fontFamily: 'monospace', color: textColor, resolution: 2,
    }).setOrigin(0.5);

    bg.on('pointerdown', (ptr, lx, ly, evt) => {
      evt.stopPropagation();
      bg.setAlpha(1);
      onPress();
    });
    bg.on('pointerup', () => bg.setAlpha(0.8));
    bg.on('pointerout', () => bg.setAlpha(0.8));

    this._container.add([bg, txt]);
  }

  /**
   * Repositions the D-pad container when the canvas is resized.
   *
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    this._container.setPosition(DPAD_LEFT_OFFSET, height - DPAD_BOTTOM_OFFSET);
  }

  /**
   * Shows or hides the entire D-pad.
   *
   * @param {boolean} visible
   */
  setVisible(visible) {
    this._container.setVisible(visible);
  }
}
