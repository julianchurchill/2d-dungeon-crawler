/**
 * @module DialoguePanel
 * @description A modal panel that shows an NPC's name and a single line of
 * dialogue. Dismissed by ENTER, ESC, or tapping anywhere on the panel.
 *
 * Interaction:
 *  - Opened by UIScene in response to OPEN_DIALOGUE.
 *  - Dismissed by CLOSE_DIALOGUE (emitted by GameScene on ESC/ENTER, or by
 *    the panel's own close button).
 */
import { FONT_FAMILY } from '../utils/FontConfig.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';

const PANEL_W = 280;
const PANEL_PAD = 14;

export class DialoguePanel {
  /**
   * @param {Phaser.Scene} scene - UIScene instance.
   */
  constructor(scene) {
    this.scene = scene;
    /** @type {boolean} Whether the panel is currently visible. */
    this.visible = false;
    this._build();
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Opens the dialogue panel with the given NPC name and dialogue line.
   *
   * @param {string} npcName - The NPC's display name.
   * @param {string} line    - The dialogue line to show.
   */
  show(npcName, line) {
    this._nameText.setText(npcName);
    this._lineText.setText(line);

    // Resize background to fit the text
    const lineHeight = this._lineText.height || 40;
    const panelH = PANEL_PAD + 20 + PANEL_PAD / 2 + lineHeight + PANEL_PAD;
    this._bg.setSize(PANEL_W, Math.max(80, panelH));

    const { width, height } = this.scene.scale;
    this._container.setPosition(
      Math.floor((width - PANEL_W) / 2),
      Math.floor(height * 0.6),
    );

    this.visible = true;
    this._container.setVisible(true);
    EventBus.emit(GameEvents.DIALOGUE_TOGGLED, true);
  }

  /** Hides the dialogue panel. */
  hide() {
    if (!this.visible) return;
    this.visible = false;
    this._container.setVisible(false);
    EventBus.emit(GameEvents.DIALOGUE_TOGGLED, false);
  }

  /**
   * Repositions the panel when the game canvas is resized.
   *
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    if (!this.visible) return;
    this._container.setPosition(
      Math.floor((width - PANEL_W) / 2),
      Math.floor(height * 0.6),
    );
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  /** Constructs the static panel chrome. */
  _build() {
    const s = this.scene;

    this._container = s.add.container(0, 0)
      .setDepth(300).setScrollFactor(0).setVisible(false);

    // Background
    this._bg = s.add.rectangle(0, 0, PANEL_W, 80, 0x111122, 0.95)
      .setStrokeStyle(2, 0x4466aa).setOrigin(0, 0);
    this._container.add(this._bg);

    // NPC name — displayed as a coloured label at the top
    this._nameText = s.add.text(PANEL_PAD, PANEL_PAD, '', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#88ffaa',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    });
    this._container.add(this._nameText);

    // Close button (✕) — top-right, clears the close button area
    this._closeBtn = s.add.text(PANEL_W - PANEL_PAD, PANEL_PAD, '✕', {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#aaccff',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this._closeBtn.on('pointerover', () => this._closeBtn.setColor('#ffffff'));
    this._closeBtn.on('pointerout',  () => this._closeBtn.setColor('#aaccff'));
    this._closeBtn.on('pointerdown', () => EventBus.emit(GameEvents.CLOSE_DIALOGUE));
    this._container.add(this._closeBtn);

    // Dialogue line — word-wrapped below the name
    this._lineText = s.add.text(PANEL_PAD, PANEL_PAD + 20, '', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#dddddd',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
      wordWrap: { width: PANEL_W - PANEL_PAD * 2 - 22 },
    });
    this._container.add(this._lineText);

    // Dismiss hint — bottom-right corner
    this._hintText = s.add.text(PANEL_W - PANEL_PAD, 0, '[ENTER] to dismiss', {
      fontSize: '9px', fontFamily: FONT_FAMILY, color: '#666666',
      stroke: '#000000', strokeThickness: 1, resolution: 2,
    }).setOrigin(1, 1);
    this._container.add(this._hintText);
  }
}
