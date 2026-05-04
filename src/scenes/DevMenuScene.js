import { FONT_FAMILY } from '../utils/FontConfig.js';
/**
 * @module DevMenuScene
 * @description Full-screen dev-mode overlay reached from the in-game menu.
 * Shows runtime toggle options (enemy and player invincibility) that take
 * effect immediately without restarting the game.
 *
 * Pressing BACK or ESC returns to InGameMenuScene.
 *
 * Keyboard navigation: UP/DOWN (or W/S) move focus; ENTER/SPACE activate.
 */

import Phaser from 'phaser';
import { devOptions } from '../systems/DevOptions.js';
import { MenuNavigator } from '../utils/MenuNavigator.js';

/** Text colour applied to the currently keyboard-focused row label. */
const COLOR_FOCUSED = '#ffffff';

/** Height of the fixed header area. */
const HEADER_H = 80;

/**
 * Each toggle row: display label and the devOptions key to flip.
 * @type {{ label: string, key: string }[]}
 */
const TOGGLES = [
  { label: 'Enemies invincible', key: 'enemiesInvincible' },
  { label: 'Player invincible',  key: 'playerInvincible'  },
  { label: 'Free shop',          key: 'freeShop'          },
];

export class DevMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DevMenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    /**
     * Navigation items: one per toggle row plus the BACK button.
     * @type {Array<{labelTxt: Phaser.GameObjects.Text, normalColor: string, onSelect: function}>}
     */
    this._navItems = [];

    this._buildBackground(width, height);
    this._buildTitle(width);
    this._buildToggles(width, height);
    this._buildBackButton(width, height);
    this._setupKeyboardNav();

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
      fontSize: '28px', fontFamily: FONT_FAMILY,
      color: '#ff9999', stroke: '#660000', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
  }

  /**
   * Renders a toggle row for each entry in TOGGLES and registers each for
   * keyboard navigation.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildToggles(width, height) {
    const cx     = width / 2;
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
   * Registers the row with `_navItems` for keyboard navigation.
   *
   * @param {number} cx    - Horizontal centre of the screen.
   * @param {number} y     - Vertical position of this row.
   * @param {string} label
   * @param {string} key   - devOptions boolean key to toggle.
   */
  _addToggleRow(cx, y, label, key) {
    const ROW_W = 320;

    const labelTxt = this.add.text(cx - ROW_W / 2, y, label, {
      fontSize: '20px', fontFamily: FONT_FAMILY,
      color: '#cccccc', stroke: '#000000', strokeThickness: 3, resolution: 2,
    }).setOrigin(0, 0.5);

    const getLabel = () => devOptions[key] ? '[ON] ' : '[OFF]';
    const getColor = () => devOptions[key] ? '#88ff88' : '#ff8888';

    const btn = this.add.text(cx + ROW_W / 2, y, getLabel(), {
      fontSize: '20px', fontFamily: FONT_FAMILY,
      color: getColor(), stroke: '#000000', strokeThickness: 3, resolution: 2,
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    const toggle = () => {
      devOptions[key] = !devOptions[key];
      btn.setText(getLabel());
      btn.setColor(getColor());
    };
    btn.on('pointerdown', toggle);

    this._navItems.push({ labelTxt, normalColor: '#cccccc', onSelect: toggle });
  }

  /**
   * Renders a BACK button pinned to the footer strip and registers it for
   * keyboard navigation.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildBackButton(width, height) {
    const FOOTER_H = 48;
    this.add.rectangle(0, height - FOOTER_H, width, FOOTER_H, 0x080818)
      .setOrigin(0, 0).setDepth(9);

    const btn = this.add.text(width / 2, height - FOOTER_H / 2, 'BACK', {
      fontSize: '20px', fontFamily: FONT_FAMILY,
      color: '#888888', stroke: '#000000', strokeThickness: 3, resolution: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);

    btn.on('pointerover',  () => btn.setColor('#cccccc'));
    btn.on('pointerout',   () => {
      const isFocused = this._nav &&
        this._nav.focusedIndex === this._navItems.length - 1;
      btn.setColor(isFocused ? COLOR_FOCUSED : '#888888');
    });
    btn.on('pointerdown',  () => this._back());

    // Reuse labelTxt field for the back button text so _updateFocus works uniformly.
    this._navItems.push({ labelTxt: btn, normalColor: '#888888', onSelect: () => this._back() });
  }

  /**
   * Wires UP/DOWN/W/S for navigation and ENTER/SPACE for activation.
   * Sets initial focus on the first item.
   */
  _setupKeyboardNav() {
    this._nav = new MenuNavigator(this._navItems.length);
    this._updateFocus();

    this.input.keyboard.on('keydown-UP',    () => { this._nav.prev(); this._updateFocus(); });
    this.input.keyboard.on('keydown-W',     () => { this._nav.prev(); this._updateFocus(); });
    this.input.keyboard.on('keydown-DOWN',  () => { this._nav.next(); this._updateFocus(); });
    this.input.keyboard.on('keydown-S',     () => { this._nav.next(); this._updateFocus(); });
    this.input.keyboard.on('keydown-ENTER', () => this._activateFocused());
    this.input.keyboard.on('keydown-SPACE', () => this._activateFocused());
    this.input.keyboard.on('keydown-ESC',   () => this._back());
  }

  /**
   * Refreshes label colours to reflect the current keyboard focus.
   */
  _updateFocus() {
    this._navItems.forEach(({ labelTxt, normalColor }, i) => {
      labelTxt.setColor(i === this._nav.focusedIndex ? COLOR_FOCUSED : normalColor);
    });
  }

  /**
   * Activates the currently focused item.
   */
  _activateFocused() {
    this._navItems[this._nav.focusedIndex].onSelect();
  }

  /**
   * Returns to InGameMenuScene.
   */
  _back() {
    this.scene.launch('InGameMenuScene');
    this.scene.stop();
  }
}
