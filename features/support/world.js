import { setWorldConstructor } from '@cucumber/cucumber';

class GameWorld {
  constructor() {
    this.player = null;
    this.enemy = null;
    this.map = null;
    this.result = null;
    this.rng = null;
    this.dungeonResult = null;
    this.dungeonResult2 = null;
    this.turnManager = null;
    this.fovMap = null;
    this.attackResults = [];
    this.previousHp = null;
  }
}

setWorldConstructor(GameWorld);
