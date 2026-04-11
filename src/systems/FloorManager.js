import { createRNG } from '../utils/RNG.js';
import { BSPDungeonGenerator } from '../dungeon/BSPDungeonGenerator.js';
import { TownGenerator } from '../dungeon/TownGenerator.js';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';

export class FloorManager {
  constructor() {
    this.currentFloor = 0;
    this.dungeonGenerator = new BSPDungeonGenerator();
    this.townGenerator = new TownGenerator();
  }

  /**
   * Generate dungeon data for the current floor.
   * At floor 0 the fixed town layout is returned; for all other floors a
   * procedurally-generated BSP dungeon is produced.  Floor 1 receives
   * up-stairs leading back to the town.
   * @returns {{ map, rooms, startPos, stairsPos, stairsUpPos? }}
   */
  generateFloor() {
    if (this.isTown()) {
      return this.townGenerator.generate();
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
   * @returns {{ map, rooms, startPos, stairsPos, stairsUpPos? }}
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
}
