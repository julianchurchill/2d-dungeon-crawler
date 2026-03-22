/**
 * @module DevPanel
 * @description In-game developer panel (dev mode only) that provides runtime
 * toggles for invincibility cheats.  Opened/closed via the TOGGLE_DEV_PANEL
 * EventBus event.  Each row shows a label and a clickable [ON]/[OFF] toggle.
 */

import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { devOptions } from '../systems/DevOptions.js';

const PANEL_W   = 280;
const PANEL_PAD = 16;
const ROW_H     = 36;
const HEADER_H  = 40;

/**
 * Describes a toggle row: the label to display and the devOptions key to flip.
 * @typedef {{ label: string, key: string }} ToggleDef
 */
const TOGGLES = [
  { label: 'Enemies invincible', key: 'enemiesInvincible' },
  { label: 'Player invincible',  key: 'playerInvincible'  },
];

export class DevPanel {
  /**
   * @param {Phaser.Scene} scene - The owning UIScene.
   */
  constructor(scene) {
    this.scene   = scene;
    this.visible = false;
    this._rows   = [];
    this._build();

    EventBus.on(GameEvents.TOGGLE_DEV_PANEL, () => {
      if (this.visible) {
        this.hide();
      } else {
        this.show();
      }
    });
  }

  /** @private */
  _build() {
    const s = this.scene;
    const panelH = HEADER_H + TOGGLES.length * ROW_H + PANEL_PAD;

    this._container = s.add.container(0, 0)
      .setDepth(350).setScrollFactor(0).setVisible(false);

    this._bg = s.add.rectangle(0, 0, PANEL_W, panelH, 0x111122, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xaa4444);
    this._container.add(this._bg);

    this._title = s.add.text(PANEL_W / 2, 10, 'DEV OPTIONS', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ff9999',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0);
    this._container.add(this._title);
  }

  /**
   * Renders/re-renders the toggle rows and shows the panel.
   */
  show() {
    const s = this.scene;
    const { width, height } = s.scale;
    const panelH = HEADER_H + TOGGLES.length * ROW_H + PANEL_PAD;

    // Remove stale row objects so we always reflect the latest devOptions state.
    this._rows.forEach(r => r.destroy());
    this._rows = [];

    const panelX = Math.floor((width  - PANEL_W) / 2);
    const panelY = Math.floor((height - panelH)  / 2);
    this._bg.setSize(PANEL_W, panelH);
    this._container.setPosition(panelX, panelY);

    TOGGLES.forEach(({ label, key }, i) => {
      const y = HEADER_H + i * ROW_H;

      const labelTxt = s.add.text(PANEL_PAD, y + ROW_H / 2, label, {
        fontSize: '12px', fontFamily: 'monospace', color: '#cccccc',
        stroke: '#000000', strokeThickness: 2, resolution: 2,
      }).setOrigin(0, 0.5);

      const toggleTxt = this._makeToggle(s, key, y);

      this._container.add([labelTxt, toggleTxt]);
      this._rows.push(labelTxt, toggleTxt);
    });

    this._container.setVisible(true);
    this.visible = true;
  }

  /**
   * Creates a clickable [ON]/[OFF] text button that flips the given devOptions key.
   *
   * @param {Phaser.Scene} s   - The owning scene.
   * @param {string}       key - The devOptions boolean key to toggle.
   * @param {number}       y   - Row Y offset within the container.
   * @returns {Phaser.GameObjects.Text}
   * @private
   */
  _makeToggle(s, key, y) {
    const getValue = () => devOptions[key];
    const label    = () => getValue() ? '[ON] ' : '[OFF]';
    const color    = () => getValue() ? '#88ff88' : '#ff8888';

    const btn = s.add.text(PANEL_W - PANEL_PAD, y + ROW_H / 2, label(), {
      fontSize: '12px', fontFamily: 'monospace', color: color(),
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      devOptions[key] = !devOptions[key];
      btn.setText(label());
      btn.setColor(color());
    });

    return btn;
  }

  /**
   * Hides the dev panel.
   */
  hide() {
    this._container.setVisible(false);
    this.visible = false;
  }
}
