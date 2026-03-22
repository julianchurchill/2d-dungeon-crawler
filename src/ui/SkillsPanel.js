/**
 * @module SkillsPanel
 * @description Phaser UI panel that lists the character's active skills.
 * Opened/closed via the OPEN_SKILLS EventBus event.
 */

import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { isTouchDevice } from '../utils/TouchDeviceDetector.js';

const PANEL_PAD = 20;
const PANEL_W   = 280;
const ROW_H     = 52;
const HEADER_H  = 36;

/**
 * Returns the panel title including keyboard hint on non-touch devices.
 * @param {boolean} isTouchDev
 * @returns {string}
 */
export function getSkillsPanelTitle(isTouchDev) {
  return isTouchDev ? 'SKILLS' : 'SKILLS  [K] close';
}

export class SkillsPanel {
  /**
   * @param {Phaser.Scene} scene - The owning UIScene.
   */
  constructor(scene) {
    this.scene   = scene;
    this.visible = false;
    this._skills = [];
    this._build();

    EventBus.on(GameEvents.OPEN_SKILLS, ({ skills }) => {
      this._skills = skills;
      if (this.visible) {
        this.hide();
      } else {
        this.show();
      }
    });
  }

  /** @private */
  _build() {
    const s = this.scene;
    const { width, height } = s.scale;

    this._container = s.add.container(0, 0)
      .setDepth(300).setScrollFactor(0).setVisible(false);

    // Background — sized dynamically in show() once we know how many skills to display.
    this._bg = s.add.rectangle(0, 0, PANEL_W, 100, 0x111122, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x4466aa);
    this._container.add(this._bg);

    // Title
    this._title = s.add.text(PANEL_W / 2, 10, getSkillsPanelTitle(isTouchDevice()), {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaccff',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0);
    this._container.add(this._title);

    // Close button (touch devices only)
    if (isTouchDevice()) {
      const closeBtn = s.add.text(PANEL_W - PANEL_PAD / 2, 10, '✕', {
        fontSize: '14px', fontFamily: 'monospace', color: '#aaccff',
        stroke: '#000000', strokeThickness: 2, resolution: 2,
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
      closeBtn.on('pointerdown', () => EventBus.emit(GameEvents.TOGGLE_SKILLS));
      this._container.add(closeBtn);
    }

    // Skill rows are created dynamically in show().
    this._rows = [];
  }

  /**
   * Populates and shows the panel with the current skills list.
   */
  show() {
    const s = this.scene;
    const { width, height } = s.scale;

    // Remove old row objects.
    this._rows.forEach(r => r.destroy());
    this._rows = [];

    const panelH = HEADER_H + this._skills.length * ROW_H + PANEL_PAD;
    const panelX = Math.floor((width  - PANEL_W) / 2);
    const panelY = Math.floor((height - panelH)  / 2);

    this._bg.setSize(PANEL_W, panelH);
    this._container.setPosition(panelX, panelY);

    this._skills.forEach((skill, i) => {
      const y = HEADER_H + i * ROW_H;

      const nameTxt = s.add.text(PANEL_PAD, y, skill.name, {
        fontSize: '13px', fontFamily: 'monospace', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2, resolution: 2,
      });
      const descTxt = s.add.text(PANEL_PAD, y + 16, skill.description, {
        fontSize: '11px', fontFamily: 'monospace', color: '#aaaacc',
        stroke: '#000000', strokeThickness: 2, resolution: 2,
      });

      this._container.add([nameTxt, descTxt]);
      this._rows.push(nameTxt, descTxt);
    });

    this._container.setVisible(true);
    this.visible = true;
  }

  /**
   * Hides the skills panel.
   */
  hide() {
    this._container.setVisible(false);
    this.visible = false;
  }
}
