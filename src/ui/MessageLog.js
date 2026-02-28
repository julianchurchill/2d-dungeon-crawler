const MAX_LINES = 4;

export class MessageLog {
  /**
   * @param {Phaser.Scene} scene - UIScene
   */
  constructor(scene) {
    this.scene = scene;
    this.lines = [];
    this.texts = [];
    this._build();
  }

  _build() {
    const { width, height } = this.scene.scale;
    const startY = height - 20 - (MAX_LINES - 1) * 18;

    for (let i = 0; i < MAX_LINES; i++) {
      const text = this.scene.add.text(8, startY + i * 18, '', {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: i === MAX_LINES - 1 ? '#ffffff' : '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 3,
        resolution: 2,
      }).setScrollFactor(0).setDepth(100);
      this.texts.push(text);
    }
  }

  addMessage(text) {
    this.lines.push(text);
    if (this.lines.length > MAX_LINES) {
      this.lines.shift();
    }
    this._refresh();
  }

  _refresh() {
    for (let i = 0; i < MAX_LINES; i++) {
      const lineIndex = this.lines.length - MAX_LINES + i;
      const line = lineIndex >= 0 ? this.lines[lineIndex] : '';
      if (this.texts[i]) this.texts[i].setText(line);
      // Dim older lines
      if (this.texts[i]) {
        const alpha = i === MAX_LINES - 1 ? 1.0 : Math.max(0.3, 0.4 + i * 0.2);
        this.texts[i].setAlpha(alpha);
      }
    }
  }

  resize(width, height) {
    const startY = height - 20 - (MAX_LINES - 1) * 18;
    for (let i = 0; i < MAX_LINES; i++) {
      if (this.texts[i]) this.texts[i].setPosition(8, startY + i * 18);
    }
  }
}
