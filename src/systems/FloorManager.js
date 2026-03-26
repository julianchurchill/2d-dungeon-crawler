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
   * procedurally-generated BSP dungeon is produced.
   * @returns {{ map, rooms, startPos, stairsPos }}
   */
  generateFloor() {
    if (this.isTown()) {
      return this.townGenerator.generate();
    }
    // Seed based on floor number + a fixed offset for reproducibility
    const seed = this.currentFloor * 31337 + 12345;
    const rng = createRNG(seed);
    return this.dungeonGenerator.generate(rng);
  }

  descend() {
    this.currentFloor++;
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
