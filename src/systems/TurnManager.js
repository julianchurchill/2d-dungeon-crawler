export const TURN_STATE = Object.freeze({
  PLAYER_INPUT: 'PLAYER_INPUT',
  PLAYER_ACTING: 'PLAYER_ACTING',
  ENEMY_ACTING: 'ENEMY_ACTING',
  GAME_OVER: 'GAME_OVER',
  INVENTORY: 'INVENTORY',
});

export class TurnManager {
  constructor() {
    this.state = TURN_STATE.PLAYER_INPUT;
  }

  isAcceptingInput() {
    return this.state === TURN_STATE.PLAYER_INPUT;
  }

  setPlayerActing() {
    this.state = TURN_STATE.PLAYER_ACTING;
  }

  setEnemyActing() {
    this.state = TURN_STATE.ENEMY_ACTING;
  }

  setPlayerInput() {
    this.state = TURN_STATE.PLAYER_INPUT;
  }

  setGameOver() {
    this.state = TURN_STATE.GAME_OVER;
  }

  setInventory() {
    this.state = TURN_STATE.INVENTORY;
  }
}
