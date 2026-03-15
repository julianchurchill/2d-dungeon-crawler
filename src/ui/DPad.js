import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { DIR } from '../utils/Direction.js';
import { DoubleTapDetector } from '../systems/DoubleTapDetector.js';

const BTN_SIZE = 52;
const PAD = BTN_SIZE + 5;

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
  constructor(scene) {
    this.scene = scene;
    this._container = null;
    /** @type {DoubleTapDetector} Detects double-taps to trigger runs. */
    this._doubleTap = new DoubleTapDetector(DOUBLE_TAP_MS);
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
      const bg = s.add.rectangle(x, y, BTN_SIZE, BTN_SIZE, 0x333355, 0.75)
        .setStrokeStyle(1, 0x7777aa)
        .setInteractive({ useHandCursor: false });

      const txt = s.add.text(x, y, label, {
        fontSize: '22px', color: '#aaaacc', resolution: 2,
      }).setOrigin(0.5);

      bg.on('pointerdown', (ptr, lx, ly, evt) => {
        evt.stopPropagation();
        bg.setFillStyle(0x5555aa, 0.9);
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
        bg.setFillStyle(0x333355, 0.75);
        EventBus.emit(GameEvents.DPAD_HOLD_END, dir);
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x333355, 0.75);
        EventBus.emit(GameEvents.DPAD_HOLD_END, dir);
      });

      this._container.add([bg, txt]);
    }

    // ── Action buttons fill the unused corners of the 3×3 grid ──────────────
    //
    //   [≡]  [▲]  [ ]       (-PAD,-PAD)  (0,-PAD)  (PAD,-PAD)
    //   [◀] [INV] [▶]   →   (-PAD,  0)   (0,  0)   (PAD,  0)
    //   [▼▼] [▼]  [ ]       (-PAD, PAD)  (0, PAD)  (PAD, PAD)

    // INV — centre, thumb-accessible without repositioning the hand.
    this._addActionBtn(0, 0, 0x334455, 0x88aacc, 'INV', '#aaccff',
      () => EventBus.emit(GameEvents.TOGGLE_INVENTORY));

    // Menu (≡) — top-left corner; opens Achievements or closes the message log.
    this._addActionBtn(-PAD, -PAD, 0x334433, 0x88aa88, '≡', '#aaffaa',
      () => EventBus.emit(GameEvents.OPEN_ACHIEVEMENTS));

    // Stairs — bottom-left corner; less frequently used.
    this._addActionBtn(-PAD, PAD, 0x554433, 0xccaa88, '▼▼', '#ffcc88',
      () => EventBus.emit(GameEvents.USE_STAIRS));
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
