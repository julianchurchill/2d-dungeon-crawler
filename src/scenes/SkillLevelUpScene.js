/**
 * @module SkillLevelUpScene
 * @description A Phaser scene shown when the player levels up, allowing them to
 * either activate a new skill from the inactive pool or upgrade an existing active skill.
 *
 * Launched by GameScene when `leveled` is true after `gainXP`.  Receives a
 * `skillSystem` reference via Phaser scene init data.  GameScene and UIScene are
 * sleeping while this scene is active.
 *
 * If there are no choices available (nothing to activate or upgrade), the scene
 * wakes the sleeping scenes and stops itself immediately.
 *
 * ESC is ignored when choices exist — the player must make a selection.
 */

import Phaser from 'phaser';

/** Height of the fixed header area. */
const HEADER_H = 80;
/** Width of each choice button row. */
const ROW_W = 360;
/** Height of each choice button row. */
const ROW_H = 72;
/** Padding around text inside a row. */
const ROW_PAD = 12;

export class SkillLevelUpScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SkillLevelUpScene' });
  }

  /**
   * Receives initialisation data from GameScene.
   * @param {{ skillSystem: object }} data
   */
  init(data) {
    /** @type {object} The player's SkillSystem instance. */
    this._skillSystem = data.skillSystem;
  }

  create() {
    const { width, height } = this.scale;

    // Collect available choices before rendering.
    this._choices = this._buildChoices();

    // If no choices, skip the scene immediately.
    if (this._choices.length === 0) {
      this._finish();
      return;
    }

    this._buildBackground(width, height);
    this._buildTitle(width);
    this._buildChoiceButtons(width, height);

    // ESC is a no-op when choices exist — the player must choose.
    this.input.keyboard.on('keydown-ESC', () => {
      if (this._choices.length === 0) this._finish();
    });

    this.scale.on('resize', () => this.scene.restart());
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Builds the list of skill choices available to the player.
   * Each choice has: { type: 'activate'|'upgrade', skillId, label, description }
   * @returns {Array<object>}
   */
  _buildChoices() {
    const choices = [];

    // Inactive skills can be activated.
    const inactive = this._skillSystem.getInactiveSkills();
    for (const skill of inactive) {
      choices.push({
        type:        'activate',
        skillId:     skill.id,
        label:       `ACTIVATE  ${skill.name}`,
        description: skill.description,
      });
    }

    // Active skills that can be upgraded.
    const active = this._skillSystem.getSkills();
    for (const skill of active) {
      if (skill.canUpgrade) {
        choices.push({
          type:        'upgrade',
          skillId:     skill.id,
          label:       `UPGRADE  ${skill.name}`,
          description: skill.description,
        });
      }
    }

    return choices;
  }

  /**
   * Dark full-screen background with subtle grid lines, matching other overlay scenes.
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
   * Renders the "SKILL UPGRADE" heading with a dark backing strip.
   *
   * @param {number} width
   */
  _buildTitle(width) {
    this.add.rectangle(0, 0, width, HEADER_H, 0x080818)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9);

    this.add.text(width / 2, 28, 'SKILL UPGRADE', {
      fontSize: '28px', fontFamily: 'monospace',
      color: '#ffdd88', stroke: '#884400', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);

    this.add.text(width / 2, HEADER_H - 18, 'Choose a skill to activate or upgrade:', {
      fontSize: '14px', fontFamily: 'monospace',
      color: '#aaaacc', stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
  }

  /**
   * Renders a row button for each available skill choice.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildChoiceButtons(width, height) {
    const cx     = width / 2;
    const totalH = this._choices.length * (ROW_H + 12);
    let   y      = HEADER_H + (height - HEADER_H) / 2 - totalH / 2;

    for (const choice of this._choices) {
      this._addChoiceButton(cx, y, choice);
      y += ROW_H + 12;
    }
  }

  /**
   * Renders a single choice button row containing the skill label and description.
   *
   * @param {number} cx     - Horizontal centre of the screen.
   * @param {number} y      - Vertical position of this row.
   * @param {object} choice - The choice descriptor built by `_buildChoices`.
   */
  _addChoiceButton(cx, y, choice) {
    const isActivate = choice.type === 'activate';
    const borderColor = isActivate ? 0x44aa44 : 0x4466aa;
    const labelColor  = isActivate ? '#88ff88' : '#aaccff';

    // Row background
    const bg = this.add.rectangle(cx, y + ROW_H / 2, ROW_W, ROW_H, 0x111122)
      .setStrokeStyle(2, borderColor)
      .setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => bg.setFillStyle(0x222244));
    bg.on('pointerout',  () => bg.setFillStyle(0x111122));
    bg.on('pointerdown', () => this._selectChoice(choice));

    // Label
    this.add.text(cx, y + ROW_PAD + 8, choice.label, {
      fontSize: '16px', fontFamily: 'monospace',
      color: labelColor, stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0);

    // Description
    this.add.text(cx, y + ROW_PAD + 30, choice.description, {
      fontSize: '11px', fontFamily: 'monospace',
      color: '#888899', stroke: '#000000', strokeThickness: 2, resolution: 2,
      wordWrap: { width: ROW_W - ROW_PAD * 2 },
    }).setOrigin(0.5, 0);
  }

  /**
   * Applies the chosen skill action and then wakes the sleeping game scenes.
   *
   * @param {object} choice - The selected choice descriptor.
   */
  _selectChoice(choice) {
    if (choice.type === 'activate') {
      this._skillSystem.activateSkill(choice.skillId);
    } else {
      this._skillSystem.upgradeSkill(choice.skillId);
    }
    this._finish();
  }

  /**
   * Wakes GameScene and UIScene, then stops this overlay.
   */
  _finish() {
    this.scene.wake('GameScene');
    this.scene.wake('UIScene');
    this.scene.stop();
  }
}
