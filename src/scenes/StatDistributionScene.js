/**
 * @module StatDistributionScene
 * @description Phaser overlay scene shown after every level-up, allowing the player
 * to freely distribute 2 stat points between Attack and Defense.
 *
 * Launched by GameScene after `gainXP` returns true.  Receives a `player` reference
 * and an optional `skillSystem` via Phaser scene init data.  GameScene and UIScene
 * sleep while this scene is active.
 *
 * When all stat points have been spent the scene either chains to SkillLevelUpScene
 * (if skill choices are available) or wakes the sleeping scenes and stops itself.
 */

import Phaser from 'phaser';
import { FONT_FAMILY } from '../utils/FontConfig.js';

/** Width of each stat button. */
const BTN_W = 200;
/** Height of each stat button. */
const BTN_H = 60;

export class StatDistributionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StatDistributionScene' });
  }

  /**
   * @param {{ player: import('../entities/Player.js').Player, skillSystem: object|null }} data
   */
  init(data) {
    /** @type {import('../entities/Player.js').Player} */
    this._player = data.player;
    /** @type {object|null} */
    this._skillSystem = data.skillSystem ?? null;
  }

  create() {
    if (this._player.stats.statPoints <= 0) { this._finish(); return; }

    const { width, height } = this.scale;

    this._buildBackground(width, height);
    this._buildTitle(width);
    this._buildStatButtons(width, height);
    this._buildPointsText(width, height);
    this._buildStatDisplay(width, height);
    this._setupKeyboard();

    this.scale.on('resize', () => this.scene.restart());
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /** @param {number} width @param {number} height */
  _buildBackground(width, height) {
    this.add.rectangle(0, 0, width, height, 0x080818).setOrigin(0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a1a3a, 0.4);
    for (let x = 0; x < width; x += 32) g.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 32) g.lineBetween(0, y, width, y);
  }

  /** @param {number} width */
  _buildTitle(width) {
    this.add.rectangle(0, 0, width, 80, 0x080818).setOrigin(0).setDepth(9);

    this.add.text(width / 2, 28, 'LEVEL UP!', {
      fontSize: '28px', fontFamily: FONT_FAMILY,
      color: '#ffdd88', stroke: '#884400', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5, 0).setDepth(10);

    this.add.text(width / 2, 62, 'Distribute your stat points', {
      fontSize: '14px', fontFamily: FONT_FAMILY,
      color: '#aaaacc', stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0).setDepth(10);
  }

  /**
   * Creates the ATK and DEF buttons and stores references for hover/focus updates.
   * @param {number} width @param {number} height
   */
  _buildStatButtons(width, height) {
    const cx  = width / 2;
    const mid = height / 2;

    // Attack button
    this._atkBg = this.add.rectangle(cx - BTN_W / 2 - 16, mid, BTN_W, BTN_H, 0x111122)
      .setOrigin(1, 0.5)
      .setStrokeStyle(2, 0xff6644)
      .setInteractive({ useHandCursor: true });

    this.add.text(cx - BTN_W / 2 - 16 - BTN_W / 2, mid, '+1  ATTACK', {
      fontSize: '18px', fontFamily: FONT_FAMILY,
      color: '#ff8866', stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5).setDepth(1);

    // Defense button
    this._defBg = this.add.rectangle(cx + BTN_W / 2 + 16, mid, BTN_W, BTN_H, 0x111122)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x4488ff)
      .setInteractive({ useHandCursor: true });

    this.add.text(cx + BTN_W / 2 + 16 + BTN_W / 2, mid, '+1  DEFENSE', {
      fontSize: '18px', fontFamily: FONT_FAMILY,
      color: '#88aaff', stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5).setDepth(1);

    // Mouse events
    this._atkBg.on('pointerover', () => this._atkBg.setFillStyle(0x332211));
    this._atkBg.on('pointerout',  () => this._refreshFocus());
    this._atkBg.on('pointerdown', () => this._spend('attack'));

    this._defBg.on('pointerover', () => this._defBg.setFillStyle(0x112233));
    this._defBg.on('pointerout',  () => this._refreshFocus());
    this._defBg.on('pointerdown', () => this._spend('defense'));

    // 0 = attack, 1 = defense
    this._focused = 0;
    this._refreshFocus();
  }

  /**
   * Shows remaining stat points below the buttons.
   * @param {number} width @param {number} height
   */
  _buildPointsText(width, height) {
    this._pointsText = this.add.text(width / 2, height / 2 + BTN_H, '', {
      fontSize: '16px', fontFamily: FONT_FAMILY,
      color: '#ffdd88', stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0).setDepth(1);
    this._refreshPointsText();
  }

  /**
   * Shows current ATK and DEF values above the buttons.
   * @param {number} width @param {number} height
   */
  _buildStatDisplay(width, height) {
    const y = height / 2 - BTN_H - 20;
    this._atkText = this.add.text(width / 2 - BTN_W / 2 - 16 - BTN_W / 2, y,
      `ATK  ${this._player.stats.attack}`, {
        fontSize: '20px', fontFamily: FONT_FAMILY,
        color: '#ff8866', stroke: '#000000', strokeThickness: 2, resolution: 2,
      }).setOrigin(0.5).setDepth(1);

    this._defText = this.add.text(width / 2 + BTN_W / 2 + 16 + BTN_W / 2, y,
      `DEF  ${this._player.stats.defense}`, {
        fontSize: '20px', fontFamily: FONT_FAMILY,
        color: '#88aaff', stroke: '#000000', strokeThickness: 2, resolution: 2,
      }).setOrigin(0.5).setDepth(1);
  }

  /** Keyboard: LEFT/A = attack, RIGHT/D = defense, ENTER/SPACE = confirm. */
  _setupKeyboard() {
    this.input.keyboard.on('keydown-LEFT',  () => { this._focused = 0; this._refreshFocus(); });
    this.input.keyboard.on('keydown-A',     () => { this._focused = 0; this._refreshFocus(); });
    this.input.keyboard.on('keydown-RIGHT', () => { this._focused = 1; this._refreshFocus(); });
    this.input.keyboard.on('keydown-D',     () => { this._focused = 1; this._refreshFocus(); });
    this.input.keyboard.on('keydown-ENTER', () => this._spend(this._focused === 0 ? 'attack' : 'defense'));
    this.input.keyboard.on('keydown-SPACE', () => this._spend(this._focused === 0 ? 'attack' : 'defense'));
  }

  /** Applies one stat point to `stat` and refreshes the display. */
  _spend(stat) {
    if (this._player.stats.statPoints <= 0) return;
    this._player.applyStatPoint(stat);
    this._refreshStatDisplay();
    this._refreshPointsText();
    if (this._player.stats.statPoints <= 0) this._finish();
  }

  /** Re-colours the two buttons to reflect keyboard focus. */
  _refreshFocus() {
    this._atkBg.setFillStyle(this._focused === 0 ? 0x332211 : 0x111122);
    this._defBg.setFillStyle(this._focused === 1 ? 0x112233 : 0x111122);
  }

  _refreshPointsText() {
    const pts = this._player.stats.statPoints;
    this._pointsText.setText(`Points remaining: ${pts}`);
  }

  _refreshStatDisplay() {
    this._atkText.setText(`ATK  ${this._player.stats.attack}`);
    this._defText.setText(`DEF  ${this._player.stats.defense}`);
  }

  /**
   * Chains to SkillLevelUpScene if skill choices exist; otherwise wakes game scenes.
   */
  _finish() {
    const ss = this._skillSystem;
    const hasSkillChoices = ss &&
      (ss.getInactiveSkills().length > 0 || ss.getSkills().some(s => s.canUpgrade));

    if (hasSkillChoices) {
      this.scene.launch('SkillLevelUpScene', { skillSystem: ss });
      this.scene.stop();
    } else {
      this.scene.wake('GameScene');
      this.scene.wake('UIScene');
      this.scene.stop();
    }
  }
}
