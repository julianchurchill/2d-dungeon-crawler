/**
 * @module LookPanel
 * @description Displays information about a map cell the player has clicked or
 * touched.  Shows enemy name and HP, item name and description, or a tile
 * label depending on what occupies the cell.  Positioned in the bottom-right
 * corner of the screen (above mobile controls when present).  Does not advance
 * the game turn.
 */
import { FONT_FAMILY } from '../utils/FontConfig.js';
import { getTileLabel } from '../utils/TileLabelMap.js';

const PANEL_W  = 200;
const PANEL_H  = 58;
const PAD      = 8;
const MARGIN   = 8;

export class LookPanel {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene   = scene;
    this.visible = false;
    this._nameText   = null;
    this._detailText = null;
    this._container  = null;
    this._build();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Shows info for an enemy.
   * @param {{ name: string, stats: { hp: number, maxHp: number } }} enemy
   */
  showEnemy(enemy) {
    this._nameText.setText(enemy.name);
    this._detailText.setText(`${enemy.stats.hp} / ${enemy.stats.maxHp} HP`);
    this._show();
  }

  /**
   * Shows info for a floor item.
   * @param {{ name: string, description: string }} item
   */
  showItem(item) {
    this._nameText.setText(item.name);
    this._detailText.setText(item.description);
    this._show();
  }

  /**
   * Shows the label for a map tile or a plain string label (e.g. an NPC name).
   * @param {number|string} tileTypeOrLabel - A TILE constant or a display string.
   */
  showTile(tileTypeOrLabel) {
    const label = typeof tileTypeOrLabel === 'string'
      ? tileTypeOrLabel
      : getTileLabel(tileTypeOrLabel);
    this._nameText.setText(label);
    this._detailText.setText('');
    this._show();
  }

  /** Hides the panel. */
  hide() {
    this.visible = false;
    this._container.setVisible(false);
  }

  /**
   * Repositions the panel after a viewport resize.
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    this._setPosition(width, height);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  /** Constructs all Phaser display objects. */
  _build() {
    const s = this.scene;

    this._container = s.add.container(0, 0)
      .setDepth(250)
      .setScrollFactor(0)
      .setVisible(false);

    const bg = s.add.rectangle(0, 0, PANEL_W, PANEL_H, 0x0a0a1a, 0.92)
      .setStrokeStyle(1, 0x4466aa)
      .setOrigin(0, 0);

    this._nameText = s.add.text(PAD, PAD, '', {
      fontSize: '12px',
      fontFamily: FONT_FAMILY,
      color: '#ffdd88',
      resolution: 2,
    }).setOrigin(0, 0);

    this._detailText = s.add.text(PAD, PAD + 22, '', {
      fontSize: '10px',
      fontFamily: FONT_FAMILY,
      color: '#aabbcc',
      resolution: 2,
    }).setOrigin(0, 0);

    this._container.add([bg, this._nameText, this._detailText]);

    const { width, height } = s.scale;
    this._setPosition(width, height);
  }

  /** Positions the panel in the bottom-right corner. */
  _setPosition(width, height) {
    const zoom = this.scene.cameras?.main?.zoom ?? 1;
    this._container
      .setScale(1 / zoom)
      .setPosition(
        (width  - PANEL_W - MARGIN) / zoom,
        (height - PANEL_H - MARGIN) / zoom,
      );
  }

  /** Makes the panel visible and updates the `visible` flag. */
  _show() {
    this.visible = true;
    this._container.setVisible(true);
  }
}
