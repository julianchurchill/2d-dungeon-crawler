import { createRNG } from '../utils/RNG.js';
import { BSPDungeonGenerator } from '../dungeon/BSPDungeonGenerator.js';
import { EventBus } from '../utils/EventBus.js';

export class FloorManager {
  constructor() {
    this.currentFloor = 1;
    this.generator = new BSPDungeonGenerator();
  }

  /**
   * Generate dungeon data for the current floor.
   * @returns {{ map, rooms, startPos, stairsPos }}
   */
  generateFloor() {
    // Seed based on floor number + a fixed offset for reproducibility
    const seed = this.currentFloor * 31337 + 12345;
    const rng = createRNG(seed);
    return this.generator.generate(rng);
  }

  descend() {
    this.currentFloor++;
    EventBus.emit('floor-changed', this.currentFloor);
    return this.generateFloor();
  }

  reset() {
    this.currentFloor = 1;
  }
}
