import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { DIR } from '../utils/Direction.js';
import { DoubleTapDetector } from '../systems/DoubleTapDetector.js';

const BTN_SIZE = 52;
const PAD = BTN_SIZE + 5;
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

    // Container anchored at bottom-left
    const anchorX = BTN_SIZE + 18;
    const anchorY = height - BTN_SIZE - 18;
    this._anchorX = anchorX;
    this._anchorY = anchorY;

    this._container = s.add.container(anchorX, anchorY)
      .setDepth(200).setScrollFactor(0);

    // Center pad (visual only)
    this._container.add(
      s.add.rectangle(0, 0, BTN_SIZE, BTN_SIZE, 0x2a2a3a, 0.6)
        .setStrokeStyle(1, 0x555566)
    );

    // Directional buttons — all positioned relative to container origin
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

    // Action buttons (right of d-pad)
    this._addActionBtn(PAD * 2 + 10, 0,    0x334455, 0x88aacc, 'INV',  '#aaccff', () => EventBus.emit(GameEvents.TOGGLE_INVENTORY));
    this._addActionBtn(PAD * 2 + 10, -PAD, 0x554433, 0xccaa88, '▼▼',   '#ffcc88', () => EventBus.emit(GameEvents.USE_STAIRS));
  }

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

  resize(width, height) {
    const anchorX = BTN_SIZE + 18;
    const anchorY = height - BTN_SIZE - 18;
    this._container.setPosition(anchorX, anchorY);
  }

  setVisible(visible) {
    this._container.setVisible(visible);
  }
}
