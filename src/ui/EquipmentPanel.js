/**
 * @module EquipmentPanel
 * @description Displays the player's equipped melee weapon, shield (armour),
 * and ranged weapon as three labelled visual slots with item icons.  The panel
 * is shown and hidden alongside the inventory panel and is positioned
 * immediately to its right.
 *
 * Layout (all measurements in pixels):
 *   - Three slots stacked vertically, each 72 × 72 px
 *   - Slot group = slot label (above) + slot box + icon + item-name label (below)
 *   - All three groups are centred within the panel height (394 px)
 */

import { FONT_FAMILY } from '../utils/FontConfig.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { tilesetManager as defaultTilesetManager } from '../systems/TilesetManager.js';

/** Width of each equipment slot in pixels. */
const SLOT_SIZE  = 72;
/** Padding inside the panel on all sides. */
const PANEL_PAD  = 16;
/** Horizontal width of the panel. */
const PANEL_W    = SLOT_SIZE + PANEL_PAD * 2;   // 104 px
/** Vertical height of the panel — matches InventoryPanel's height formula. */
const PANEL_H    = 5 * (54 + 4) + PANEL_PAD * 2 + 72;  // 394 px
/** Horizontal gap between the inventory panel and this panel. */
const GAP        = 8;
/** Width of the inventory panel (must match InventoryPanel constants). */
const INV_PANEL_W = 4 * (54 + 4) + PANEL_PAD * 2;       // 264 px

export class EquipmentPanel {
  /**
   * @param {Phaser.Scene} scene - The UIScene instance.
   * @param {import('../systems/TilesetManager.js').TilesetManager} [tilesetManager]
   *   Injected tileset manager; defaults to the singleton. Pass a custom instance
   *   in tests to control the active tileset without touching localStorage.
   */
  constructor(scene, tilesetManager = defaultTilesetManager) {
    this.scene           = scene;
    this._tilesetManager = tilesetManager;
    this.visible         = false;
    this._player         = null;
    this._build();
  }

  // ── Construction ─────────────────────────────────────────────────────────

  /**
   * Creates all Phaser display objects and registers the INVENTORY_CHANGED
   * listener so the panel stays current while open.
   */
  _build() {
    const s = this.scene;
    const { width, height } = s.scale;

    const [panelX, panelY] = this._calcPosition(width, height);

    this._container = s.add.container(panelX, panelY)
      .setDepth(300)
      .setScrollFactor(0)
      .setVisible(false);

    // Background
    const bg = s.add.rectangle(PANEL_W / 2, PANEL_H / 2, PANEL_W, PANEL_H, 0x111122, 0.95)
      .setStrokeStyle(2, 0x4466aa);
    this._container.add(bg);

    // Title
    const title = s.add.text(PANEL_W / 2, 10, 'Equipment', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#aaccff',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setOrigin(0.5, 0);
    this._container.add(title);

    // Vertical positions for the three slot groups.
    // Each group: label (14px) + slot (SLOT_SIZE px) + name (14px) = 100px, plus 6px gap.
    // 3 groups × 100px + 2 × 6px gaps = 312px content height.
    const GROUP_STRIDE = 14 + SLOT_SIZE + 14 + 6; // 106 px per group
    const contentH     = 3 * GROUP_STRIDE - 6;    // 312 px (no trailing gap)
    const startY       = Math.floor((PANEL_H - 30 - contentH) / 2) + 30;

    /**
     * Creates one equipment slot group (title label + slot box + icon + name label)
     * and adds all objects to the container.
     *
     * @param {number} groupY - Y position of the group's title label.
     * @param {string} title  - Slot title displayed above the box.
     * @returns {{ icon: object, label: object }}
     */
    const makeSlot = (groupY, title) => {
      const labelY = groupY;
      const slotY  = labelY + 14;
      const nameY  = slotY + SLOT_SIZE + 2;

      this._container.add(
        s.add.text(PANEL_W / 2, labelY, title, {
          fontSize: '11px', fontFamily: FONT_FAMILY, color: '#99bbdd',
          stroke: '#000000', strokeThickness: 2, resolution: 2,
        }).setOrigin(0.5, 0)
      );

      this._container.add(
        s.add.rectangle(PANEL_W / 2, slotY + SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 0x222233, 1)
          .setStrokeStyle(1, 0x445566)
      );

      const icon = s.add.image(PANEL_W / 2, slotY + SLOT_SIZE / 2, '__DEFAULT')
        .setDisplaySize(SLOT_SIZE - 8, SLOT_SIZE - 8)
        .setVisible(false);
      this._container.add(icon);

      const label = s.add.text(PANEL_W / 2, nameY, 'Empty', {
        fontSize: '10px', fontFamily: FONT_FAMILY, color: '#cccccc',
        stroke: '#000000', strokeThickness: 2, resolution: 2,
        wordWrap: { width: SLOT_SIZE }, align: 'center',
      }).setOrigin(0.5, 0);
      this._container.add(label);

      return { icon, label };
    };

    // ── Weapon slot ──
    const wpn = makeSlot(startY, 'Weapon');
    this._weaponIcon  = wpn.icon;
    this._weaponLabel = wpn.label;

    // ── Shield slot ──
    const shd = makeSlot(startY + GROUP_STRIDE, 'Shield');
    this._shieldIcon  = shd.icon;
    this._shieldLabel = shd.label;

    // ── Ranged slot ──
    const rng = makeSlot(startY + GROUP_STRIDE * 2, 'Ranged');
    this._rangedIcon  = rng.icon;
    this._rangedLabel = rng.label;

    // Refresh when inventory changes (e.g. player equips an item)
    EventBus.on(GameEvents.INVENTORY_CHANGED, () => {
      if (this.visible) this._refresh();
    });
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Shows the panel and populates slots from the player's equipment.
   *
   * @param {import('../entities/Player.js').Player} player
   */
  show(player) {
    this._player = player;
    this.visible = true;
    this._container.setVisible(true);
    this._refresh();
  }

  /** Hides the panel. */
  hide() {
    this.visible = false;
    this._container.setVisible(false);
  }

  /**
   * Re-centres the panel on window resize.
   *
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    const [x, y] = this._calcPosition(width, height);
    this._container.setPosition(x, y);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Returns the top-left [x, y] position for the panel so it sits
   * immediately to the right of the centred inventory panel.
   *
   * @param {number} width  - Viewport width.
   * @param {number} height - Viewport height.
   * @returns {[number, number]}
   */
  _calcPosition(width, height) {
    const invX    = Math.floor((width - INV_PANEL_W) / 2);
    const invY    = Math.floor((height - PANEL_H) / 2);
    const idealX  = invX + INV_PANEL_W + GAP;
    // Clamp so the right edge never exceeds the viewport.
    const clampedX = Math.min(idealX, width - PANEL_W);
    return [clampedX, invY];
  }

  /**
   * Updates all slot labels and icons from the stored player reference.
   * Icons are shown with the item's tileset-prefixed texture when an item is
   * equipped and hidden when the slot is empty.
   */
  _refresh() {
    if (!this._player) return;
    this._refreshSlot(this._player.equippedWeapon,        this._weaponIcon, this._weaponLabel);
    this._refreshSlot(this._player.equippedArmor,         this._shieldIcon, this._shieldLabel);
    this._refreshSlot(this._player.equippedRangedWeapon,  this._rangedIcon, this._rangedLabel);
  }

  /**
   * Updates a single equipment slot's icon and name label.
   *
   * @param {import('../items/Item.js').Item|null} item   - Equipped item or null.
   * @param {object} icon  - Phaser Image object for the slot icon.
   * @param {object} label - Phaser Text object for the item name.
   */
  _refreshSlot(item, icon, label) {
    label.setText(item?.name ?? 'Empty');
    if (item) {
      icon.setTexture(this._tilesetManager.getTileKey(item.textureKey)).setVisible(true);
    } else {
      icon.setVisible(false);
    }
  }
}
