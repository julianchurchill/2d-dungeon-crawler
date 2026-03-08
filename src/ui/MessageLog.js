/**
 * @module MessageLog
 * @description Renders the in-game message log in the bottom-left corner of
 * the UIScene.  In its compact form it shows the four most recent messages.
 * Pressing M (wired in UIScene) toggles an expanded history panel that shows
 * up to 15 lines and can be scrolled with the mouse wheel to reveal older
 * entries.
 *
 * Depends on MessageHistory for all data storage and windowing logic.
 */

import { MessageHistory } from './MessageHistory.js';

/** Number of lines visible in the compact (always-on) log strip. */
const COMPACT_LINES = 4;

/** Number of lines visible in the expanded history panel. */
const EXPANDED_LINES = 15;

/** Pixel height of each text row. */
const LINE_H = 18;

/** Left padding for log text. */
const PAD_X = 8;

export class MessageLog {
  /**
   * @param {Phaser.Scene} scene - The UIScene that owns this widget.
   */
  constructor(scene) {
    /** @type {Phaser.Scene} */
    this.scene = scene;

    /** @type {MessageHistory} Full message history data store. */
    this._history = new MessageHistory();

    /** @type {boolean} Whether the expanded history panel is visible. */
    this._expanded = false;

    /** @type {number} Scroll position in the history panel (0 = newest). */
    this._scrollOffset = 0;

    /** @type {Phaser.GameObjects.Text[]} Compact log text objects. */
    this._compactTexts = [];

    /** @type {Phaser.GameObjects.Rectangle|null} Expanded panel background. */
    this._panelBg = null;

    /** @type {Phaser.GameObjects.Text[]} Expanded panel text objects. */
    this._panelTexts = [];

    /** @type {Phaser.GameObjects.Text|null} Scroll-hint label. */
    this._scrollHint = null;

    this._buildCompact();
    this._buildExpandedPanel();
    this._setExpandedVisible(false);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Adds a message to the history and refreshes the compact view.
   * When the history panel is open it is also refreshed.
   *
   * @param {string} text
   */
  addMessage(text) {
    this._history.add(text);
    this._refreshCompact();
    if (this._expanded) this._refreshPanel();
  }

  /**
   * Toggles the expanded history panel on or off.
   * Resets the scroll position to the newest message whenever it opens.
   */
  toggleExpanded() {
    this._expanded = !this._expanded;
    if (this._expanded) {
      this._scrollOffset = 0;
      this._refreshPanel();
    }
    this._setExpandedVisible(this._expanded);
  }

  /**
   * Scrolls the history panel by `delta` lines.
   * Positive delta scrolls toward older messages; negative toward newer.
   * Only has an effect when the panel is open.
   *
   * @param {number} delta
   */
  scrollHistory(delta) {
    if (!this._expanded) return;
    const maxOffset = Math.max(0, this._history.getCount() - EXPANDED_LINES);
    this._scrollOffset = Math.max(0, Math.min(maxOffset, this._scrollOffset + delta));
    this._refreshPanel();
  }

  /**
   * Repositions all text objects when the canvas is resized.
   *
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    // Reposition compact texts.
    const compactStartY = height - 20 - (COMPACT_LINES - 1) * LINE_H;
    for (let i = 0; i < COMPACT_LINES; i++) {
      if (this._compactTexts[i]) {
        this._compactTexts[i].setPosition(PAD_X, compactStartY + i * LINE_H);
      }
    }

    // Reposition expanded panel.
    this._repositionPanel(width, height);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Creates the compact four-line log strip pinned to the bottom-left.
   */
  _buildCompact() {
    const { width, height } = this.scene.scale;
    const startY = height - 20 - (COMPACT_LINES - 1) * LINE_H;

    for (let i = 0; i < COMPACT_LINES; i++) {
      const txt = this.scene.add.text(PAD_X, startY + i * LINE_H, '', {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: i === COMPACT_LINES - 1 ? '#ffffff' : '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 3,
        resolution: 2,
      }).setScrollFactor(0).setDepth(100);
      this._compactTexts.push(txt);
    }
  }

  /**
   * Creates the expanded history panel (background + text rows + scroll hint).
   * The panel is initially hidden.
   */
  _buildExpandedPanel() {
    const { width, height } = this.scene.scale;
    const panelH = EXPANDED_LINES * LINE_H + 28; // +28 for header & hint rows
    const panelW = Math.min(width - 16, 500);
    const panelY = height - 20 - COMPACT_LINES * LINE_H - panelH - 4;

    // Semi-transparent dark background.
    this._panelBg = this.scene.add.rectangle(8, panelY, panelW, panelH, 0x060612, 0.88)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(199)
      .setStrokeStyle(1, 0x223344);

    // Header label.
    this._panelHeader = this.scene.add.text(PAD_X + 4, panelY + 4, 'MESSAGE HISTORY  (M to close)', {
      fontSize: '10px', fontFamily: 'monospace', color: '#446688', resolution: 2,
    }).setScrollFactor(0).setDepth(200);

    // Text rows for history lines.
    const rowStartY = panelY + 18;
    for (let i = 0; i < EXPANDED_LINES; i++) {
      const txt = this.scene.add.text(PAD_X + 4, rowStartY + i * LINE_H, '', {
        fontSize: '11px', fontFamily: 'monospace', color: '#cccccc',
        stroke: '#000000', strokeThickness: 2, resolution: 2,
      }).setScrollFactor(0).setDepth(200);
      this._panelTexts.push(txt);
    }

    // Scroll hint at the bottom of the panel.
    this._scrollHint = this.scene.add.text(
      PAD_X + 4, rowStartY + EXPANDED_LINES * LINE_H + 2,
      '↑↓ scroll  |  wheel to scroll', {
        fontSize: '9px', fontFamily: 'monospace', color: '#334455', resolution: 2,
      }
    ).setScrollFactor(0).setDepth(200);
  }

  /**
   * Shows or hides all expanded-panel objects as a unit.
   *
   * @param {boolean} visible
   */
  _setExpandedVisible(visible) {
    this._panelBg.setVisible(visible);
    this._panelHeader.setVisible(visible);
    this._scrollHint.setVisible(visible);
    for (const t of this._panelTexts) t.setVisible(visible);
  }

  /**
   * Repositions the expanded panel after a canvas resize.
   *
   * @param {number} width
   * @param {number} height
   */
  _repositionPanel(width, height) {
    const panelH = EXPANDED_LINES * LINE_H + 28;
    const panelW = Math.min(width - 16, 500);
    const panelY = height - 20 - COMPACT_LINES * LINE_H - panelH - 4;
    const rowStartY = panelY + 18;

    this._panelBg.setPosition(8, panelY).setSize(panelW, panelH);
    this._panelHeader.setPosition(PAD_X + 4, panelY + 4);

    for (let i = 0; i < EXPANDED_LINES; i++) {
      if (this._panelTexts[i]) {
        this._panelTexts[i].setPosition(PAD_X + 4, rowStartY + i * LINE_H);
      }
    }

    if (this._scrollHint) {
      this._scrollHint.setPosition(PAD_X + 4, rowStartY + EXPANDED_LINES * LINE_H + 2);
    }
  }

  /**
   * Refreshes the compact four-line strip from the history.
   */
  _refreshCompact() {
    const window = this._history.getWindow(0, COMPACT_LINES);
    for (let i = 0; i < COMPACT_LINES; i++) {
      const text = window[i] ?? '';
      if (this._compactTexts[i]) {
        this._compactTexts[i].setText(text);
        // Newest line (bottom) is brightest; older lines fade out.
        const alpha = i === COMPACT_LINES - 1 ? 1.0 : Math.max(0.3, 0.4 + i * 0.2);
        this._compactTexts[i].setAlpha(alpha);
      }
    }
  }

  /**
   * Refreshes the expanded history panel from the current scroll offset.
   */
  _refreshPanel() {
    const window = this._history.getWindow(this._scrollOffset, EXPANDED_LINES);
    for (let i = 0; i < EXPANDED_LINES; i++) {
      const text = window[i] ?? '';
      if (this._panelTexts[i]) {
        this._panelTexts[i].setText(text);
        // Dim entries that are at the top of the panel (oldest in the window).
        const alpha = i < 2 ? 0.5 : 1.0;
        this._panelTexts[i].setAlpha(alpha);
      }
    }

    // Update scroll hint to show position.
    const total = this._history.getCount();
    const maxOffset = Math.max(0, total - EXPANDED_LINES);
    if (this._scrollHint && maxOffset > 0) {
      const pct = maxOffset > 0 ? Math.round((this._scrollOffset / maxOffset) * 100) : 100;
      this._scrollHint.setText(`↑↓ scroll  |  ${pct}% from newest`);
    } else if (this._scrollHint) {
      this._scrollHint.setText('↑↓ scroll  |  wheel to scroll');
    }
  }
}
