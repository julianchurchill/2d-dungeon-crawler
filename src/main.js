import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { DevOptionsScene } from './scenes/DevOptionsScene.js';
import { AchievementsScene } from './scenes/AchievementsScene.js';
import { InGameMenuScene } from './scenes/InGameMenuScene.js';
import { HelpScene } from './scenes/HelpScene.js';
import { DevMenuScene } from './scenes/DevMenuScene.js';
import { SkillLevelUpScene } from './scenes/SkillLevelUpScene.js';
import { OptionsScene } from './scenes/OptionsScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [BootScene, MainMenuScene, OptionsScene, DevOptionsScene, AchievementsScene, InGameMenuScene, HelpScene, DevMenuScene, SkillLevelUpScene, GameScene, UIScene],
};

/**
 * Starts the Phaser game and wires up the resize listener.
 */
function startGame() {
  const game = new Phaser.Game(config);

  // Keep canvas filling window on resize
  window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
  });
}

// Wait for Roboto Mono to be in the browser's canvas font cache before Phaser
// creates any Text objects.  Without this, the initial render may use a fallback
// font; the first pointer-over triggers a re-render with the now-loaded Roboto
// Mono, making the font appear to change on hover.
// Falls back immediately if the font fails to load (e.g. offline).
document.fonts.load('16px "Roboto Mono"').then(startGame, startGame);
