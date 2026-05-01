/**
 * @module SaveSlotScene
 * @description Displays five save slot cards so the player can choose which
 * slot to continue from or start a new game in.  Receives `{ mode }` in
 * scene data where mode is 'continue' or 'new'.
 *
 * Card layout (per slot):
 *   - Slot number label on the left
 *   - Floor / Level info in the centre (or "— Empty —" for empty slots)
 *   - Save timestamp on the right
 *
 * In 'continue' mode empty slots are dimmed and non-selectable.
 * In 'new' mode selecting an occupied slot requires a second confirmation
 * press before the existing save is overwritten.
 */
import Phaser from 'phaser';
import { FONT_FAMILY } from '../utils/FontConfig.js';
import { MenuNavigator } from '../utils/MenuNavigator.js';
import { listSaves, exportSave, importSave, TOTAL_SLOTS } from '../save/SaveGame.js';

const CARD_W      = 440;
const CARD_H      = 66;
const CARD_GAP    = 10;
const COLOR_BG    = 0x080818;

/** Formats an ISO date string as "DD Mon YYYY HH:MM". */
function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const pad = n => String(n).padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export class SaveSlotScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SaveSlotScene' });
  }

  /**
   * @param {{ mode: 'continue'|'new' }} data
   */
  create(data = {}) {
    this._mode          = data.mode ?? 'new';
    this._saves         = listSaves();
    this._awaitConfirm  = -1; // slot index awaiting overwrite confirmation (-1 = none)

    const { width, height } = this.scale;
    this._buildBackground();
    this._buildTitle(width, height);
    this._cards = this._buildCards(width, height);
    this._buildHints(width, height);
    this._setupKeyboardNav();

    this.scale.on('resize', (gameSize) => this._onResize(gameSize.width, gameSize.height), this);
  }

  // ─── Layout ───────────────────────────────────────────────────────────────

  _buildBackground() {
    this.add.rectangle(0, 0, 4000, 4000, COLOR_BG).setOrigin(0);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a1a3a, 0.4);
    for (let x = 0; x < 4000; x += 32) g.lineBetween(x, 0, x, 4000);
    for (let y = 0; y < 4000; y += 32) g.lineBetween(0, y, 4000, y);
  }

  /**
   * @param {number} width
   * @param {number} height
   */
  _buildTitle(width, height) {
    this.add.text(width / 2, height * 0.12, 'SELECT SAVE SLOT', {
      fontSize: '26px', fontFamily: FONT_FAMILY, color: '#ffdd88',
      stroke: '#884400', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5);

    const subtitle = this._mode === 'continue'
      ? 'Choose a slot to continue your adventure'
      : 'Choose a slot for your new game';
    this.add.text(width / 2, height * 0.12 + 36, subtitle, {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#888888', resolution: 2,
    }).setOrigin(0.5);
  }

  /**
   * Builds the five slot card objects and returns them.
   * @param {number} width
   * @param {number} height
   * @returns {Array<object>} Card descriptor objects.
   */
  _buildCards(width, height) {
    const totalH = TOTAL_SLOTS * CARD_H + (TOTAL_SLOTS - 1) * CARD_GAP;
    const startY = height * 0.5 - totalH / 2;
    const cx     = width / 2;

    return this._saves.map((entry, i) => {
      const cardY   = startY + i * (CARD_H + CARD_GAP);
      const enabled = this._isSelectable(entry);

      // Background rect
      const fill   = enabled ? 0x12202e : 0x0c1018;
      const stroke = enabled ? 0x4488cc : 0x223344;
      const bg = this.add.rectangle(cx, cardY, CARD_W, CARD_H, fill)
        .setStrokeStyle(1, stroke);
      if (enabled) bg.setInteractive({ useHandCursor: true });

      // Slot label (left)
      const slotTxt = this.add.text(cx - CARD_W / 2 + 16, cardY, `SLOT ${i + 1}`, {
        fontSize: '13px', fontFamily: FONT_FAMILY,
        color: enabled ? '#6699bb' : '#334455', resolution: 2,
      }).setOrigin(0, 0.5);

      // Main content (centre)
      let mainLine = '— Empty —';
      let mainColor = '#334455';
      if (!entry.empty) {
        mainLine  = `Floor ${entry.floor}  ·  Lv. ${entry.level}`;
        mainColor = '#88ccff';
      }
      const mainTxt = this.add.text(cx, cardY - 8, mainLine, {
        fontSize: '15px', fontFamily: FONT_FAMILY, color: mainColor, resolution: 2,
      }).setOrigin(0.5, 0.5);

      // Timestamp (below main line, same centre column)
      const dateTxt = this.add.text(cx, cardY + 10, entry.savedAt ? formatDate(entry.savedAt) : '', {
        fontSize: '11px', fontFamily: FONT_FAMILY, color: '#556677', resolution: 2,
      }).setOrigin(0.5, 0.5);

      // Pointer events
      if (enabled) {
        bg.on('pointerover',  () => this._focusCard(i));
        bg.on('pointerdown',  () => this._selectCard(i));
      }

      // Export button (occupied slots only, right edge of card)
      let actionTxt = null;
      if (!entry.empty) {
        actionTxt = this.add.text(cx + CARD_W / 2 - 12, cardY, '[ EXPORT ]', {
          fontSize: '10px', fontFamily: FONT_FAMILY, color: '#3a7a88', resolution: 2,
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        actionTxt.on('pointerover',  () => actionTxt.setColor('#66ccdd'));
        actionTxt.on('pointerout',   () => actionTxt.setColor('#3a7a88'));
        actionTxt.on('pointerdown',  (ptr) => { ptr.event?.stopPropagation?.(); this._exportSlot(i); });
      } else if (this._mode === 'new') {
        // Import button on empty slots in new-game mode
        actionTxt = this.add.text(cx + CARD_W / 2 - 12, cardY, '[ IMPORT ]', {
          fontSize: '10px', fontFamily: FONT_FAMILY, color: '#3a6677', resolution: 2,
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        actionTxt.on('pointerover',  () => actionTxt.setColor('#66aacc'));
        actionTxt.on('pointerout',   () => actionTxt.setColor('#3a6677'));
        actionTxt.on('pointerdown',  (ptr) => { ptr.event?.stopPropagation?.(); this._importSlot(i); });
      }

      const card = { bg, slotTxt, mainTxt, dateTxt, actionTxt, entry, enabled, index: i };

      return card;
    });
  }

  /**
   * @param {number} width
   * @param {number} height
   */
  _buildHints(width, height) {
    const extra = this._mode === 'new'
      ? '    E — Export    I — Import'
      : '    E — Export';
    this.add.text(width / 2, height * 0.94,
      `ESC — Back    ↑↓ — Navigate    Enter — Select${extra}`, {
        fontSize: '11px', fontFamily: FONT_FAMILY, color: '#445566', resolution: 2,
      }).setOrigin(0.5);
  }

  // ─── Interaction ──────────────────────────────────────────────────────────

  /**
   * Returns true if a slot is selectable given the current mode.
   * @param {{ empty: boolean }} entry
   */
  _isSelectable(entry) {
    if (this._mode === 'continue') return !entry.empty;
    return true; // all slots selectable in 'new' mode
  }

  /**
   * Moves keyboard focus to the given card index.
   * @param {number} index
   */
  _focusCard(index) {
    if (!this._cards[index].enabled) return;
    this._nav._index = index;
    this._updateFocus();
  }

  /**
   * Handles selection of a slot card (keyboard Enter or pointer click).
   * @param {number} index
   */
  _selectCard(index) {
    const card = this._cards[index];
    if (!card.enabled) return;

    if (this._mode === 'new' && !card.entry.empty) {
      // Occupied slot in new-game mode — require confirmation
      if (this._awaitConfirm === index) {
        this._launch(index);
      } else {
        this._awaitConfirm = index;
        this._showConfirm(index);
      }
      return;
    }

    this._awaitConfirm = -1;
    this._launch(index);
  }

  /**
   * Updates the card visual for the awaiting-confirm state.
   * @param {number} index
   */
  _showConfirm(index) {
    const card = this._cards[index];
    card.bg.setFillStyle(0x2a1800).setStrokeStyle(2, 0xcc7700);
    card.mainTxt.setText('⚠  Overwrite save?  Press Enter again to confirm').setColor('#ffaa44').setFontSize('12px');
    card.dateTxt.setText('');
  }

  /**
   * Starts the appropriate game scene for the chosen slot.
   * @param {number} slot
   */
  _launch(slot) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('GameScene', { mode: this._mode, slot });
      this.scene.launch('UIScene');
    });
  }

  // ─── Focus ────────────────────────────────────────────────────────────────

  /** Refreshes the border and text colour on all cards to reflect keyboard focus. */
  _updateFocus() {
    this._cards.forEach((card, i) => {
      const focused = i === this._nav.focusedIndex;
      const awaiting = i === this._awaitConfirm;

      if (awaiting) return; // leave confirm state visuals in place

      if (!card.enabled) return;

      if (focused) {
        card.bg.setFillStyle(0x1a3050).setStrokeStyle(2, 0x66aaff);
        card.slotTxt.setColor('#aaccff');
        if (!card.entry.empty) card.mainTxt.setColor('#ffffff');
      } else {
        card.bg.setFillStyle(0x12202e).setStrokeStyle(1, 0x4488cc);
        card.slotTxt.setColor('#6699bb');
        if (!card.entry.empty) card.mainTxt.setColor('#88ccff');
      }
    });
  }

  // ─── Keyboard nav ─────────────────────────────────────────────────────────

  _setupKeyboardNav() {
    // Start focus on the first selectable slot
    const firstSelectable = this._cards.findIndex(c => c.enabled);
    this._nav = new MenuNavigator(TOTAL_SLOTS);
    if (firstSelectable >= 0) this._nav._index = firstSelectable;
    this._updateFocus();

    this.input.keyboard.on('keydown-UP',    () => this._moveFocus(-1));
    this.input.keyboard.on('keydown-W',     () => this._moveFocus(-1));
    this.input.keyboard.on('keydown-DOWN',  () => this._moveFocus(1));
    this.input.keyboard.on('keydown-S',     () => this._moveFocus(1));
    this.input.keyboard.on('keydown-ENTER', () => this._selectCard(this._nav.focusedIndex));
    this.input.keyboard.on('keydown-SPACE', () => this._selectCard(this._nav.focusedIndex));
    this.input.keyboard.on('keydown-ESC',   () => this._goBack());
    this.input.keyboard.on('keydown-E',     () => this._exportSlot(this._nav.focusedIndex));
    this.input.keyboard.on('keydown-I',     () => this._importSlot(this._nav.focusedIndex));
  }

  /**
   * Moves focus in the given direction, skipping non-selectable cards.
   * @param {number} dir - +1 or -1
   */
  _moveFocus(dir) {
    // If awaiting confirm, any navigation cancels it
    if (this._awaitConfirm >= 0) {
      this._cancelConfirm(this._awaitConfirm);
      this._awaitConfirm = -1;
    }

    let next = this._nav.focusedIndex;
    for (let attempt = 0; attempt < TOTAL_SLOTS; attempt++) {
      next = (next + dir + TOTAL_SLOTS) % TOTAL_SLOTS;
      if (this._cards[next].enabled) break;
    }
    this._nav._index = next;
    this._updateFocus();
  }

  /**
   * Restores a card from confirm state back to its normal focused appearance.
   * @param {number} index
   */
  _cancelConfirm(index) {
    const card = this._cards[index];
    const mainLine = `Floor ${card.entry.floor}  ·  Lv. ${card.entry.level}`;
    card.mainTxt.setText(mainLine).setColor('#88ccff').setFontSize('15px');
    card.dateTxt.setText(card.entry.savedAt ? formatDate(card.entry.savedAt) : '');
    card.bg.setFillStyle(0x1a3050).setStrokeStyle(2, 0x66aaff);
  }

  /**
   * Exports the save in the given slot to the clipboard and shows a toast.
   * @param {number} index
   */
  _exportSlot(index) {
    const card = this._cards[index];
    if (!card || card.entry.empty) return;

    const encoded = exportSave(index);
    if (!encoded) return;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(encoded)
        .then(() => this._showToast(index, '✓ Copied to clipboard!', '#66ffcc'))
        .catch(() => this._showToast(index, '✗ Clipboard unavailable', '#ff8866'));
    } else {
      this._showToast(index, '✗ Clipboard unavailable', '#ff8866');
    }
  }

  /**
   * Prompts the player to paste an export string and imports it into the slot.
   * @param {number} index
   */
  _importSlot(index) {
    // eslint-disable-next-line no-alert
    const code = window.prompt('Paste save code to import into this slot:');
    if (!code) return;
    const ok = importSave(index, code.trim());
    if (ok) {
      this.scene.restart({ mode: this._mode });
    } else {
      this._showToast(index, '✗ Invalid save code', '#ff8866');
    }
  }

  /**
   * Briefly shows a status message overlaid on a card, then fades it out.
   * @param {number} index - Card index.
   * @param {string} message
   * @param {string} color  - Hex colour string.
   */
  _showToast(index, message, color) {
    const card = this._cards[index];
    const toast = this.add.text(
      card.bg.x, card.bg.y, message,
      { fontSize: '12px', fontFamily: FONT_FAMILY, color, resolution: 2 },
    ).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: toast,
      alpha: { from: 1, to: 0 },
      duration: 1800,
      delay: 600,
      onComplete: () => toast.destroy(),
    });
  }

  _goBack() {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => this.scene.start('MainMenuScene'));
  }

  /**
   * Rebuilds all content when the canvas is resized.
   * @param {number} width
   * @param {number} height
   */
  _onResize(width, height) {
    this.scene.restart({ mode: this._mode });
  }
}
