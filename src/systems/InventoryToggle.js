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
 * - `PLAYER_INPUT`  → opens the inventory (calls setInventory, returns true)
 * - `INVENTORY`     → closes the inventory (calls setPlayerInput, returns true)
 * - Any other state → no-op (returns false)
 *
 * The caller should emit the `OPEN_INVENTORY` event (or equivalent) only
 * when this function returns true, keeping visual and state representations
 * in sync.
 *
 * @param {string}   turnState      - Current value from TURN_STATE.
 * @param {function} setInventory   - Callback to transition into INVENTORY state.
 * @param {function} setPlayerInput - Callback to transition back to PLAYER_INPUT.
 * @returns {boolean} True if the toggle was applied; false if the state blocked it.
 */
export function applyInventoryToggle(turnState, setInventory, setPlayerInput) {
  if (turnState === TURN_STATE.INVENTORY) {
    setPlayerInput();
    return true;
  }
  if (turnState === TURN_STATE.PLAYER_INPUT) {
    setInventory();
    return true;
  }
  return false;
}
