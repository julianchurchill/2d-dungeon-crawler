/**
 * @module HudRegistrySync
 * Pure utility that reads initial player and floor values from a Phaser-style
 * registry and pushes them into a HUD instance.
 *
 * Extracted from UIScene so the behaviour can be unit-tested independently of
 * Phaser internals.
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
 * @param {{ updateHP: Function, updateStats: Function, updateFloor: Function }} hud - HUD instance to update.
 */
export function syncHudFromRegistry(registry, hud) {
  const hp = registry.get('playerHP');
  const maxHp = registry.get('playerMaxHp') || 30;
  if (hp !== undefined) hud.updateHP(hp, maxHp);

  const stats = registry.get('playerStats');
  if (stats) hud.updateStats(stats);

  const floor = registry.get('floor');
  if (floor !== undefined) hud.updateFloor(floor);
}
