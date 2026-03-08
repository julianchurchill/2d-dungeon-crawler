import Phaser from 'phaser';
import { APP_VERSION_STRING } from '../utils/AppVersion.js';
import { resetDevOptions } from '../systems/DevOptions.js';
import { isDevEnvironment } from '../utils/Environment.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    this._buildBackground();
    this._buildTitle(width, height);
    const menuBottomY = this._buildMenu(width, height);
    this._buildControls(width, menuBottomY + 24);
    this._buildVersion(width, height);

    this.scale.on('resize', this._onResize, this);
  }

  _buildBackground() {
    // Animated scanline background
    this.add.rectangle(0, 0, 2000, 2000, 0x080818).setOrigin(0);
    // Grid pattern
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a1a3a, 0.4);
    for (let x = 0; x < 2000; x += 32) g.lineBetween(x, 0, x, 2000);
    for (let y = 0; y < 2000; y += 32) g.lineBetween(0, y, 2000, y);
  }

  _buildTitle(width, height) {
    this.add.text(width / 2, height * 0.22, 'DUNGEON', {
      fontSize: '52px',
      fontFamily: 'monospace',
      color: '#ffdd88',
      stroke: '#884400',
      strokeThickness: 6,
      resolution: 2,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.22 + 56, 'CRAWLER', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#cc8844',
      stroke: '#442200',
      strokeThickness: 4,
      resolution: 2,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.22 + 98, 'A Roguelike Dungeon Adventure', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#888888',
      resolution: 2,
    }).setOrigin(0.5);
  }

  _buildMenu(width, height) {
    const btnY = height * 0.58;

    // Start button
    const startBg = this.add.rectangle(width / 2, btnY, 200, 44, 0x224466, 1)
      .setStrokeStyle(2, 0x4488cc)
      .setInteractive({ useHandCursor: true });

    const startTxt = this.add.text(width / 2, btnY, '▶  START GAME', {
      fontSize: '16px', fontFamily: 'monospace', color: '#88ccff', resolution: 2,
    }).setOrigin(0.5);

    startBg.on('pointerover', () => {
      startBg.setFillStyle(0x336688);
      startTxt.setColor('#ffffff');
    });
    startBg.on('pointerout', () => {
      startBg.setFillStyle(0x224466);
      startTxt.setColor('#88ccff');
    });
    startBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
      });
    });

    // Pulse animation on start button
    this.tweens.add({
      targets: [startBg, startTxt],
      alpha: { from: 1, to: 0.6 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Achievements button
    const achBtnY = btnY + 56;
    const achBg = this.add.rectangle(width / 2, achBtnY, 200, 34, 0x1a2a3a)
      .setStrokeStyle(1, 0x336677)
      .setInteractive({ useHandCursor: true });

    const achTxt = this.add.text(width / 2, achBtnY, '★  ACHIEVEMENTS', {
      fontSize: '12px', fontFamily: 'monospace', color: '#6699aa', resolution: 2,
    }).setOrigin(0.5);

    achBg.on('pointerover', () => {
      achBg.setFillStyle(0x223344);
      achTxt.setColor('#ffdd88');
    });
    achBg.on('pointerout', () => {
      achBg.setFillStyle(0x1a2a3a);
      achTxt.setColor('#6699aa');
    });
    achBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(200, () =>
        this.scene.start('AchievementsScene', { fromScene: 'MainMenuScene' }));
    });

    // DEV OPTIONS button — only shown in development builds
    let lastBtnY = achBtnY;
    if (isDevEnvironment()) {
      const devBtnY = achBtnY + 44;
      lastBtnY = devBtnY;
      const devBg = this.add.rectangle(width / 2, devBtnY, 200, 34, 0x1a2a3a)
        .setStrokeStyle(1, 0x336677)
        .setInteractive({ useHandCursor: true });

      const devTxt = this.add.text(width / 2, devBtnY, '⚙  DEV OPTIONS', {
        fontSize: '12px', fontFamily: 'monospace', color: '#6699aa', resolution: 2,
      }).setOrigin(0.5);

      devBg.on('pointerover', () => {
        devBg.setFillStyle(0x223344);
        devTxt.setColor('#88ccff');
      });
      devBg.on('pointerout', () => {
        devBg.setFillStyle(0x1a2a3a);
        devTxt.setColor('#6699aa');
      });
      devBg.on('pointerdown', () => {
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.time.delayedCall(200, () => this.scene.start('DevOptionsScene'));
      });
    }

    // Also start on spacebar / enter
    this.input.keyboard.on('keydown-SPACE', () => this._startGame());
    this.input.keyboard.on('keydown-ENTER', () => this._startGame());

    // Return the bottom edge of the last button so the caller can position
    // content below it without overlapping.
    return lastBtnY + 17;
  }

  _startGame() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });
  }

  /**
   * Renders the controls reference below the menu buttons.
   *
   * @param {number} width  - Canvas width.
   * @param {number} startY - Y pixel to place the first line at.
   */
  _buildControls(width, startY) {
    const lines = [
      'CONTROLS',
      '──────────────────',
      'WASD / Arrow Keys — Move',
      'SHIFT + Direction — Run',
      'Bump into enemies — Attack',
      'Walk over items — Pick Up',
      'I — Open Inventory',
      '> on stairs — Descend',
      '',
      'Mobile: Use the D-Pad on screen',
    ];

    lines.forEach((line, i) => {
      this.add.text(width / 2, startY + i * 16, line, {
        fontSize: i === 0 ? '13px' : '11px',
        fontFamily: 'monospace',
        color: i === 0 ? '#ffdd88' : '#888888',
        resolution: 2,
      }).setOrigin(0.5);
    });
  }

  /**
   * Renders the build version string in the bottom-right corner of the screen.
   * Displays the semantic version, short git commit hash, and UTC build time.
   *
   * @param {number} width  - Current canvas width.
   * @param {number} height - Current canvas height.
   */
  _buildVersion(width, height) {
    this.add.text(width - 8, height - 8, APP_VERSION_STRING, {
      fontSize: '9px',
      fontFamily: 'monospace',
      color: '#445566',
      resolution: 2,
    }).setOrigin(1, 1);
  }

  _onResize(gameSize) {
    this.scene.restart();
  }
}
