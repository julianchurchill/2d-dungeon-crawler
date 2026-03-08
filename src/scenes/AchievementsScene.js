/**
 * @module AchievementsScene
 * @description A Phaser scene that displays all achievements with their
 * current progress and completion state.
 *
 * Can be reached from two places:
 *  - The main menu ("Achievements" button) — `fromScene: 'MainMenuScene'`
 *  - During a game (ESCAPE key) — `fromScene: 'GameScene'`, with the
 *    GameScene and UIScene paused while the screen is shown.
 *
 * The "BACK" button (or ESC key) returns the player to wherever they came from.
 *
 * Depends on:
 *  - `AchievementSystem` for the formatted display list.
 *  - `achievementStore` (singleton) for live progress data.
 */

import Phaser from 'phaser';
import { ACHIEVEMENTS } from '../achievements/AchievementDefinitions.js';
import { AchievementSystem } from '../achievements/AchievementSystem.js';
import {
  achievementStore,
  completeAchievement,
  uncompleteAchievement,
} from '../achievements/AchievementStore.js';
import { EventBus } from '../utils/EventBus.js';
import { isDevEnvironment } from '../utils/Environment.js';

/** Rows are this tall in pixels. */
const ROW_H = 28;

/** Vertical padding below the last row. */
const PAD = 16;

/** Height reserved for the fixed title area at the top. */
const HEADER_H = 72;

/** Height of the fixed back-button strip at the bottom. */
const FOOTER_H = 52;

export class AchievementsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AchievementsScene' });
  }

  /**
   * @param {{ fromScene?: string }} [data] - Optional launch data.
   *   `fromScene` is the scene key to return to when the player presses Back.
   */
  init(data) {
    this._fromScene = data?.fromScene ?? 'MainMenuScene';
  }

  create() {
    const { width, height } = this.scale;
    this._buildBackground(width, height);
    this._buildTitle(width);
    this._buildList(width, height);
    this._buildBackButton(width, height);

    // ESC key closes the screen.  Uses Phaser keyboard (consistent with other scenes).
    this.input.keyboard.on('keydown-ESC', () => this._back());

    // Wheel and arrow-key scrolling use DOM listeners so they fire reliably when
    // this scene is launched as an overlay (Phaser's scene input routing may not
    // dispatch these events to a scene launched over sleeping scenes).
    this._initScrollListeners();

    this.scale.on('resize', () => this.scene.restart());
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Attaches DOM-level wheel and arrow-key listeners for scrolling.
   * DOM listeners are used instead of Phaser's InputPlugin because Phaser may
   * not dispatch wheel/key events to a scene that was launched as an overlay
   * on top of sleeping scenes.
   * Listeners are removed when the scene shuts down.
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
    // Clean up when the scene is stopped so listeners don't linger.
    this.events.once('shutdown', () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    });
  }

  /**
   * Fills the background with a dark gradient.
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
   * Renders the "ACHIEVEMENTS" heading with a solid backing strip so that
   * list items which scroll past the top are hidden behind it.
   *
   * @param {number} width
   */
  _buildTitle(width) {
    // Dark backing strip — same height as HEADER_H — clips content that
    // scrolls above the header.
    this.add.rectangle(0, 0, width, HEADER_H, 0x080818)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9);

    this.add.text(width / 2, 28, 'ACHIEVEMENTS', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#ffdd88',
      stroke: '#884400',
      strokeThickness: 4,
      resolution: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
  }

  /**
   * Builds the scrollable list of achievement rows.
   * Completed achievements are shown first in gold; incomplete ones follow
   * in grey with their progress counters.
   *
   * @param {number} width
   * @param {number} height
   */
  /**
   * Builds the scrollable list of achievement rows inside a Container so that
   * scrolling is performed by moving the container's y position, completely
   * independent of the Phaser camera.
   * Completed achievements are shown first in gold; incomplete ones follow
   * in grey with their progress counters.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildList(width, height) {
    // Build display list using an AchievementSystem wired to the live store.
    const system  = new AchievementSystem(ACHIEVEMENTS, achievementStore, EventBus);
    const entries = system.getDisplayList();

    // Sort: completed first, then incomplete.
    const sorted = [
      ...entries.filter(e => e.completed),
      ...entries.filter(e => !e.completed),
    ];

    const startY = HEADER_H + 4;
    this._contentHeight = startY + sorted.length * ROW_H + PAD;
    this._scrollOffset  = 0;

    // All rows live in a single Container so moving container.y scrolls them
    // as a unit without touching the camera.
    this._listContainer = this.add.container(0, 0);

    const devMode = isDevEnvironment();

    sorted.forEach((entry, i) => {
      const y = startY + i * ROW_H;
      const prefix = entry.completed ? '✓ ' : '  ';
      const color  = entry.completed ? '#ffdd88' : '#888888';
      const txt = this.add.text(PAD + 16, y, `${prefix}${entry.text}`, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color,
        resolution: 2,
      }).setOrigin(0, 0);
      this._listContainer.add(txt);

      // Dev-mode checkbox: allows force-completing or resetting any achievement.
      // Hidden in production builds so players cannot see or use it.
      if (devMode) {
        this._addDevCheckbox(entry, y);
      }
    });
  }

  /**
   * Renders a "BACK" button pinned to the bottom of the viewport.
   *
   * @param {number} width
   * @param {number} height
   */
  _buildBackButton(width, height) {
    const btnY = height - 36;

    // Semi-transparent background strip so the button is readable over rows.
    this.add.rectangle(0, btnY - 16, width, 52, 0x080818, 0.9)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9);

    const bg = this.add.rectangle(width / 2, btnY, 160, 30, 0x1a2a3a)
      .setStrokeStyle(1, 0x336677)
      .setScrollFactor(0).setDepth(10)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(width / 2, btnY, '← BACK', {
      fontSize: '13px', fontFamily: 'monospace', color: '#6699aa', resolution: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    bg.on('pointerover',  () => { bg.setFillStyle(0x223344); txt.setColor('#88ccff'); });
    bg.on('pointerout',   () => { bg.setFillStyle(0x1a2a3a); txt.setColor('#6699aa'); });
    bg.on('pointerdown',  () => this._back());
  }

  /**
   * Scrolls the list by moving the container's y position, clamped so the
   * player cannot scroll past the first or last row.  Adding FOOTER_H to
   * maxScroll ensures the last row can be scrolled fully above the back-button
   * strip even on shorter viewports.
   *
   * @param {number} delta - Positive scrolls down, negative scrolls up.
   */
  _scrollContent(delta) {
    const { height } = this.scale;
    const maxScroll = Math.max(0, this._contentHeight - height + FOOTER_H);
    this._scrollOffset = Phaser.Math.Clamp(this._scrollOffset + delta, 0, maxScroll);
    this._listContainer.y = -this._scrollOffset;
  }

  /**
   * Returns to the scene this screen was opened from.
   * If the caller was GameScene, both the game and UI scenes are woken (they
   * were put to sleep when the overlay opened).  wake() is the counterpart to
   * sleep() — it resumes both update and rendering.
   */
  _back() {
    if (this._fromScene === 'GameScene') {
      this.scene.wake('GameScene');
      this.scene.wake('UIScene');
    } else {
      this.scene.start(this._fromScene);
    }
    // Stop self last so scene manager calls above can still execute.
    this.scene.stop();
  }

  /**
   * Adds a dev-mode-only interactive checkbox at the left edge of an
   * achievement row.  Clicking `[ ]` force-completes the achievement;
   * clicking `[x]` resets it to incomplete.  The scene restarts after each
   * toggle so the sorted list and progress text refresh immediately.
   *
   * Only called when `isDevEnvironment()` returns true — never shown in
   * production builds.
   *
   * @param {{ id: string, completed: boolean }} entry - Display list entry.
   * @param {number} y - Vertical position of the row within the container.
   */
  _addDevCheckbox(entry, y) {
    const label     = entry.completed ? '[x]' : '[ ]';
    const baseColor = entry.completed ? '#ffdd88' : '#556677';

    const cb = this.add.text(4, y, label, {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: baseColor,
      resolution: 2,
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true });

    cb.on('pointerover', () => cb.setColor('#88aaff'));
    cb.on('pointerout',  () => cb.setColor(baseColor));
    cb.on('pointerdown', () => {
      if (entry.completed) {
        uncompleteAchievement(entry.id, achievementStore);
      } else {
        completeAchievement(entry.id, achievementStore);
      }
      // Restart the scene so the list re-sorts and text refreshes.
      this.scene.restart();
    });

    this._listContainer.add(cb);
  }
}
