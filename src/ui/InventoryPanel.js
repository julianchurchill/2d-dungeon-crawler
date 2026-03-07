import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { InventoryCursor } from '../systems/InventoryCursor.js';

const COLS = 4;
const ROWS = 5;
const SLOT_SIZE = 44;
const SLOT_PAD = 4;
const PANEL_PAD = 16;

export class InventoryPanel {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.inventory = [];
    this._cursor = new InventoryCursor(COLS, ROWS);
    this._build();
  }

  _build() {
    const s = this.scene;
    const { width, height } = s.scale;

    const panelW = COLS * (SLOT_SIZE + SLOT_PAD) + PANEL_PAD * 2;
    const panelH = ROWS * (SLOT_SIZE + SLOT_PAD) + PANEL_PAD * 2 + 30;
    const panelX = Math.floor((width - panelW) / 2);
    const panelY = Math.floor((height - panelH) / 2);

    this._container = s.add.container(panelX, panelY)
      .setDepth(300).setScrollFactor(0).setVisible(false);

    // Background
    const bg = s.add.rectangle(panelW / 2, panelH / 2, panelW, panelH, 0x111122, 0.95)
      .setStrokeStyle(2, 0x4466aa);
    this._container.add(bg);

    // Title
    const title = s.add.text(panelW / 2, 10, 'INVENTORY  [I] close  [↵] use/equip', {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaccff',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0);
    this._container.add(title);

    // Slots
    this._slots = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const index = row * COLS + col;
        const sx = PANEL_PAD + col * (SLOT_SIZE + SLOT_PAD) + SLOT_SIZE / 2;
        const sy = PANEL_PAD + 26 + row * (SLOT_SIZE + SLOT_PAD) + SLOT_SIZE / 2;

        const slotBg = s.add.rectangle(sx, sy, SLOT_SIZE, SLOT_SIZE, 0x222233, 1)
          .setStrokeStyle(1, 0x445566)
          .setInteractive({ useHandCursor: false });

        const icon = s.add.text(sx, sy - 4, '', {
          fontSize: '18px', resolution: 2,
        }).setOrigin(0.5);

        const label = s.add.text(sx, sy + 14, '', {
          fontSize: '7px', fontFamily: 'monospace', color: '#cccccc',
          wordWrap: { width: SLOT_SIZE - 2 }, align: 'center', resolution: 2,
        }).setOrigin(0.5);

        slotBg.on('pointerdown', () => {
          if (index < this.inventory.length) {
            // Move cursor to the clicked slot so the highlight stays consistent.
            this._cursor.setIndex(index);
            this._highlightCursor();
            EventBus.emit(GameEvents.INVENTORY_USE, index);
          }
        });

        slotBg.on('pointerover', () => {
          if (index < this.inventory.length) slotBg.setFillStyle(0x333355);
        });
        slotBg.on('pointerout', () => slotBg.setFillStyle(0x222233));

        this._container.add([slotBg, icon, label]);
        this._slots.push({ bg: slotBg, icon, label });
      }
    }

    // Equipped display
    this._equippedText = s.add.text(PANEL_PAD, panelH - 14, 'WPN: -   ARM: -', {
      fontSize: '9px', fontFamily: 'monospace', color: '#88aacc',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    });
    this._container.add(this._equippedText);

    // Refresh the equipped-name display whenever the inventory changes.
    // InventorySystem emits 'inventory-changed' after every interaction.
    EventBus.on(GameEvents.INVENTORY_CHANGED, () => {
      if (this.visible) {
        this._refresh(this._player);
      }
    });
  }

  show(inventory, player) {
    this.inventory = inventory;
    // Store the player ref so inventory-changed events can refresh without
    // the caller needing to pass the player again.
    this._player = player;
    this.visible = true;
    this._container.setVisible(true);
    this._cursor.reset();
    this._refresh(player);
    this._highlightCursor();
    this._addKeyListeners();
  }

  hide() {
    this.visible = false;
    this._container.setVisible(false);
    this._clearCursorHighlight();
    this._removeKeyListeners();
  }

  toggle(inventory, player) {
    if (this.visible) {
      this.hide();
    } else {
      this.show(inventory, player);
    }
  }

  // ─── Cursor highlighting ──────────────────────────────────────────────────

  /**
   * Restores the previous slot's stroke and applies a bright highlight to the
   * current cursor slot.
   */
  _highlightCursor() {
    if (this._prevCursorIndex !== undefined) {
      this._slots[this._prevCursorIndex].bg.setStrokeStyle(1, 0x445566);
    }
    const idx = this._cursor.index;
    this._slots[idx].bg.setStrokeStyle(2, 0xffdd44);
    this._prevCursorIndex = idx;
  }

  /**
   * Removes the cursor highlight when the panel is hidden.
   */
  _clearCursorHighlight() {
    if (this._prevCursorIndex !== undefined) {
      this._slots[this._prevCursorIndex].bg.setStrokeStyle(1, 0x445566);
      this._prevCursorIndex = undefined;
    }
  }

  // ─── Keyboard navigation ──────────────────────────────────────────────────

  /**
   * Registers keyboard handlers on the UIScene keyboard plugin while the
   * panel is visible. Stored as named arrow functions so they can be removed
   * precisely by _removeKeyListeners.
   */
  _addKeyListeners() {
    const kb = this.scene.input.keyboard;
    // Arrow keys and WASD for navigation; Enter to use the highlighted item.
    this._kbUp    = () => this._navigate('up');
    this._kbDown  = () => this._navigate('down');
    this._kbLeft  = () => this._navigate('left');
    this._kbRight = () => this._navigate('right');
    this._kbEnter = () => this._useCurrentSlot();

    kb.on('keydown-UP',    this._kbUp);
    kb.on('keydown-DOWN',  this._kbDown);
    kb.on('keydown-LEFT',  this._kbLeft);
    kb.on('keydown-RIGHT', this._kbRight);
    kb.on('keydown-W',     this._kbUp);
    kb.on('keydown-S',     this._kbDown);
    kb.on('keydown-A',     this._kbLeft);
    kb.on('keydown-D',     this._kbRight);
    kb.on('keydown-ENTER', this._kbEnter);
  }

  /**
   * Removes the keyboard handlers registered by _addKeyListeners.
   */
  _removeKeyListeners() {
    const kb = this.scene.input.keyboard;
    if (!this._kbUp) return;
    kb.off('keydown-UP',    this._kbUp);
    kb.off('keydown-DOWN',  this._kbDown);
    kb.off('keydown-LEFT',  this._kbLeft);
    kb.off('keydown-RIGHT', this._kbRight);
    kb.off('keydown-W',     this._kbUp);
    kb.off('keydown-S',     this._kbDown);
    kb.off('keydown-A',     this._kbLeft);
    kb.off('keydown-D',     this._kbRight);
    kb.off('keydown-ENTER', this._kbEnter);
    this._kbUp = this._kbDown = this._kbLeft = this._kbRight = this._kbEnter = null;
  }

  /**
   * Moves the cursor in the given direction and refreshes the visual highlight.
   *
   * @param {'up'|'down'|'left'|'right'} direction
   */
  _navigate(direction) {
    switch (direction) {
      case 'up':    this._cursor.moveUp();    break;
      case 'down':  this._cursor.moveDown();  break;
      case 'left':  this._cursor.moveLeft();  break;
      case 'right': this._cursor.moveRight(); break;
    }
    this._highlightCursor();
  }

  /**
   * Uses (equips or consumes) the item at the current cursor slot, if any.
   */
  _useCurrentSlot() {
    const idx = this._cursor.index;
    if (idx < this.inventory.length) {
      EventBus.emit(GameEvents.INVENTORY_USE, idx);
    }
  }

  // ─── Content refresh ─────────────────────────────────────────────────────

  _refresh(player) {
    const ICONS = {
      consumable: '🧪',
      weapon: '⚔️',
      armor: '🛡️',
    };
    for (let i = 0; i < this._slots.length; i++) {
      const { icon, label } = this._slots[i];
      if (i < this.inventory.length) {
        const item = this.inventory[i];
        icon.setText(ICONS[item.itemType] || '?');
        label.setText(item.name);
      } else {
        icon.setText('');
        label.setText('');
      }
    }

    if (player) {
      const wpn = player.equippedWeapon?.name || '-';
      const arm = player.equippedArmor?.name || '-';
      this._equippedText.setText(`WPN: ${wpn}   ARM: ${arm}`);
    }
  }

  resize(width, height) {
    const panelW = COLS * (SLOT_SIZE + SLOT_PAD) + PANEL_PAD * 2;
    const panelH = ROWS * (SLOT_SIZE + SLOT_PAD) + PANEL_PAD * 2 + 30;
    this._container.setPosition(
      Math.floor((width - panelW) / 2),
      Math.floor((height - panelH) / 2)
    );
  }
}
