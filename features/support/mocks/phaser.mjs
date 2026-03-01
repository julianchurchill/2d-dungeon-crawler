/**
 * Minimal Phaser mock for Node.js test environment.
 * Replaces Phaser.Events.EventEmitter with Node's built-in EventEmitter.
 */
import { EventEmitter } from 'node:events';

class PhaserEventEmitter extends EventEmitter {
  emit(event, ...args) {
    super.emit(event, ...args);
    return this;
  }
}

export default {
  Events: {
    EventEmitter: PhaserEventEmitter,
  },
};
