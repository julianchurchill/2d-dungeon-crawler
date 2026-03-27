/**
 * @module EscPanelClose
 * @description Pure helper that decides which panel the ESC key should close
 * based on the current TurnManager state.  Returns a string action token and
 * mutates the TurnManager state when a panel is closed, or returns null when
 * no panel is open and the caller should fall through to the in-game menu.
 *
 * Keeping this logic out of GameScene makes it testable without Phaser.
 */

import { TURN_STATE } from './TurnManager.js';

/**
 * Inspects `turnManager.state` and, if an inventory or skills panel is open,
 * transitions the state back to PLAYER_INPUT and returns the action string.
 * Returns null when no panel close is applicable.
 *
 * @param {import('./TurnManager.js').TurnManager} turnManager
 * @returns {'close-inventory'|'close-skills'|null}
 */
export function applyEscPanelClose(turnManager) {
  if (turnManager.state === TURN_STATE.INVENTORY) {
    turnManager.setState(TURN_STATE.PLAYER_INPUT);
    return 'close-inventory';
  }
  if (turnManager.state === TURN_STATE.SKILLS) {
    turnManager.setState(TURN_STATE.PLAYER_INPUT);
    return 'close-skills';
  }
  return null;
}
