import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    this._buildBackground();
    this._buildTitle(width, height);
    this._buildMenu(width, height);
    this._buildControls(width, height);

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

    // Also start on spacebar / enter
    this.input.keyboard.on('keydown-SPACE', () => this._startGame());
    this.input.keyboard.on('keydown-ENTER', () => this._startGame());
  }

  _startGame() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });
  }

  _buildControls(width, height) {
    const lines = [
      'CONTROLS',
      '──────────────────',
      'WASD / Arrow Keys — Move',
      'Bump into enemies — Attack',
      'Walk over items — Pick Up',
      'I — Open Inventory',
      '> on stairs — Descend',
      '',
      'Mobile: Use the D-Pad on screen',
    ];

    lines.forEach((line, i) => {
      this.add.text(width / 2, height * 0.7 + i * 16, line, {
        fontSize: i === 0 ? '13px' : '11px',
        fontFamily: 'monospace',
        color: i === 0 ? '#ffdd88' : '#888888',
        resolution: 2,
      }).setOrigin(0.5);
    });
  }

  _onResize(gameSize) {
    this.scene.restart();
  }
}
