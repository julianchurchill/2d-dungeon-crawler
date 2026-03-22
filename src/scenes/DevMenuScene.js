/**
 * @module DevMenuScene
 * @description Full-screen dev-mode overlay reached from the in-game menu.
 * Shows runtime toggle options (enemy and player invincibility) that take
 * effect immediately without restarting the game.
 *
 * Pressing BACK or ESC returns to InGameMenuScene.
 */

import Phaser from 'phaser';
import { devOptions } from '../systems/DevOptions.js';

/** Height of the fixed header area. */
const HEADER_H = 80;

/**
 * Each toggle row: display label and the devOptions key to flip.
 * @type {{ label: string, key: string }[]}
 */
const TOGGLES = [
  { label: 'Enemies invincible', key: 'enemiesInvincible' },
  { label: 'Player invincible',  key: 'playerInvincible'  },
];

export class DevMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DevMenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    this._buildBackground(width, height);
    this._buildTitle(width);
    this._buildToggles(width, height);
    this._buildBackButton(width, height);

    this.input.keyboard.on('keydown-ESC', () => this._back());
    this.scale.on('resize', () => this.scene.restart());
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Dark full-screen background with subtle grid lines.
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
   * Renders the "DEV OPTIONS" heading.
   *
   * @param {number} width
   */
  _buildTitle(width) {
    this.add.rectangle(0, 0, width, HEADER_H, 0x080818)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9);

    this.add.text(width / 2, 28, 'DEV OPTIONS', {
      fontSize: '28px', fontFamily: 'monospace',
      color: '#ff9999', stroke: '#660000', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
  }

  /**
   * Renders a toggle row for each entry in TOGGLES.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildToggles(width, height) {
    const cx    = width / 2;
    const totalH = TOGGLES.length * 56;
    const startY = HEADER_H + (height - HEADER_H) / 2 - totalH / 2 - 30;

    TOGGLES.forEach(({ label, key }, i) => {
      const y = startY + i * 56;
      this._addToggleRow(cx, y, label, key);
    });
  }

  /**
   * Renders a single toggle row: a label on the left and a [ON]/[OFF] button
   * on the right that flips the given devOptions key on click.
   *
   * @param {number} cx  - Horizontal centre of the screen.
   * @param {number} y   - Vertical position of this row.
   * @param {string} label
   * @param {string} key - devOptions boolean key to toggle.
   */
  _addToggleRow(cx, y, label, key) {
    const ROW_W = 320;

    this.add.text(cx - ROW_W / 2, y, label, {
      fontSize: '20px', fontFamily: 'monospace',
      color: '#cccccc', stroke: '#000000', strokeThickness: 3, resolution: 2,
    }).setOrigin(0, 0.5);

    const getLabel = () => devOptions[key] ? '[ON] ' : '[OFF]';
    const getColor = () => devOptions[key] ? '#88ff88' : '#ff8888';

    const btn = this.add.text(cx + ROW_W / 2, y, getLabel(), {
      fontSize: '20px', fontFamily: 'monospace',
      color: getColor(), stroke: '#000000', strokeThickness: 3, resolution: 2,
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      devOptions[key] = !devOptions[key];
      btn.setText(getLabel());
      btn.setColor(getColor());
    });
  }

  /**
   * Renders a BACK button pinned to the footer strip.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildBackButton(width, height) {
    const FOOTER_H = 48;
    this.add.rectangle(0, height - FOOTER_H, width, FOOTER_H, 0x080818)
      .setOrigin(0, 0).setDepth(9);

    const btn = this.add.text(width / 2, height - FOOTER_H / 2, 'BACK', {
      fontSize: '20px', fontFamily: 'monospace',
      color: '#888888', stroke: '#000000', strokeThickness: 3, resolution: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);

    btn.on('pointerover',  () => btn.setColor('#cccccc'));
    btn.on('pointerout',   () => btn.setColor('#888888'));
    btn.on('pointerdown',  () => this._back());
  }

  /**
   * Returns to InGameMenuScene.
   */
  _back() {
    this.scene.launch('InGameMenuScene');
    this.scene.stop();
  }
}
