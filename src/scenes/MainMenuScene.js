import { FONT_FAMILY } from '../utils/FontConfig.js';
import Phaser from 'phaser';
import { APP_VERSION_STRING } from '../utils/AppVersion.js';
import { resetDevOptions } from '../systems/DevOptions.js';
import { isDevEnvironment } from '../utils/Environment.js';
import { MenuNavigator } from '../utils/MenuNavigator.js';
import { hasAnySave } from '../save/SaveGame.js';

/** Text colour applied to the currently keyboard-focused menu item. */
const COLOR_FOCUSED = '#ffffff';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    /** @type {Array<{onFocus: function, onBlur: function, onSelect: function}>} */
    this._navItems = [];

    this._buildBackground();
    this._buildTitle(width, height);
    this._buildMenu(width, height);
    this._buildVersion(width, height);
    this._setupKeyboardNav();

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
      fontFamily: FONT_FAMILY,
      color: '#ffdd88',
      stroke: '#884400',
      strokeThickness: 6,
      resolution: 2,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.22 + 56, 'CRAWLER', {
      fontSize: '36px',
      fontFamily: FONT_FAMILY,
      color: '#cc8844',
      stroke: '#442200',
      strokeThickness: 4,
      resolution: 2,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.22 + 98, 'A Roguelike Dungeon Adventure', {
      fontSize: '13px',
      fontFamily: FONT_FAMILY,
      color: '#888888',
      resolution: 2,
    }).setOrigin(0.5);
  }

  _buildMenu(width, height) {
    const btnY = height * 0.52;
    const saveExists = hasAnySave();

    // CONTINUE button — only active when a save exists
    const contColor  = saveExists ? '#88ffcc' : '#445555';
    const contFill   = saveExists ? 0x224433   : 0x1a2a2a;
    const contHover  = saveExists ? 0x336655   : 0x1a2a2a;
    const contBg = this.add.rectangle(width / 2, btnY, 200, 44, contFill, 1)
      .setStrokeStyle(2, saveExists ? 0x44cc88 : 0x334444);
    if (saveExists) contBg.setInteractive({ useHandCursor: true });

    const contTxt = this.add.text(width / 2, btnY, '▶  CONTINUE', {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: contColor, resolution: 2,
    }).setOrigin(0.5);

    const goContinue = () => {
      if (!saveExists) return;
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('SaveSlotScene', { mode: 'continue' }));
    };
    if (saveExists) {
      contBg.on('pointerover', () => { contBg.setFillStyle(contHover); contTxt.setColor('#ffffff'); });
      contBg.on('pointerout',  () => {
        contBg.setFillStyle(contFill);
        const isFocused = this._nav && this._nav.focusedIndex === 0;
        contTxt.setColor(isFocused ? COLOR_FOCUSED : contColor);
      });
      contBg.on('pointerdown', goContinue);

      // Pulse animation on continue button
      this.tweens.add({
        targets: [contBg, contTxt],
        alpha: { from: 1, to: 0.6 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this._navItems.push({
      onFocus:  () => { if (saveExists) { contBg.setFillStyle(contHover); contTxt.setColor(COLOR_FOCUSED); } },
      onBlur:   () => { contBg.setFillStyle(contFill); contTxt.setColor(contColor); },
      onSelect: goContinue,
    });

    // NEW GAME button
    const newBtnY = btnY + 56;
    const newBg = this.add.rectangle(width / 2, newBtnY, 200, 44, 0x224466, 1)
      .setStrokeStyle(2, 0x4488cc)
      .setInteractive({ useHandCursor: true });

    const newTxt = this.add.text(width / 2, newBtnY, '✦  NEW GAME', {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: '#88ccff', resolution: 2,
    }).setOrigin(0.5);

    newBg.on('pointerover', () => { newBg.setFillStyle(0x336688); newTxt.setColor('#ffffff'); });
    newBg.on('pointerout',  () => {
      newBg.setFillStyle(0x224466);
      const isFocused = this._nav && this._nav.focusedIndex === 1;
      newTxt.setColor(isFocused ? COLOR_FOCUSED : '#88ccff');
    });
    newBg.on('pointerdown', () => this._startGame());

    this._navItems.push({
      onFocus:  () => { newBg.setFillStyle(0x336688); newTxt.setColor(COLOR_FOCUSED); },
      onBlur:   () => { newBg.setFillStyle(0x224466); newTxt.setColor('#88ccff'); },
      onSelect: () => this._startGame(),
    });

    // OPTIONS button
    const optBtnY = newBtnY + 56;
    const optBg = this.add.rectangle(width / 2, optBtnY, 200, 34, 0x1a2a3a)
      .setStrokeStyle(1, 0x336677)
      .setInteractive({ useHandCursor: true });

    const optTxt = this.add.text(width / 2, optBtnY, '⚙  OPTIONS', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#6699aa', resolution: 2,
    }).setOrigin(0.5);

    const goOptions = () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(200, () => this.scene.start('OptionsScene'));
    };
    optBg.on('pointerover', () => { optBg.setFillStyle(0x223344); optTxt.setColor('#88ccff'); });
    optBg.on('pointerout',  () => {
      optBg.setFillStyle(0x1a2a3a);
      const isFocused = this._nav && this._nav.focusedIndex === this._navItems.length;
      optTxt.setColor(isFocused ? COLOR_FOCUSED : '#6699aa');
    });
    optBg.on('pointerdown', goOptions);

    this._navItems.push({
      onFocus:  () => { optBg.setFillStyle(0x223344); optTxt.setColor(COLOR_FOCUSED); },
      onBlur:   () => { optBg.setFillStyle(0x1a2a3a); optTxt.setColor('#6699aa'); },
      onSelect: goOptions,
    });

    // HELP button
    const helpBtnY = optBtnY + 44;
    const helpBg = this.add.rectangle(width / 2, helpBtnY, 200, 34, 0x1a2a3a)
      .setStrokeStyle(1, 0x336677)
      .setInteractive({ useHandCursor: true });

    const helpTxt = this.add.text(width / 2, helpBtnY, '?  HELP', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#6699aa', resolution: 2,
    }).setOrigin(0.5);

    const goHelp = () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(200, () =>
        this.scene.start('HelpScene', { fromScene: 'MainMenuScene' }));
    };
    helpBg.on('pointerover', () => { helpBg.setFillStyle(0x223344); helpTxt.setColor('#aaddff'); });
    helpBg.on('pointerout',  () => {
      helpBg.setFillStyle(0x1a2a3a);
      const isFocused = this._nav && this._nav.focusedIndex === this._navItems.length;
      helpTxt.setColor(isFocused ? COLOR_FOCUSED : '#6699aa');
    });
    helpBg.on('pointerdown', goHelp);

    this._navItems.push({
      onFocus:  () => { helpBg.setFillStyle(0x223344); helpTxt.setColor(COLOR_FOCUSED); },
      onBlur:   () => { helpBg.setFillStyle(0x1a2a3a); helpTxt.setColor('#6699aa'); },
      onSelect: goHelp,
    });

    // DEV OPTIONS button — only shown in development builds
    if (isDevEnvironment()) {
      const devBtnY = helpBtnY + 44;
      const devBg = this.add.rectangle(width / 2, devBtnY, 200, 34, 0x1a2a3a)
        .setStrokeStyle(1, 0x336677)
        .setInteractive({ useHandCursor: true });

      const devTxt = this.add.text(width / 2, devBtnY, '⚙  DEV OPTIONS', {
        fontSize: '12px', fontFamily: FONT_FAMILY, color: '#6699aa', resolution: 2,
      }).setOrigin(0.5);

      const goDevOptions = () => {
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.time.delayedCall(200, () => this.scene.start('DevOptionsScene'));
      };
      devBg.on('pointerover', () => { devBg.setFillStyle(0x223344); devTxt.setColor('#88ccff'); });
      devBg.on('pointerout',  () => {
        devBg.setFillStyle(0x1a2a3a);
        const isFocused = this._nav && this._nav.focusedIndex === this._navItems.length;
        devTxt.setColor(isFocused ? COLOR_FOCUSED : '#6699aa');
      });
      devBg.on('pointerdown', goDevOptions);

      this._navItems.push({
        onFocus:  () => { devBg.setFillStyle(0x223344); devTxt.setColor(COLOR_FOCUSED); },
        onBlur:   () => { devBg.setFillStyle(0x1a2a3a); devTxt.setColor('#6699aa'); },
        onSelect: goDevOptions,
      });
    }
  }

  /**
   * Wires UP/DOWN/W/S for navigation and ENTER/SPACE for selection.
   * Sets initial focus on the first item (START GAME).
   */
  _setupKeyboardNav() {
    this._nav = new MenuNavigator(this._navItems.length);
    // Start focus on NEW GAME (index 1) when no save exists so the first
    // actionable button is immediately selected.
    if (!hasAnySave()) this._nav._index = 1;
    this._updateFocus();

    this.input.keyboard.on('keydown-UP',    () => { this._nav.prev(); this._updateFocus(); });
    this.input.keyboard.on('keydown-W',     () => { this._nav.prev(); this._updateFocus(); });
    this.input.keyboard.on('keydown-DOWN',  () => { this._nav.next(); this._updateFocus(); });
    this.input.keyboard.on('keydown-S',     () => { this._nav.next(); this._updateFocus(); });
    this.input.keyboard.on('keydown-ENTER', () => this._activateFocused());
    this.input.keyboard.on('keydown-SPACE', () => this._activateFocused());
  }

  /**
   * Refreshes the visual focus state of every nav item.
   */
  _updateFocus() {
    this._navItems.forEach(({ onFocus, onBlur }, i) => {
      if (i === this._nav.focusedIndex) { onFocus(); } else { onBlur(); }
    });
  }

  /**
   * Activates the currently focused menu item.
   */
  _activateFocused() {
    this._navItems[this._nav.focusedIndex].onSelect();
  }

  _startGame() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => this.scene.start('SaveSlotScene', { mode: 'new' }));
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
      fontSize: '11px',
      fontFamily: FONT_FAMILY,
      color: '#445566',
      resolution: 2,
    }).setOrigin(1, 1);
  }

  _onResize(gameSize) {
    this.scene.restart();
  }
}
