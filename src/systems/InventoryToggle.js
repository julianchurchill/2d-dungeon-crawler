/**
 * @module InventoryToggle
 * @description Pure logic for toggling the inventory open/closed,
 * gated on the current turn state.  Extracting this ensures the
 * visual panel and the TurnManager state can never diverge.
 */

import { TURN_STATE } from './TurnManager.js';

/**
 * Applies the inventory open/close toggle if the current turn state allows it.
 *
 * - `PLAYER_INPUT` → opens the inventory (transitions to INVENTORY, returns true)
 * - `INVENTORY`    → closes the inventory (transitions to PLAYER_INPUT, returns true)
 * - Any other state → no-op (returns false)
 *
 * The caller should emit the `OPEN_INVENTORY` event (or equivalent) only
 * when this function returns true, keeping visual and state representations
 * in sync.
 *
 * @param {TurnManager} turnManager - The active TurnManager instance.
 * @returns {boolean} True if the toggle was applied; false if the state blocked it.
 */
export function applyInventoryToggle(turnManager) {
  if (turnManager.state === TURN_STATE.INVENTORY) {
    turnManager.setState(TURN_STATE.PLAYER_INPUT);
    return true;
  }
  if (turnManager.state === TURN_STATE.PLAYER_INPUT) {
    turnManager.setState(TURN_STATE.INVENTORY);
    return true;
  }
  return false;
}
