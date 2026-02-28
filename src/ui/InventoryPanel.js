import { EventBus } from '../utils/EventBus.js';

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
    const title = s.add.text(panelW / 2, 10, 'INVENTORY  (I to close)', {
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
            EventBus.emit('inventory-use', index);
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
  }

  show(inventory, player) {
    this.inventory = inventory;
    this.visible = true;
    this._container.setVisible(true);
    this._refresh(player);
  }

  hide() {
    this.visible = false;
    this._container.setVisible(false);
  }

  toggle(inventory, player) {
    if (this.visible) {
      this.hide();
    } else {
      this.show(inventory, player);
    }
  }

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
