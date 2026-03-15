/**
 * @module MobileMenuHandler
 * @description Pure logic for the mobile menu (≡) button, which acts as a
 * mobile equivalent of the ESC key.
 *
 * Extracting this function makes the routing logic testable independently
 * of Phaser or GameScene.
 */

/**
 * Handles a press of the mobile menu button.
 *
 * - If the message log history panel is open: close it.
 * - Otherwise: open the Achievements screen.
 *
 * @param {boolean}  messageLogOpen   - True if the history panel is currently visible.
 * @param {function} closeLog         - Callback to close the message log panel.
 * @param {function} openAchievements - Callback to open the Achievements screen.
 */
export function handleMobileMenuPress(messageLogOpen, closeLog, openAchievements) {
  if (messageLogOpen) {
    closeLog();
  } else {
    openAchievements();
  }
}
