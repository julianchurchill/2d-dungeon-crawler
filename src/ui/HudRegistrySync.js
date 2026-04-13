/**
 * @module HudRegistrySync
 * Pure utilities that connect a Phaser-style registry to a HUD instance.
 *
 * Extracted from UIScene so behaviour can be unit-tested independently of
 * Phaser internals.
 *
 * Three functions are provided:
 *   - `syncHudFromRegistry`          — eager one-shot read on scene start.
 *   - `attachHudRegistryListeners`   — wire live changedata-* → HUD updates.
 *   - `detachHudRegistryListeners`   — remove those listeners on scene shutdown
 *                                      to prevent stale callbacks firing after
 *                                      the HUD's game objects are destroyed.
 */

/**
 * Applies whatever values are already stored in `registry` to `hud`.
 *
 * UIScene calls this once at the end of `create()` because GameScene runs its
 * `create()` — and therefore its initial `registry.set()` calls — before
 * UIScene registers its `changedata-*` event listeners.  Without this eager
 * read the HUD would show stale defaults until the next registry write.
 *
 * @param {{ get: (key: string) => any }} registry - Phaser-compatible registry (or mock).
 * @param {{ updateHP: Function, updateStats: Function, updateFloor: Function, updateGold: Function }} hud - HUD instance to update.
 */
export function syncHudFromRegistry(registry, hud) {
  const hp = registry.get('playerHP');
  const maxHp = registry.get('playerMaxHp') || 30;
  if (hp !== undefined) hud.updateHP(hp, maxHp);

  const stats = registry.get('playerStats');
  if (stats) hud.updateStats(stats);

  const floor = registry.get('floor');
  if (floor !== undefined) hud.updateFloor(floor);

  const gold = registry.get('playerGold');
  if (gold !== undefined) hud.updateGold(gold);
}

/**
 * Registers `changedata-*` event listeners on `registryEvents` that forward
 * live registry updates to the HUD.  Returns a handle object that must be
 * passed to `detachHudRegistryListeners` in the scene's shutdown handler to
 * prevent stale listeners accumulating across game restarts.
 *
 * Returning the handle (rather than storing handlers in module-level variables)
 * keeps each scene's listener set independent, so two overlapping UIScene
 * instances cannot overwrite each other's references.
 *
 * @param {import('node:events').EventEmitter} registryEvents - The registry's event emitter
 *   (`this.registry.events` in a Phaser scene).
 * @param {{ get: (key: string) => any }} registry - Used to read `playerMaxHp` alongside HP updates.
 * @param {{ updateHP: Function, updateStats: Function, updateFloor: Function, updateGold: Function }} hud
 * @returns {{ registryEvents: object, onHP: Function, onStats: Function, onFloor: Function, onGold: Function }}
 *   Opaque handle — pass directly to `detachHudRegistryListeners`.
 */
export function attachHudRegistryListeners(registryEvents, registry, hud) {
  const onHP    = (_parent, value) => hud.updateHP(value, registry.get('playerMaxHp') || 30);
  const onStats = (_parent, stats) => { if (stats) hud.updateStats(stats); };
  const onFloor = (_parent, floor) => hud.updateFloor(floor);
  const onGold  = (_parent, gold)  => hud.updateGold(gold);

  registryEvents.on('changedata-playerHP',    onHP);
  registryEvents.on('changedata-playerStats', onStats);
  registryEvents.on('changedata-floor',       onFloor);
  registryEvents.on('changedata-playerGold',  onGold);

  return { registryEvents, onHP, onStats, onFloor, onGold };
}

/**
 * Removes the listeners previously registered by `attachHudRegistryListeners`.
 * Call this from the scene's `shutdown` event handler so that destroyed HUD
 * game objects are never referenced after the scene is stopped.
 *
 * @param {{ registryEvents: object, onHP: Function, onStats: Function, onFloor: Function, onGold: Function }} handle
 *   The value returned by `attachHudRegistryListeners`.
 */
export function detachHudRegistryListeners(handle) {
  if (!handle) return;
  const { registryEvents, onHP, onStats, onFloor, onGold } = handle;
  registryEvents.off('changedata-playerHP',    onHP);
  registryEvents.off('changedata-playerStats', onStats);
  registryEvents.off('changedata-floor',       onFloor);
  registryEvents.off('changedata-playerGold',  onGold);
}
