/**
 * @module MessageLog
 * @description Renders the in-game message log in the bottom-left corner of
 * the UIScene.  In its compact form it shows the four most recent messages.
 * Clicking the compact log area opens an expanded history panel that shows
 * up to 15 lines and can be scrolled with the mouse wheel to reveal older
 * entries.  A scrollbar on the right side of the panel shows current position.
 * Press ESC to close the panel.
 *
 * Depends on MessageHistory for all data storage and windowing logic.
 * Emits MESSAGE_LOG_TOGGLED via EventBus so GameScene can gate its own
 * ESC handler (to prevent the Achievements screen opening while the panel
 * is visible).
 */

import { MessageHistory } from './MessageHistory.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';

/** Number of lines visible in the compact (always-on) log strip. */
const COMPACT_LINES = 4;

/** Number of lines visible in the expanded history panel. */
const EXPANDED_LINES = 15;

/** Pixel height of each text row. */
const LINE_H = 18;

/** Left padding for log text. */
const PAD_X = 8;

/** Width of the compact click zone and expanded panel. */
const PANEL_W_MAX = 500;

/** Width of the scrollbar track and thumb in pixels. */
const SCROLLBAR_W = 5;

/** Inset of the scrollbar from the right inner edge of the panel. */
const SCROLLBAR_INSET = 4;

/** Minimum thumb height in pixels so it remains clickable/visible. */
const THUMB_MIN_H = 16;

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

    /** @type {Phaser.GameObjects.Rectangle} Invisible click zone over compact log. */
    this._clickZone = null;

    /** @type {Phaser.GameObjects.Rectangle|null} Expanded panel background. */
    this._panelBg = null;

    /** @type {Phaser.GameObjects.Text[]} Expanded panel text objects. */
    this._panelTexts = [];

    /** @type {Phaser.GameObjects.Text|null} Scroll-hint label. */
    this._scrollHint = null;

    /** @type {Phaser.GameObjects.Rectangle|null} Scrollbar track. */
    this._scrollTrack = null;

    /** @type {Phaser.GameObjects.Rectangle|null} Scrollbar thumb. */
    this._scrollThumb = null;

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
   * Emits MESSAGE_LOG_TOGGLED so GameScene can track the panel state.
   */
  toggleExpanded() {
    this._expanded = !this._expanded;
    if (this._expanded) {
      this._scrollOffset = 0;
      this._refreshPanel();
    }
    this._setExpandedVisible(this._expanded);
    EventBus.emit(GameEvents.MESSAGE_LOG_TOGGLED, this._expanded);
  }

  /**
   * Closes the expanded panel if it is currently open.
   * Called when GameScene receives CLOSE_MESSAGE_LOG (ESC key while panel open).
   */
  close() {
    if (this._expanded) this.toggleExpanded();
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
    // Reposition compact texts and click zone.
    const compactStartY = height - 20 - (COMPACT_LINES - 1) * LINE_H;
    for (let i = 0; i < COMPACT_LINES; i++) {
      if (this._compactTexts[i]) {
        this._compactTexts[i].setPosition(PAD_X, compactStartY + i * LINE_H);
      }
    }
    if (this._clickZone) {
      const zoneW = Math.min(width - 16, PANEL_W_MAX);
      const zoneH = COMPACT_LINES * LINE_H + 8;
      this._clickZone.setPosition(PAD_X, compactStartY - 4).setSize(zoneW, zoneH);
    }

    // Reposition expanded panel and scrollbar.
    this._repositionPanel(width, height);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Creates the compact four-line log strip pinned to the bottom-left, plus
   * an invisible interactive zone over it that opens the history panel on click.
   */
  _buildCompact() {
    const { width, height } = this.scene.scale;
    const startY = height - 20 - (COMPACT_LINES - 1) * LINE_H;
    const zoneW  = Math.min(width - 16, PANEL_W_MAX);
    const zoneH  = COMPACT_LINES * LINE_H + 8;

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

    // Transparent rectangle covering the compact log — clicking it opens the panel.
    this._clickZone = this.scene.add.rectangle(PAD_X, startY - 4, zoneW, zoneH, 0xffffff, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(102)
      .setInteractive({ useHandCursor: true });

    // Subtle highlight on hover to hint interactivity.
    this._clickZone.on('pointerover', () => this._clickZone.setFillStyle(0xffffff, 0.04));
    this._clickZone.on('pointerout',  () => this._clickZone.setFillStyle(0xffffff, 0));
    this._clickZone.on('pointerdown', () => this.toggleExpanded());
  }

  /**
   * Creates the expanded history panel (background + text rows + scroll hint
   * + scrollbar track and thumb).  The panel is initially hidden.
   */
  _buildExpandedPanel() {
    const { width, height } = this.scene.scale;
    const { panelW, panelH, panelY, rowStartY, trackX, trackY, trackH } =
      this._panelLayout(width, height);

    // Semi-transparent dark background.
    this._panelBg = this.scene.add.rectangle(8, panelY, panelW, panelH, 0x060612, 0.88)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(199)
      .setStrokeStyle(1, 0x223344);

    // Header label.
    this._panelHeader = this.scene.add.text(PAD_X + 4, panelY + 4, 'MESSAGE HISTORY  (ESC to close)', {
      fontSize: '10px', fontFamily: 'monospace', color: '#446688', resolution: 2,
    }).setScrollFactor(0).setDepth(200);

    // Text rows for history lines.
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
      'Wheel to scroll', {
        fontSize: '9px', fontFamily: 'monospace', color: '#334455', resolution: 2,
      }
    ).setScrollFactor(0).setDepth(200);

    // Scrollbar track — a subtle vertical bar on the right inner edge.
    this._scrollTrack = this.scene.add.rectangle(trackX, trackY, SCROLLBAR_W, trackH, 0x1a2a3a)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(200);

    // Scrollbar thumb — positioned and sized in _updateScrollbar().
    this._scrollThumb = this.scene.add.rectangle(trackX, trackY, SCROLLBAR_W, THUMB_MIN_H, 0x446688)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(201);
  }

  /**
   * Computes the shared layout values used by build, reposition, and scrollbar
   * update methods so the calculations are never duplicated.
   *
   * @param {number} width
   * @param {number} height
   * @returns {{ panelW: number, panelH: number, panelY: number,
   *             rowStartY: number, trackX: number, trackY: number, trackH: number }}
   */
  _panelLayout(width, height) {
    const panelH    = EXPANDED_LINES * LINE_H + 28;
    const panelW    = Math.min(width - 16, PANEL_W_MAX);
    const panelY    = height - 20 - COMPACT_LINES * LINE_H - panelH - 4;
    const rowStartY = panelY + 18;
    // Scrollbar track spans the full row area on the right inner edge.
    const trackX = 8 + panelW - SCROLLBAR_W - SCROLLBAR_INSET;
    const trackY = rowStartY;
    const trackH = EXPANDED_LINES * LINE_H;
    return { panelW, panelH, panelY, rowStartY, trackX, trackY, trackH };
  }

  /**
   * Shows or hides all expanded-panel objects as a unit.
   * The scrollbar visibility is further controlled by _updateScrollbar()
   * based on whether there is content to scroll.
   *
   * @param {boolean} visible
   */
  _setExpandedVisible(visible) {
    this._panelBg.setVisible(visible);
    this._panelHeader.setVisible(visible);
    this._scrollHint.setVisible(visible);
    this._scrollTrack.setVisible(visible);
    this._scrollThumb.setVisible(visible);
    for (const t of this._panelTexts) t.setVisible(visible);
  }

  /**
   * Repositions the expanded panel and scrollbar after a canvas resize.
   *
   * @param {number} width
   * @param {number} height
   */
  _repositionPanel(width, height) {
    const { panelW, panelH, panelY, rowStartY, trackX, trackY, trackH } =
      this._panelLayout(width, height);

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

    // Reposition scrollbar track.
    if (this._scrollTrack) {
      this._scrollTrack.setPosition(trackX, trackY).setSize(SCROLLBAR_W, trackH);
    }

    // Reposition thumb — recalculate from current scroll state.
    this._updateScrollbar(trackX, trackY, trackH);
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
   * Refreshes the expanded history panel from the current scroll offset
   * and updates the scrollbar position.
   */
  _refreshPanel() {
    const window = this._history.getWindow(this._scrollOffset, EXPANDED_LINES);
    for (let i = 0; i < EXPANDED_LINES; i++) {
      const text = window[i] ?? '';
      if (this._panelTexts[i]) {
        this._panelTexts[i].setText(text);
        // Dim entries at the top of the panel (oldest in window).
        this._panelTexts[i].setAlpha(i < 2 ? 0.5 : 1.0);
      }
    }

    // Recalculate layout for scrollbar.
    const { width, height } = this.scene.scale;
    const { trackX, trackY, trackH } = this._panelLayout(width, height);
    this._updateScrollbar(trackX, trackY, trackH);
  }

  /**
   * Positions and sizes the scrollbar thumb based on the current scroll state.
   * Hides both track and thumb when all messages fit in the visible window
   * (nothing to scroll).
   *
   * Thumb position:
   *  - Thumb at bottom → scrollOffset = 0 (viewing newest messages)
   *  - Thumb at top    → scrollOffset = maxOffset (viewing oldest messages)
   *
   * @param {number} trackX - Left edge of the scrollbar track.
   * @param {number} trackY - Top edge of the scrollbar track.
   * @param {number} trackH - Height of the scrollbar track in pixels.
   */
  _updateScrollbar(trackX, trackY, trackH) {
    if (!this._scrollTrack || !this._scrollThumb) return;

    const total     = this._history.getCount();
    const maxOffset = Math.max(0, total - EXPANDED_LINES);

    if (maxOffset === 0) {
      // All messages fit — hide scrollbar.
      this._scrollTrack.setVisible(false);
      this._scrollThumb.setVisible(false);
      return;
    }

    this._scrollTrack.setVisible(true).setPosition(trackX, trackY).setSize(SCROLLBAR_W, trackH);

    // Thumb height proportional to the fraction of content that is visible.
    const thumbH = Math.max(THUMB_MIN_H, Math.round((EXPANDED_LINES / total) * trackH));

    // Thumb Y: offset=0 (newest) → thumb at bottom; offset=maxOffset (oldest) → thumb at top.
    const thumbY = trackY + Math.round((1 - this._scrollOffset / maxOffset) * (trackH - thumbH));

    this._scrollThumb
      .setVisible(true)
      .setPosition(trackX, thumbY)
      .setSize(SCROLLBAR_W, thumbH);
  }
}
