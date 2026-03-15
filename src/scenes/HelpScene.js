/**
 * @module HelpScene
 * @description A Phaser scene that shows in-game control instructions.
 *
 * Content is automatically tailored to the current device:
 *  - Touch devices see tap / double-tap / hold button controls.
 *  - Non-touch devices see keyboard bindings.
 *
 * Launched by InGameMenuScene with `{ fromScene: 'GameScene' }`.
 * The Back button (or ESC) wakes GameScene + UIScene and stops this scene.
 */

import Phaser from 'phaser';
import { getHelpContent } from '../systems/HelpContent.js';
import { isTouchDevice } from '../utils/TouchDeviceDetector.js';
import { resolveSceneBack } from '../systems/SceneNavigation.js';

/** Height of the fixed header area. */
const HEADER_H = 72;

/** Height of the fixed footer area. */
const FOOTER_H = 52;

/** Left padding for content. */
const PAD = 24;

export class HelpScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HelpScene' });
  }

  /**
   * @param {{ fromScene?: string }} [data]
   */
  init(data) {
    this._fromScene = data?.fromScene ?? 'MainMenuScene';
  }

  create() {
    const { width, height } = this.scale;
    this._buildBackground(width, height);
    this._buildTitle(width);
    this._buildContent(width, height);
    this._buildBackButton(width, height);

    this.input.keyboard.on('keydown-ESC', () => this._back());
    this.scale.on('resize', () => this.scene.restart());
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Dark full-screen background with grid lines.
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
   * Renders the "HELP" heading with a dark backing strip.
   *
   * @param {number} width
   */
  _buildTitle(width) {
    this.add.rectangle(0, 0, width, HEADER_H, 0x080818)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9);

    this.add.text(width / 2, 24, 'HELP', {
      fontSize: '28px', fontFamily: 'monospace',
      color: '#aaddff', stroke: '#004466', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
  }

  /**
   * Renders each help section (heading + lines) stacked vertically.
   *
   * @param {number} width
   * @param {number} _height
   */
  _buildContent(width, _height) {
    const sections = getHelpContent(isTouchDevice());
    let y = HEADER_H + 16;

    for (const { heading, lines } of sections) {
      // Section heading
      this.add.text(PAD, y, heading, {
        fontSize: '14px', fontFamily: 'monospace',
        color: '#ffdd88', stroke: '#000000', strokeThickness: 2, resolution: 2,
      });
      y += 22;

      // Content lines
      for (const line of lines) {
        this.add.text(PAD + 16, y, line, {
          fontSize: '12px', fontFamily: 'monospace',
          color: '#cccccc', stroke: '#000000', strokeThickness: 1, resolution: 2,
        });
        y += 20;
      }
      y += 12; // gap between sections
    }
  }

  /**
   * Renders the BACK button pinned to the bottom of the screen.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildBackButton(width, height) {
    // Dark footer strip so content doesn't bleed under the button.
    this.add.rectangle(0, height - FOOTER_H, width, FOOTER_H, 0x080818)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9);

    const btn = this.add.text(width / 2, height - FOOTER_H / 2, 'BACK', {
      fontSize: '18px', fontFamily: 'monospace',
      color: '#888888', stroke: '#000000', strokeThickness: 3, resolution: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setColor('#ffffff'));
    btn.on('pointerout',   () => btn.setColor('#888888'));
    btn.on('pointerdown',  () => this._back());
  }

  /**
   * Wakes GameScene + UIScene and stops this scene.
   */
  _back() {
    const nav = resolveSceneBack(this._fromScene);
    if (nav.action === 'wake') {
      this.scene.wake('GameScene');
      this.scene.wake('UIScene');
    } else if (nav.action === 'launch') {
      this.scene.launch(nav.scene);
    } else {
      this.scene.start(nav.scene);
    }
    this.scene.stop();
  }
}
