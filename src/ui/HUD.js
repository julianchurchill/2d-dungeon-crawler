import { FONT_FAMILY } from '../utils/FontConfig.js';
const BAR_W = 130;
import { FONT_FAMILY } from '../utils/FontConfig.js';
const BAR_H = 16;
import { FONT_FAMILY } from '../utils/FontConfig.js';
const XP_H = 8;
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
// Vertical positions for each element
import { FONT_FAMILY } from '../utils/FontConfig.js';
const HP_Y    = 16;   // HP bar centre
import { FONT_FAMILY } from '../utils/FontConfig.js';
const STATS_Y = 36;   // LVL/ATK/DEF text top
import { FONT_FAMILY } from '../utils/FontConfig.js';
const XP_Y    = 54;   // XP bar centre
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
export class HUD {
import { FONT_FAMILY } from '../utils/FontConfig.js';
  /**
import { FONT_FAMILY } from '../utils/FontConfig.js';
   * @param {Phaser.Scene} scene - UIScene
import { FONT_FAMILY } from '../utils/FontConfig.js';
   */
import { FONT_FAMILY } from '../utils/FontConfig.js';
  constructor(scene) {
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.scene = scene;
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this._build();
import { FONT_FAMILY } from '../utils/FontConfig.js';
  }
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
  _build() {
import { FONT_FAMILY } from '../utils/FontConfig.js';
    const s = this.scene;
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
    // --- HP Bar ---
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.hpBg = s.add.rectangle(10 + BAR_W / 2, HP_Y, BAR_W, BAR_H, 0x330000)
import { FONT_FAMILY } from '../utils/FontConfig.js';
      .setScrollFactor(0).setDepth(100).setOrigin(0.5)
import { FONT_FAMILY } from '../utils/FontConfig.js';
      .setStrokeStyle(1, 0x000000);
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.hpBar = s.add.rectangle(10, HP_Y, BAR_W, BAR_H, 0xcc2222)
import { FONT_FAMILY } from '../utils/FontConfig.js';
      .setScrollFactor(0).setDepth(101).setOrigin(0, 0.5)
import { FONT_FAMILY } from '../utils/FontConfig.js';
      .setStrokeStyle(1, 0xffffff);
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.hpText = s.add.text(10 + BAR_W / 2, HP_Y, 'HP: 30/30', {
import { FONT_FAMILY } from '../utils/FontConfig.js';
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ffffff',
import { FONT_FAMILY } from '../utils/FontConfig.js';
      stroke: '#000000', strokeThickness: 2, resolution: 2,
import { FONT_FAMILY } from '../utils/FontConfig.js';
    }).setScrollFactor(0).setDepth(102).setOrigin(0.5);
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
    // --- Stats row (sits between HP bar and XP bar, no overlap) ---
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.statsText = s.add.text(10, STATS_Y, 'LVL:1  ATK:5  DEF:2', {
import { FONT_FAMILY } from '../utils/FontConfig.js';
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#dddddd',
import { FONT_FAMILY } from '../utils/FontConfig.js';
      stroke: '#000000', strokeThickness: 2, resolution: 2,
import { FONT_FAMILY } from '../utils/FontConfig.js';
    }).setScrollFactor(0).setDepth(100);
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
    // --- Floor indicator (top-right) ---
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.floorText = s.add.text(
import { FONT_FAMILY } from '../utils/FontConfig.js';
      s.scale.width - 10, HP_Y, 'Floor 1', {
import { FONT_FAMILY } from '../utils/FontConfig.js';
        fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ffdd88',
import { FONT_FAMILY } from '../utils/FontConfig.js';
        stroke: '#000000', strokeThickness: 3, resolution: 2,
import { FONT_FAMILY } from '../utils/FontConfig.js';
      }
import { FONT_FAMILY } from '../utils/FontConfig.js';
    ).setScrollFactor(0).setDepth(100).setOrigin(1, 0.5);
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
    // --- XP Bar ---
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.xpBg = s.add.rectangle(10 + BAR_W / 2, XP_Y, BAR_W, XP_H, 0x222244)
import { FONT_FAMILY } from '../utils/FontConfig.js';
      .setScrollFactor(0).setDepth(100).setOrigin(0.5)
import { FONT_FAMILY } from '../utils/FontConfig.js';
      .setStrokeStyle(1, 0x000000);
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.xpBar = s.add.rectangle(10, XP_Y, 0, XP_H, 0x4444cc)
import { FONT_FAMILY } from '../utils/FontConfig.js';
      .setScrollFactor(0).setDepth(101).setOrigin(0, 0.5)
import { FONT_FAMILY } from '../utils/FontConfig.js';
      .setStrokeStyle(1, 0xffffff);
import { FONT_FAMILY } from '../utils/FontConfig.js';
  }
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
  updateHP(hp, maxHp) {
import { FONT_FAMILY } from '../utils/FontConfig.js';
    const ratio = Math.max(0, hp / maxHp);
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.hpBar.setSize(Math.round(BAR_W * ratio), BAR_H);
import { FONT_FAMILY } from '../utils/FontConfig.js';
    // Color shifts red → orange → green based on HP ratio
import { FONT_FAMILY } from '../utils/FontConfig.js';
    const color = ratio > 0.6 ? 0x44cc44 : ratio > 0.3 ? 0xddaa22 : 0xcc2222;
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.hpBar.setFillStyle(color);
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.hpText.setText(`HP: ${hp}/${maxHp}`);
import { FONT_FAMILY } from '../utils/FontConfig.js';
  }
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
  updateStats(stats) {
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.statsText.setText(`LVL:${stats.level}  ATK:${stats.attack}  DEF:${stats.defense}`);
import { FONT_FAMILY } from '../utils/FontConfig.js';
    const xpRatio = stats.xpToNext > 0 ? stats.xp / stats.xpToNext : 0;
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.xpBar.setSize(Math.round(BAR_W * xpRatio), XP_H);
import { FONT_FAMILY } from '../utils/FontConfig.js';
  }
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
  updateFloor(floor) {
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.floorText.setText(`Floor ${floor}`);
import { FONT_FAMILY } from '../utils/FontConfig.js';
  }
import { FONT_FAMILY } from '../utils/FontConfig.js';

import { FONT_FAMILY } from '../utils/FontConfig.js';
  resize(width, height) {
import { FONT_FAMILY } from '../utils/FontConfig.js';
    this.floorText.setPosition(width - 10, HP_Y);
import { FONT_FAMILY } from '../utils/FontConfig.js';
  }
import { FONT_FAMILY } from '../utils/FontConfig.js';
}
