/**
 * @module RangedCombat
 * Pure functions for ranged-weapon attack resolution and target finding.
 * No Phaser dependencies — fully testable in isolation.
 */

/**
 * Find the first entity in a straight line from the shooter's position.
 * Scans tile-by-tile in the given direction until an opaque tile (wall) is
 * encountered, the range is exhausted, or an entity is found.
 *
 * @param {number}   px         - Shooter tile X.
 * @param {number}   py         - Shooter tile Y.
 * @param {number}   dx         - Direction X (-1, 0, or 1).
 * @param {number}   dy         - Direction Y (-1, 0, or 1).
 * @param {number}   range      - Maximum number of tiles to scan.
 * @param {function} isOpaque   - (x, y) => boolean — true when the tile blocks projectiles.
 * @param {function} getEntityAt - (x, y) => entity | null — returns the first entity at the tile.
 * @returns {object|null} The first entity found, or null if the path is clear / out of range.
 */
export function findRangedTarget(px, py, dx, dy, range, isOpaque, getEntityAt) {
  for (let step = 1; step <= range; step++) {
    const tx = px + dx * step;
    const ty = py + dy * step;

    if (isOpaque(tx, ty)) return null;

    const entity = getEntityAt(tx, ty);
    if (entity) return entity;
  }
  return null;
}

/**
 * Resolve a ranged attack from attacker against target, using the attacker's
 * `rangedAttackPower` (base + ranged-weapon bonus only, no melee bonus).
 *
 * @param {object}  attacker                        - Entity with a `rangedAttackPower` property (or fallback stats.attack).
 * @param {object}  target                          - Entity with `.takeDamage()`, `.isDead()`, and `.name`.
 * @param {object}  rng                             - RNG instance with a `nextInt(min, max)` method.
 * @param {object}  [options]
 * @param {boolean} [options.defenderIsInvincible]  - When true the defender takes 0 damage (dev mode).
 * @returns {{ damage: number, killed: boolean, messages: string[] }}
 */
export function resolveRangedAttack(attacker, target, rng, { defenderIsInvincible = false } = {}) {
  const atkPower = attacker.rangedAttackPower ?? attacker.stats?.attack ?? 1;
  const variance = rng.nextInt(-2, 2);
  const attackDamage = Math.max(1, atkPower + variance);

  const actualDamage = defenderIsInvincible ? 0 : target.takeDamage(attackDamage);
  const killed = target.isDead();

  const atkName = attacker.name || 'You';
  const defName = target.name || 'it';
  const verb = atkName === 'You' ? 'fire' : 'fires';
  const msg = killed
    ? `${atkName} ${verb} at the ${defName} and kill it!`
    : `${atkName} ${verb} at the ${defName} for ${actualDamage} damage.`;

  return { damage: actualDamage, killed, messages: [msg] };
}
