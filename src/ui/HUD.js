const BAR_W = 120;
const BAR_H = 14;

export class HUD {
  /**
   * @param {Phaser.Scene} scene - UIScene
   */
  constructor(scene) {
    this.scene = scene;
    this._build();
  }

  _build() {
    const s = this.scene;

    // --- HP Bar ---
    this.hpBg = s.add.rectangle(10 + BAR_W / 2, 14, BAR_W, BAR_H, 0x330000)
      .setScrollFactor(0).setDepth(100).setOrigin(0.5);

    this.hpBar = s.add.rectangle(10, 14, BAR_W, BAR_H, 0xcc2222)
      .setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

    this.hpText = s.add.text(10 + BAR_W / 2, 14, 'HP: 30/30', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setScrollFactor(0).setDepth(102).setOrigin(0.5);

    // --- Stats row ---
    this.statsText = s.add.text(10, 32, 'LVL:1  ATK:5  DEF:2', {
      fontSize: '10px', fontFamily: 'monospace', color: '#dddddd',
      stroke: '#000000', strokeThickness: 2, resolution: 2,
    }).setScrollFactor(0).setDepth(100);

    // --- Floor indicator (top-right) ---
    this.floorText = s.add.text(
      s.scale.width - 10, 14, 'Floor 1', {
        fontSize: '12px', fontFamily: 'monospace', color: '#ffdd88',
        stroke: '#000000', strokeThickness: 3, resolution: 2,
      }
    ).setScrollFactor(0).setDepth(100).setOrigin(1, 0.5);

    // --- XP Bar ---
    this.xpBg = s.add.rectangle(10 + BAR_W / 2, 44, BAR_W, 6, 0x222244)
      .setScrollFactor(0).setDepth(100).setOrigin(0.5);
    this.xpBar = s.add.rectangle(10, 44, 0, 6, 0x4444cc)
      .setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);
  }

  updateHP(hp, maxHp) {
    const ratio = Math.max(0, hp / maxHp);
    this.hpBar.setSize(Math.round(BAR_W * ratio), BAR_H);
    // Color shifts red → orange → green based on HP ratio
    const color = ratio > 0.6 ? 0x44cc44 : ratio > 0.3 ? 0xddaa22 : 0xcc2222;
    this.hpBar.setFillStyle(color);
    this.hpText.setText(`HP: ${hp}/${maxHp}`);
  }

  updateStats(stats) {
    this.statsText.setText(`LVL:${stats.level}  ATK:${stats.attack}  DEF:${stats.defense}`);
    const xpRatio = stats.xpToNext > 0 ? stats.xp / stats.xpToNext : 0;
    this.xpBar.setSize(Math.round(BAR_W * xpRatio), 6);
  }

  updateFloor(floor) {
    this.floorText.setText(`Floor ${floor}`);
  }

  resize(width, height) {
    this.floorText.setPosition(width - 10, 14);
  }
}
