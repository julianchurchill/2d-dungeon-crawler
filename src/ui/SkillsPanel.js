/**
 * @module SkillsPanel
 * @description Phaser UI panel that lists the character's active skills.
 * Opened/closed via the OPEN_SKILLS EventBus event.  In dev mode each skill
 * row shows a green ⬆ upgrade button and a red ⬇ downgrade button on the
 * right-hand side; both are greyed out and non-interactive at their respective
 * caps.  Description text wraps within the available text area width.
 */

import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { isTouchDevice } from '../utils/TouchDeviceDetector.js';

const PANEL_PAD  = 16;
/** Total panel width.  Wide enough for wrapped description text plus dev buttons. */
const PANEL_W    = 340;
/** Height reserved for each skill row.  Tall enough for a 2-line description. */
const ROW_H      = 72;
const HEADER_H   = 36;
/** Width of the dev-mode button column on the right side of each row. */
const BTN_COL_W  = 48;

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
    this.scene      = scene;
    this.visible    = false;
    this._skills    = [];
    this._isDevMode = false;
    this._build();

    EventBus.on(GameEvents.OPEN_SKILLS, ({ skills, isDevMode = false, forceRefresh = false }) => {
      this._skills    = skills;
      this._isDevMode = isDevMode;
      if (forceRefresh || !this.visible) {
        // Refresh (skill upgraded/downgraded) or first open: render/re-render the panel.
        this.show();
      } else {
        // User toggled the panel closed.
        this.hide();
      }
    });
  }

  /** @private */
  _build() {
    const s = this.scene;

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

    // Text area is narrower in dev mode to leave room for the button column.
    const textW = this._isDevMode
      ? PANEL_W - 2 * PANEL_PAD - BTN_COL_W
      : PANEL_W - 2 * PANEL_PAD;

    this._skills.forEach((skill, i) => {
      const y = HEADER_H + i * ROW_H;

      const nameTxt = s.add.text(PANEL_PAD, y + 6, skill.name, {
        fontSize: '13px', fontFamily: 'monospace', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2, resolution: 2,
        wordWrap: { width: textW },
      });
      const descTxt = s.add.text(PANEL_PAD, y + 24, skill.description, {
        fontSize: '11px', fontFamily: 'monospace', color: '#aaaacc',
        stroke: '#000000', strokeThickness: 2, resolution: 2,
        wordWrap: { width: textW },
      });

      this._container.add([nameTxt, descTxt]);
      this._rows.push(nameTxt, descTxt);

      // In dev mode, show upgrade and downgrade buttons for each skill.
      if (this._isDevMode) {
        this._addDevButtons(skill, y);
      }
    });

    this._container.setVisible(true);
    this.visible = true;
  }

  /**
   * Adds a green ⬆ upgrade button and a red ⬇ downgrade button for the given
   * skill row.  Each button is greyed out and non-interactive at its limit.
   *
   * @param {object} skill - Skill object with `canUpgrade` and `canDowngrade` flags.
   * @param {number} y     - Y offset within the panel container for this row.
   * @private
   */
  _addDevButtons(skill, y) {
    const s = this.scene;
    const btnX = PANEL_W - PANEL_PAD;

    // ⬆ Upgrade button — top half of the row.
    const upColor = skill.canUpgrade ? '#88ff88' : '#444444';
    const upBtn = s.add.text(btnX, y + 14, '⬆', {
      fontSize: '18px', fontFamily: 'monospace', color: upColor,
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(1, 0.5);
    if (skill.canUpgrade) {
      upBtn.setInteractive({ useHandCursor: true });
      upBtn.on('pointerdown', () => EventBus.emit(GameEvents.UPGRADE_SKILL, { skillId: skill.id }));
    }

    // ⬇ Downgrade button — bottom half of the row.
    const downColor = skill.canDowngrade ? '#ff8888' : '#444444';
    const downBtn = s.add.text(btnX, y + 46, '⬇', {
      fontSize: '18px', fontFamily: 'monospace', color: downColor,
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(1, 0.5);
    if (skill.canDowngrade) {
      downBtn.setInteractive({ useHandCursor: true });
      downBtn.on('pointerdown', () => EventBus.emit(GameEvents.DOWNGRADE_SKILL, { skillId: skill.id }));
    }

    this._container.add([upBtn, downBtn]);
    this._rows.push(upBtn, downBtn);
  }

  /**
   * Hides the skills panel.
   */
  hide() {
    this._container.setVisible(false);
    this.visible = false;
  }
}
