/**
 * Step definitions for InventoryPanel display behaviour.
 *
 * The equipped-text scenarios (WPN/ARM bar) have been removed now that the
 * EquipmentPanel handles equipped item display.  This file retains the
 * INVENTORY_CHANGED cleanup hook which is shared across the test suite to
 * prevent listener accumulation between scenarios.
 */
import { After } from '@cucumber/cucumber';
import { EventBus } from '../../src/utils/EventBus.js';
import { GameEvents } from '../../src/events/GameEvents.js';

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Remove the inventory-changed listeners registered during this scenario
 * to prevent listener accumulation across the test suite.
 */
After(function () {
  EventBus.removeAllListeners(GameEvents.INVENTORY_CHANGED);
});
