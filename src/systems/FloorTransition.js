/**
 * @module FloorTransition
 * @description Pure logic for starting a floor transition (descent or ascent),
 * gated on the current turn state.  Extracting this ensures that rapidly
 * pressing the stair key cannot trigger more than one floor transition.
 */

import { TURN_STATE } from './TurnManager.js';

/**
 * Attempts to begin a floor transition.
 *
 * Sets the TurnManager state to TRANSITIONING (blocking all further input
 * including stair presses) and returns true when the game is ready to accept
 * the action.  Returns false without changing state when the game is busy.
 *
 * @param {import('./TurnManager.js').TurnManager} turnManager
 * @returns {boolean} True if the transition was accepted; false if blocked.
 */
export function startFloorTransition(turnManager) {
  if (turnManager.state !== TURN_STATE.PLAYER_INPUT) return false;
  turnManager.setState(TURN_STATE.TRANSITIONING);
  return true;
}
