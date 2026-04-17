/**
 * @module EquipmentPanel
 * @description Displays the player's equipped items across all equipment slots:
 * weapon, shield (armour), ranged weapon, helmet, chest, legs, arms, boots,
 * ring 1, ring 2, and amulet.  Arranged in a two-column grid so that all
 * eleven slots fit within the panel without excessive height.
 *
 * Layout (all measurements in pixels):
 *   - Two columns of slots, each slot 48 × 48 px
 *   - Left column:  Weapon, Shield, Ranged, Helmet, Chest, Legs
 *   - Right column: Arms, Boots, Ring 1, Ring 2, Amulet (+ empty filler)
 *   - Each slot group: title label + box + icon + name label
 */

import { FONT_FAMILY } from '../utils/FontConfig.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { tilesetManager as defaultTilesetManager } from '../systems/TilesetManager.js';

/** Width of each equipment slot in pixels. */
const SLOT_SIZE  = 36;
/** Padding inside the panel on all sides. */
const PANEL_PAD  = 16;
/** Gap between the two columns. */
const COL_GAP    = 8;
/** Horizontal width of the panel — two columns plus padding and gap. */
const PANEL_W    = PANEL_PAD * 2 + SLOT_SIZE * 2 + COL_GAP;   // 112 px
/** Vertical height of the panel — matches InventoryPanel's height formula. */
const PANEL_H    = 5 * (54 + 4) + PANEL_PAD * 2 + 72;  // 394 px
/** Horizontal gap between the inventory panel and this panel. */
const GAP        = 8;
/** Width of the inventory panel (must match InventoryPanel constants). */
const INV_PANEL_W = 4 * (54 + 4) + PANEL_PAD * 2;       // 264 px

/**
 * Height of a single slot group: 10 px title + SLOT_SIZE slot box + 10 px name label
 * + 2 px gap = 58 px.  Six rows fit in 394 − 28 = 366 px available space.
 */
const GROUP_H    = 10 + SLOT_SIZE + 10 + 2; // 58 px

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

    /** X centre of the left column. */
    const colLeftX  = PANEL_PAD + SLOT_SIZE / 2;
    /** X centre of the right column. */
    const colRightX = PANEL_PAD + SLOT_SIZE + COL_GAP + SLOT_SIZE / 2;

    // 6 rows × 58 px = 348 px; starts at 28 → ends at 376 px, within PANEL_H (394 px).
    const startY = 28;

    /**
     * Creates one equipment slot group (title label + slot box + icon + name
     * label) and adds all objects to the container.
     *
     * @param {number} cx     - Horizontal centre of the slot.
     * @param {number} groupY - Y position of the group's title label.
     * @param {string} label  - Slot title displayed above the box.
     * @returns {{ icon: object, label: object }}
     */
    const makeSlot = (cx, groupY, label) => {
      const labelY = groupY;
      const slotY  = labelY + 10;
      const nameY  = slotY + SLOT_SIZE + 2;

      this._container.add(
        s.add.text(cx, labelY, label, {
          fontSize: '9px', fontFamily: FONT_FAMILY, color: '#99bbdd',
          stroke: '#000000', strokeThickness: 2, resolution: 2,
        }).setOrigin(0.5, 0)
      );

      this._container.add(
        s.add.rectangle(cx, slotY + SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 0x222233, 1)
          .setStrokeStyle(1, 0x445566)
      );

      const icon = s.add.image(cx, slotY + SLOT_SIZE / 2, '__DEFAULT')
        .setDisplaySize(SLOT_SIZE - 6, SLOT_SIZE - 6)
        .setVisible(false);
      this._container.add(icon);

      const nameLabel = s.add.text(cx, nameY, 'Empty', {
        fontSize: '8px', fontFamily: FONT_FAMILY, color: '#cccccc',
        stroke: '#000000', strokeThickness: 2, resolution: 2,
        wordWrap: { width: SLOT_SIZE }, align: 'center',
      }).setOrigin(0.5, 0);
      this._container.add(nameLabel);

      return { icon, label: nameLabel };
    };

    // ── Left column: Weapon, Shield, Ranged, Helmet, Chest, Legs ──
    const wpn = makeSlot(colLeftX, startY,                  'Weapon');
    this._weaponIcon  = wpn.icon;
    this._weaponLabel = wpn.label;

    const shd = makeSlot(colLeftX, startY + GROUP_H,        'Shield');
    this._shieldIcon  = shd.icon;
    this._shieldLabel = shd.label;

    const rng = makeSlot(colLeftX, startY + GROUP_H * 2,    'Ranged');
    this._rangedIcon  = rng.icon;
    this._rangedLabel = rng.label;

    const hlm = makeSlot(colLeftX, startY + GROUP_H * 3,    'Helmet');
    this._helmetIcon  = hlm.icon;
    this._helmetLabel = hlm.label;

    const cst = makeSlot(colLeftX, startY + GROUP_H * 4,    'Chest');
    this._chestIcon  = cst.icon;
    this._chestLabel = cst.label;

    const lgs = makeSlot(colLeftX, startY + GROUP_H * 5,    'Legs');
    this._legsIcon  = lgs.icon;
    this._legsLabel = lgs.label;

    // ── Right column: Arms, Boots, Ring 1, Ring 2, Amulet ──
    const arm = makeSlot(colRightX, startY,                  'Arms');
    this._armsIcon  = arm.icon;
    this._armsLabel = arm.label;

    const bts = makeSlot(colRightX, startY + GROUP_H,        'Boots');
    this._bootsIcon  = bts.icon;
    this._bootsLabel = bts.label;

    const rg1 = makeSlot(colRightX, startY + GROUP_H * 2,    'Ring 1');
    this._ring1Icon  = rg1.icon;
    this._ring1Label = rg1.label;

    const rg2 = makeSlot(colRightX, startY + GROUP_H * 3,    'Ring 2');
    this._ring2Icon  = rg2.icon;
    this._ring2Label = rg2.label;

    const aml = makeSlot(colRightX, startY + GROUP_H * 4,    'Amulet');
    this._amuletIcon  = aml.icon;
    this._amuletLabel = aml.label;

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
   */
  _refresh() {
    if (!this._player) return;
    this._refreshSlot(this._player.equippedWeapon,       this._weaponIcon,  this._weaponLabel);
    this._refreshSlot(this._player.equippedArmor,        this._shieldIcon,  this._shieldLabel);
    this._refreshSlot(this._player.equippedRangedWeapon, this._rangedIcon,  this._rangedLabel);
    this._refreshSlot(this._player.equippedHelmet,       this._helmetIcon,  this._helmetLabel);
    this._refreshSlot(this._player.equippedChest,        this._chestIcon,   this._chestLabel);
    this._refreshSlot(this._player.equippedLegs,         this._legsIcon,    this._legsLabel);
    this._refreshSlot(this._player.equippedArms,         this._armsIcon,    this._armsLabel);
    this._refreshSlot(this._player.equippedBoots,        this._bootsIcon,   this._bootsLabel);
    this._refreshSlot(this._player.equippedRing1,        this._ring1Icon,   this._ring1Label);
    this._refreshSlot(this._player.equippedRing2,        this._ring2Icon,   this._ring2Label);
    this._refreshSlot(this._player.equippedAmulet,       this._amuletIcon,  this._amuletLabel);
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
