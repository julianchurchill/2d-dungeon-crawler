import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { DevOptionsScene } from './scenes/DevOptionsScene.js';
import { AchievementsScene } from './scenes/AchievementsScene.js';
import { InGameMenuScene } from './scenes/InGameMenuScene.js';
import { HelpScene } from './scenes/HelpScene.js';
import { DevMenuScene } from './scenes/DevMenuScene.js';
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
  scene: [BootScene, MainMenuScene, DevOptionsScene, AchievementsScene, InGameMenuScene, HelpScene, DevMenuScene, GameScene, UIScene],
};

const game = new Phaser.Game(config);

// Keep canvas filling window on resize
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
