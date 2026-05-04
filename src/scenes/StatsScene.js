import { FONT_FAMILY } from '../utils/FontConfig.js';
/**
 * @module StatsScene
 * @description Displays per-run statistics (deepest floor, kills, consumables,
 * gold) read from the Phaser shared registry key `runStats`.
 *
 * Opened from InGameMenuScene (ESC → STATS); the Back button returns to
 * InGameMenuScene, which wakes the sleeping GameScene and UIScene.
 */

import Phaser from 'phaser';
import { resolveSceneBack } from '../systems/SceneNavigation.js';
import { formatRunStats } from '../ui/RunStatsFormatter.js';

/** Height of the fixed title strip at the top. */
const HEADER_H = 72;

/** Height of the fixed back-button strip at the bottom. */
const FOOTER_H = 52;

/** Vertical padding below the last row. */
const PAD = 16;

/** Standard row height. */
const ROW_H = 24;

/** Height of a section heading row. */
const SECTION_H = 30;

export class StatsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StatsScene' });
  }

  /**
   * @param {{ fromScene?: string }} [data]
   */
  init(data) {
    this._fromScene = data?.fromScene ?? 'MainMenuScene';
  }

  create() {
    const { width, height } = this.scale;
    this._buildBackground(width, height);
    this._buildTitle(width);
    this._buildContent(width, height);
    this._buildBackButton(width, height);

    this.input.keyboard.on('keydown-ESC', () => this._back());
    this._initScrollListeners();
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
    this.add.rectangle(0, 0, 2000, 2000, 0x080818).setOrigin(0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a1a3a, 0.4);
    for (let x = 0; x < 2000; x += 32) g.lineBetween(x, 0, x, 2000);
    for (let y = 0; y < 2000; y += 32) g.lineBetween(0, y, 2000, y);
  }

  /**
   * Fixed "RUN STATS" heading with a dark backing strip.
   *
   * @param {number} width
   */
  _buildTitle(width) {
    this.add.rectangle(0, 0, width, HEADER_H, 0x080818)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9);
    this.add.text(width / 2, 28, 'RUN STATS', {
      fontSize: '28px', fontFamily: FONT_FAMILY,
      color: '#ffdd88', stroke: '#884400', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
  }

  /**
   * Builds the scrollable content container with three labelled sections:
   * Summary, Kills, and Consumables Used.
   *
   * @param {number} width
   * @param {number} _height - Reserved; unused but kept for signature parity with other scenes.
   */
  _buildContent(width, _height) {
    const rawStats = this.registry.get('runStats') ?? {
      deepestFloor: 1, wallsBroken: 0, goldGained: 0, goldSpent: 0,
      kills: {}, consumablesUsed: {},
    };
    const { summary, kills, consumablesUsed } = formatRunStats(rawStats);

    this._scrollOffset = 0;
    this._listContainer = this.add.container(0, 0);

    let y = HEADER_H + PAD;
    const cx = Math.floor(width / 2);

    const addSectionHeading = (title) => {
      const txt = this.add.text(PAD, y, title, {
        fontSize: '14px', fontFamily: FONT_FAMILY,
        color: '#ffdd88', stroke: '#000000', strokeThickness: 2, resolution: 2,
      });
      this._listContainer.add(txt);
      y += SECTION_H;
    };

    const addRow = (label, value) => {
      const labelTxt = this.add.text(PAD + 12, y, label, {
        fontSize: '11px', fontFamily: FONT_FAMILY,
        color: '#cccccc', resolution: 2,
      });
      if (value !== '') {
        const valueTxt = this.add.text(cx, y, String(value), {
          fontSize: '11px', fontFamily: FONT_FAMILY,
          color: '#88aaff', resolution: 2,
        });
        this._listContainer.add(valueTxt);
      }
      this._listContainer.add(labelTxt);
      y += ROW_H;
    };

    addSectionHeading('Summary');
    summary.forEach(r => addRow(r.label, r.value));

    y += 8;
    addSectionHeading('Kills');
    kills.forEach(r => addRow(r.label, r.value));

    y += 8;
    addSectionHeading('Consumables Used');
    consumablesUsed.forEach(r => addRow(r.label, r.value));

    this._contentHeight = y + PAD;
  }

  /**
   * Fixed BACK button pinned to the bottom of the viewport.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildBackButton(width, height) {
    this.add.rectangle(0, height - FOOTER_H, width, FOOTER_H, 0x080818)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9);
    const btn = this.add.text(width / 2, height - FOOTER_H / 2, 'BACK', {
      fontSize: '18px', fontFamily: FONT_FAMILY,
      color: '#888888', stroke: '#000000', strokeThickness: 3, resolution: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerover',  () => btn.setColor('#ffffff'));
    btn.on('pointerout',   () => btn.setColor('#888888'));
    btn.on('pointerdown',  () => this._back());
  }

  /**
   * DOM-level wheel and arrow-key listeners for scrolling, removed on shutdown.
   */
  _initScrollListeners() {
    const onWheel = (e) => {
      e.preventDefault();
      this._scrollContent(e.deltaY > 0 ? 30 : -30);
    };
    const onKey = (e) => {
      if (e.key === 'ArrowUp')   this._scrollContent(-30);
      if (e.key === 'ArrowDown') this._scrollContent(30);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    this.events.once('shutdown', () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    });
  }

  /**
   * Scrolls the content container, clamped within the scrollable range.
   *
   * @param {number} delta - Positive scrolls down, negative up.
   */
  _scrollContent(delta) {
    const { height } = this.scale;
    const maxScroll = Math.max(0, this._contentHeight - height + FOOTER_H);
    this._scrollOffset = Phaser.Math.Clamp(this._scrollOffset + delta, 0, maxScroll);
    this._listContainer.y = -this._scrollOffset;
  }

  /**
   * Returns to the calling scene (InGameMenuScene or fallback).
   */
  _back() {
    const nav = resolveSceneBack(this._fromScene);
    if (nav.action === 'wake') {
      this.scene.wake('GameScene');
      this.scene.wake('UIScene');
    } else if (nav.action === 'launch') {
      this.scene.launch(nav.scene);
    } else {
      this.scene.start(nav.scene);
    }
    this.scene.stop();
  }
}
