/**
 * @module SkillsToggle
 * @description Pure logic for toggling the skills panel open/closed,
 * gated on the current turn state.  Extracting this ensures the
 * visual panel and the TurnManager state can never diverge.
 */

import { TURN_STATE } from './TurnManager.js';

/**
 * Applies the skills open/close toggle if the current turn state allows it.
 *
 * - `PLAYER_INPUT` → opens the skills panel (calls setSkills, returns true)
 * - `SKILLS`       → closes the skills panel (calls setPlayerInput, returns true)
 * - Any other state → no-op (returns false)
 *
 * The caller should emit the `OPEN_SKILLS` event (or equivalent) only when
 * this function returns true, keeping visual and state representations in sync.
 *
 * @param {string}   turnState      - Current value from TURN_STATE.
 * @param {function} setSkills      - Callback to transition into SKILLS state.
 * @param {function} setPlayerInput - Callback to transition back to PLAYER_INPUT.
 * @returns {boolean} True if the toggle was applied; false if the state blocked it.
 */
export function applySkillsToggle(turnState, setSkills, setPlayerInput) {
  if (turnState === TURN_STATE.SKILLS) {
    setPlayerInput();
    return true;
  }
  if (turnState === TURN_STATE.PLAYER_INPUT) {
    setSkills();
    return true;
  }
  return false;
}
