/**
 * @module TurnManager
 * @description Tracks whose turn it is and whether the game is accepting
 * player input.  All state values are defined in the TURN_STATE constant.
 */

/** All valid turn states. */
export const TURN_STATE = Object.freeze({
  PLAYER_INPUT:  'PLAYER_INPUT',
  PLAYER_ACTING: 'PLAYER_ACTING',
  ENEMY_ACTING:  'ENEMY_ACTING',
  GAME_OVER:     'GAME_OVER',
  INVENTORY:     'INVENTORY',
  SKILLS:        'SKILLS',
  SHOP:          'SHOP',
});

export class TurnManager {
  constructor() {
    this.state = TURN_STATE.PLAYER_INPUT;
  }

  /**
   * Returns true when the game is ready to accept a new player action.
   * @returns {boolean}
   */
  isAcceptingInput() {
    return this.state === TURN_STATE.PLAYER_INPUT;
  }

  /**
   * Transitions to the given turn state.
   * @param {string} state - One of the TURN_STATE values.
   */
  setState(state) {
    this.state = state;
  }
}
