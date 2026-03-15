/**
 * @module InGameMenuScene
 * @description A Phaser scene that presents the in-game pause menu.
 *
 * Shown when the player presses ESC (or the mobile ≡ button) while the
 * message log history panel is closed.  Offers two options:
 *  - ACHIEVEMENTS — opens the AchievementsScene overlay
 *  - HELP         — opens the HelpScene overlay
 *
 * Back / ESC returns control to the game without doing anything else.
 * GameScene and UIScene are sleeping while this scene is active.
 */

import Phaser from 'phaser';

/** Height of the fixed header area. */
const HEADER_H = 80;

export class InGameMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InGameMenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    this._buildBackground(width, height);
    this._buildTitle(width);
    this._buildButtons(width, height);

    // ESC returns to the game.
    this.input.keyboard.on('keydown-ESC', () => this._back());
    this.scale.on('resize', () => this.scene.restart());
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Dark full-screen background with subtle grid lines, matching the
   * AchievementsScene aesthetic.
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
   * Renders the "MENU" heading with a dark backing strip.
   *
   * @param {number} width
   */
  _buildTitle(width) {
    this.add.rectangle(0, 0, width, HEADER_H, 0x080818)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9);

    this.add.text(width / 2, 28, 'MENU', {
      fontSize: '28px', fontFamily: 'monospace',
      color: '#ffdd88', stroke: '#884400', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
  }

  /**
   * Renders the ACHIEVEMENTS, HELP, and BACK buttons centred on screen.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildButtons(width, height) {
    const cx = width / 2;
    const startY = HEADER_H + (height - HEADER_H) / 2 - 60;

    this._addMenuButton(cx, startY,      'ACHIEVEMENTS', '#ffdd88', '#664400', () => this._openAchievements());
    this._addMenuButton(cx, startY + 60, 'HELP',         '#aaddff', '#004466', () => this._openHelp());
    this._addMenuButton(cx, startY + 120, 'BACK',        '#888888', '#333333', () => this._back());
  }

  /**
   * Creates a centred text button with hover colour feedback.
   *
   * @param {number}   x
   * @param {number}   y
   * @param {string}   label
   * @param {string}   color     - Normal text colour.
   * @param {string}   hoverColor - Text colour on pointer-over.
   * @param {function} onPress
   */
  _addMenuButton(x, y, label, color, hoverColor, onPress) {
    const btn = this.add.text(x, y, label, {
      fontSize: '22px', fontFamily: 'monospace',
      color, stroke: '#000000', strokeThickness: 3, resolution: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setColor(hoverColor));
    btn.on('pointerout',   () => btn.setColor(color));
    btn.on('pointerdown',  onPress);
  }

  /**
   * Launches AchievementsScene with this scene as the origin so that its
   * Back button returns here rather than directly to the game.
   */
  _openAchievements() {
    this.scene.launch('AchievementsScene', { fromScene: 'InGameMenuScene' });
    this.scene.stop();
  }

  /**
   * Launches HelpScene with this scene as the origin.
   */
  _openHelp() {
    this.scene.launch('HelpScene', { fromScene: 'InGameMenuScene' });
    this.scene.stop();
  }

  /**
   * Returns to the game by waking the sleeping scenes and stopping this one.
   */
  _back() {
    this.scene.wake('GameScene');
    this.scene.wake('UIScene');
    this.scene.stop();
  }
}
