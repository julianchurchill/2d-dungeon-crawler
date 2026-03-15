/**
 * @module SceneNavigation
 * @description Pure helpers for in-game overlay scene back-navigation.
 *
 * Centralising this logic makes the routing testable independently of Phaser
 * and ensures AchievementsScene, HelpScene, and any future overlay scenes all
 * behave consistently.
 */

/**
 * @typedef {{ action: 'launch'|'wake'|'start', scene?: string }} BackResult
 */

/**
 * Resolves what should happen when the player presses Back on an overlay screen.
 *
 * - `'InGameMenuScene'` → re-launch InGameMenuScene (GameScene/UIScene stay sleeping)
 * - `'GameScene'`       → wake GameScene and UIScene directly
 * - anything else       → start that scene (e.g. return to MainMenuScene)
 *
 * @param {string} fromScene - The scene key that launched the current overlay.
 * @returns {BackResult}
 */
export function resolveSceneBack(fromScene) {
  if (fromScene === 'InGameMenuScene') return { action: 'launch', scene: 'InGameMenuScene' };
  if (fromScene === 'GameScene')       return { action: 'wake' };
  return { action: 'start', scene: fromScene };
}
