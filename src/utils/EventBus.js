import Phaser from 'phaser';

/**
 * Shared EventEmitter singleton for cross-scene communication.
 * Usage:
 *   import { EventBus } from '../utils/EventBus.js';
 *   EventBus.emit('message', 'You hit the goblin for 3 damage!');
 *   EventBus.on('message', (text) => { ... });
 */
export const EventBus = new Phaser.Events.EventEmitter();
