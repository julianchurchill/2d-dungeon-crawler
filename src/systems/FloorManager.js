import { createRNG } from '../utils/RNG.js';
import { BSPDungeonGenerator } from '../dungeon/BSPDungeonGenerator.js';
import { TownGenerator } from '../dungeon/TownGenerator.js';
import { ChallengeFloorGenerator } from '../dungeon/ChallengeFloorGenerator.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';

export class FloorManager {
  constructor() {
    this.currentFloor = 0;
    this.dungeonGenerator = new BSPDungeonGenerator();
    this.townGenerator = new TownGenerator();
    this.challengeFloorGenerator = new ChallengeFloorGenerator();
  }

  /**
   * Generate dungeon data for the current floor.
   * Floor 0 returns the fixed town layout.
   * Floors that are multiples of 5 (5, 10, 15, …) return a fixed challenge
   * floor layout — two rooms connected by a corridor, the second filled with
   * enemies the player must defeat before descending.
   * All other floors return a procedurally-generated BSP dungeon.
   *
   * @returns {{ map, rooms, startPos, stairsPos, stairsUpPos, isChallenge? }}
   */
  generateFloor() {
    if (this.isTown()) {
      return this.townGenerator.generate();
    }
    if (this.isChallengeFloor()) {
      return this.challengeFloorGenerator.generate();
    }
    // Seed based on floor number + a fixed offset for reproducibility
    const seed = this.currentFloor * 31337 + 12345;
    const rng = createRNG(seed);
    return this.dungeonGenerator.generate(rng, this.currentFloor);
  }

  descend() {
    this.currentFloor++;
    EventBus.emit(GameEvents.FLOOR_CHANGED, this.currentFloor);
    return this.generateFloor();
  }

  /**
   * Move back up one floor.  Returns the dungeon data for the destination
   * floor.  The player is placed at the stairs-down position of that floor
   * so they land near the stairs they came up from.
   * @returns {{ map, rooms, startPos, stairsPos, stairsUpPos }}
   */
  ascend() {
    this.currentFloor--;
    EventBus.emit(GameEvents.FLOOR_CHANGED, this.currentFloor);
    return this.generateFloor();
  }

  reset() {
    this.currentFloor = 0;
  }

  /**
   * Returns true if the current floor is the town (floor 0).
   * @returns {boolean}
   */
  isTown() {
    return this.currentFloor === 0;
  }

  /**
   * Returns true if the current floor is a challenge floor — any dungeon
   * floor number that is a non-zero multiple of 5 (floors 5, 10, 15, …).
   * Challenge floors have a fixed two-room layout and require all enemies to
   * be defeated before the down-staircase can be used.
   *
   * @returns {boolean}
   */
  isChallengeFloor() {
    return this.currentFloor > 0 && this.currentFloor % 5 === 0;
  }
}
