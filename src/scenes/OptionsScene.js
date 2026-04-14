import Phaser from 'phaser';
import { FONT_FAMILY } from '../utils/FontConfig.js';
import { tilesetManager, TILESETS } from '../systems/TilesetManager.js';
import { MenuNavigator } from '../utils/MenuNavigator.js';

/** Text colour applied to the currently keyboard-focused item. */
const COLOR_FOCUSED = '#ffffff';

/**
 * OptionsScene presents player-facing settings.
 * Currently supports switching between the Classic and Modern tilesets.
 * The chosen tileset is persisted to localStorage via TilesetManager.
 *
 * Navigated to from MainMenuScene; ESC / BACK returns there.
 */
export class OptionsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OptionsScene' });
  }

  create() {
    const { width, height } = this.scale;
    /** @type {Array<{onFocus:function, onBlur:function, onSelect:function}>} */
    this._navItems = [];

    this._buildBackground();
    this._buildTitle(width, height);
    this._buildTilesetSection(width, height);
    this._buildBackButton(width, height);
    this._setupKeyboardNav();

    this.scale.on('resize', () => this.scene.restart());
  }

  _buildBackground() {
    this.add.rectangle(0, 0, 2000, 2000, 0x080818).setOrigin(0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a1a3a, 0.4);
    for (let x = 0; x < 2000; x += 32) g.lineBetween(x, 0, x, 2000);
    for (let y = 0; y < 2000; y += 32) g.lineBetween(0, y, 2000, y);
  }

  /**
   * @param {number} width
   * @param {number} height
   */
  _buildTitle(width, height) {
    this.add.text(width / 2, height * 0.14, 'OPTIONS', {
      fontSize: '40px',
      fontFamily: FONT_FAMILY,
      color: '#ffdd88',
      stroke: '#884400',
      strokeThickness: 5,
      resolution: 2,
    }).setOrigin(0.5);
  }

  /**
   * Builds the tileset selector section with tile previews and toggle buttons.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildTilesetSection(width, height) {
    const sectionY = height * 0.30;

    // Section heading
    this.add.text(width / 2, sectionY, 'TILESET', {
      fontSize: '15px',
      fontFamily: FONT_FAMILY,
      color: '#aabbcc',
      resolution: 2,
    }).setOrigin(0.5);

    this.add.text(width / 2, sectionY + 20, 'Choose the visual style for dungeon tiles', {
      fontSize: '11px',
      fontFamily: FONT_FAMILY,
      color: '#556677',
      resolution: 2,
    }).setOrigin(0.5);

    // --- Tileset option cards ---
    const cardW = 160;
    const cardH = 130;
    const gap   = 16;
    const cardY = sectionY + 88;
    const spacing = cardW + gap;
    const leftX   = width / 2 - spacing;
    const centreX = width / 2;
    const rightX  = width / 2 + spacing;

    const active = tilesetManager.getTileset();

    // Classic card
    this._classicCard = this._buildTilesetCard(
      leftX, cardY, cardW, cardH,
      TILESETS.CLASSIC,
      'CLASSIC',
      'Retro dark-stone dungeon\nwith a minimal palette',
      active === TILESETS.CLASSIC,
    );

    // Modern card
    this._modernCard = this._buildTilesetCard(
      centreX, cardY, cardW, cardH,
      TILESETS.MODERN,
      'MODERN',
      'High-contrast slate brick\nwith vivid step colours',
      active === TILESETS.MODERN,
    );

    // HD card
    this._hdCard = this._buildTilesetCard(
      rightX, cardY, cardW, cardH,
      TILESETS.HD,
      'HD',
      '32×32 pixel art with rich\ntexture and fine detail',
      active === TILESETS.HD,
    );

    // Wire keyboard nav items for all three cards
    this._navItems.push(this._classicCard.navItem);
    this._navItems.push(this._modernCard.navItem);
    this._navItems.push(this._hdCard.navItem);
  }

  /**
   * Builds a single tileset option card with a tile preview strip,
   * label, description, and active/hover styling.
   *
   * @param {number} cx       - Card centre X.
   * @param {number} cy       - Card centre Y.
   * @param {number} w        - Card width.
   * @param {number} h        - Card height.
   * @param {string} tileset  - Tileset name ('classic'|'modern').
   * @param {string} label    - Display label.
   * @param {string} desc     - Two-line description.
   * @param {boolean} isActive - Whether this tileset is currently selected.
   * @returns {{ navItem: {onFocus:function, onBlur:function, onSelect:function} }}
   */
  _buildTilesetCard(cx, cy, w, h, tileset, label, desc, isActive) {
    const activeStroke  = 0x88ccff;
    const normalStroke  = 0x336677;
    const activeFill    = 0x1a3a5a;
    const normalFill    = 0x1a2a3a;
    const focusedStroke = 0xffdd88;

    const bg = this.add.rectangle(cx, cy, w, h, isActive ? activeFill : normalFill)
      .setStrokeStyle(isActive ? 2 : 1, isActive ? activeStroke : normalStroke)
      .setInteractive({ useHandCursor: true });

    // Preview strips — two rows: tiles on top, entities + items below
    const tileSize = 16;
    const tilePreviews = [
      `${tileset}_tile_floor`,
      `${tileset}_tile_wall`,
      `${tileset}_tile_door`,
      `${tileset}_tile_stairs`,
    ];
    const entityPreviews = [
      `${tileset}_entity_player`,
      `${tileset}_entity_goblin`,
      `${tileset}_entity_orc`,
      `${tileset}_item_weapon`,
    ];

    const rowY1 = cy - h / 2 + tileSize / 2 + 8;
    const rowY2 = rowY1 + tileSize + 2;

    for (const [row, keys] of [[rowY1, tilePreviews], [rowY2, entityPreviews]]) {
      const totalW = keys.length * tileSize;
      const startX = cx - totalW / 2;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (this.textures.exists(key)) {
          this.add.image(startX + i * tileSize + tileSize / 2, row, key)
            .setDisplaySize(tileSize, tileSize);
        }
      }
    }

    // Active badge
    const badgeY = cy - h / 2 + tileSize + 20;
    const badgeTxt = this.add.text(cx, badgeY, isActive ? '✓ ACTIVE' : '', {
      fontSize: '10px',
      fontFamily: FONT_FAMILY,
      color: '#88ccff',
      resolution: 2,
    }).setOrigin(0.5);

    // Label
    this.add.text(cx, badgeY + 18, label, {
      fontSize: '16px',
      fontFamily: FONT_FAMILY,
      color: isActive ? '#ffdd88' : '#aabbcc',
      resolution: 2,
    }).setOrigin(0.5);

    // Description
    this.add.text(cx, badgeY + 40, desc, {
      fontSize: '10px',
      fontFamily: FONT_FAMILY,
      color: '#667788',
      align: 'center',
      resolution: 2,
    }).setOrigin(0.5);

    const select = () => {
      tilesetManager.setTileset(tileset);
      // Restart the scene to reflect the new selection
      this.scene.restart();
    };

    bg.on('pointerover', () => bg.setFillStyle(0x243a5a));
    bg.on('pointerout',  () => bg.setFillStyle(isActive ? activeFill : normalFill));
    bg.on('pointerdown', select);

    const navItem = {
      onFocus:  () => bg.setStrokeStyle(2, focusedStroke),
      onBlur:   () => bg.setStrokeStyle(isActive ? 2 : 1, isActive ? activeStroke : normalStroke),
      onSelect: select,
    };

    return { navItem };
  }

  /**
   * Adds the Back button at the bottom of the screen.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildBackButton(width, height) {
    const btnY = height * 0.82;

    const backBg = this.add.rectangle(width / 2, btnY, 160, 34, 0x1a2a3a)
      .setStrokeStyle(1, 0x336677)
      .setInteractive({ useHandCursor: true });

    const backTxt = this.add.text(width / 2, btnY, '◀  BACK', {
      fontSize: '12px',
      fontFamily: FONT_FAMILY,
      color: '#6699aa',
      resolution: 2,
    }).setOrigin(0.5);

    const goBack = () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(200, () => this.scene.start('MainMenuScene'));
    };

    backBg.on('pointerover', () => { backBg.setFillStyle(0x223344); backTxt.setColor('#ffdd88'); });
    backBg.on('pointerout',  () => {
      backBg.setFillStyle(0x1a2a3a);
      const isFocused = this._nav && this._nav.focusedIndex === this._navItems.length;
      backTxt.setColor(isFocused ? COLOR_FOCUSED : '#6699aa');
    });
    backBg.on('pointerdown', goBack);

    this._navItems.push({
      onFocus:  () => { backBg.setFillStyle(0x223344); backTxt.setColor(COLOR_FOCUSED); },
      onBlur:   () => { backBg.setFillStyle(0x1a2a3a); backTxt.setColor('#6699aa'); },
      onSelect: goBack,
    });
  }

  /**
   * Wires keyboard navigation: UP/DOWN to cycle items, ENTER/SPACE to select,
   * ESC to go back immediately.
   */
  _setupKeyboardNav() {
    this._nav = new MenuNavigator(this._navItems.length);
    this._updateFocus();

    this.input.keyboard.on('keydown-UP',    () => { this._nav.prev(); this._updateFocus(); });
    this.input.keyboard.on('keydown-W',     () => { this._nav.prev(); this._updateFocus(); });
    this.input.keyboard.on('keydown-DOWN',  () => { this._nav.next(); this._updateFocus(); });
    this.input.keyboard.on('keydown-S',     () => { this._nav.next(); this._updateFocus(); });
    this.input.keyboard.on('keydown-LEFT',  () => { this._nav.prev(); this._updateFocus(); });
    this.input.keyboard.on('keydown-A',     () => { this._nav.prev(); this._updateFocus(); });
    this.input.keyboard.on('keydown-RIGHT', () => { this._nav.next(); this._updateFocus(); });
    this.input.keyboard.on('keydown-D',     () => { this._nav.next(); this._updateFocus(); });
    this.input.keyboard.on('keydown-ENTER', () => this._activateFocused());
    this.input.keyboard.on('keydown-SPACE', () => this._activateFocused());
    this.input.keyboard.on('keydown-ESC',   () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(200, () => this.scene.start('MainMenuScene'));
    });
  }

  /** Refreshes the visual focus state of every nav item. */
  _updateFocus() {
    this._navItems.forEach(({ onFocus, onBlur }, i) => {
      if (i === this._nav.focusedIndex) { onFocus(); } else { onBlur(); }
    });
  }

  /** Activates the currently focused menu item. */
  _activateFocused() {
    this._navItems[this._nav.focusedIndex].onSelect();
  }
}
