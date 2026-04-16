/**
 * @module RangedCombat
 * Pure functions for ranged-weapon attack resolution and target finding.
 * No Phaser dependencies — fully testable in isolation.
 */

/**
 * How many extra tiles beyond the weapon's range to scan when looking for
 * an out-of-range enemy.  A value of 20 comfortably covers any practical
 * dungeon width/height.
 */
const OUT_OF_RANGE_LOOKAHEAD = 20;

/**
 * Find the first entity in a straight line from the shooter's position.
 * Scans tile-by-tile in the given direction.
 *
 * Within `range` tiles: returns the entity if found (wall stops the scan).
 * Beyond `range` tiles: continues scanning up to OUT_OF_RANGE_LOOKAHEAD
 * additional tiles so callers can tell the player their target is out of range
 * rather than simply absent.
 *
 * @param {number}   px          - Shooter tile X.
 * @param {number}   py          - Shooter tile Y.
 * @param {number}   dx          - Direction X (-1, 0, or 1).
 * @param {number}   dy          - Direction Y (-1, 0, or 1).
 * @param {number}   range       - Maximum fire range in tiles.
 * @param {function} isOpaque    - (x, y) => boolean — true when the tile blocks projectiles.
 * @param {function} getEntityAt - (x, y) => entity | null — returns the entity at the tile.
 * @returns {{ target: object|null, outOfRange: boolean }}
 *   `target` is the entity within range (or null).
 *   `outOfRange` is true when an entity was found beyond range (not blocked by a wall first).
 */
export function findRangedTarget(px, py, dx, dy, range, isOpaque, getEntityAt) {
  const totalScan = range + OUT_OF_RANGE_LOOKAHEAD;

  for (let step = 1; step <= totalScan; step++) {
    const tx = px + dx * step;
    const ty = py + dy * step;

    if (isOpaque(tx, ty)) return { target: null, outOfRange: false };

    const entity = getEntityAt(tx, ty);
    if (entity) {
      // Entity found within fire range — targetable.
      if (step <= range) return { target: entity, outOfRange: false };
      // Entity found beyond fire range — not targetable but worth reporting.
      return { target: null, outOfRange: true };
    }
  }
  return { target: null, outOfRange: false };
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

  const playerIsAttacker = !attacker.name; // Player has no name property
  const atkName = playerIsAttacker ? 'You' : attacker.name;
  // When the target is the player (no name) use "you"; otherwise use the name.
  const defName = target.name || 'you';
  const article = target.name ? 'the ' : '';
  const verb = playerIsAttacker ? 'fire' : 'fires';
  const killVerb = playerIsAttacker ? 'kill' : 'kills';
  // Kill pronoun: "kill it" when player kills enemy; "kills you" when enemy kills player.
  const killPronoun = target.name ? 'it' : 'you';
  const msg = killed
    ? `${atkName} ${verb} at ${article}${defName} and ${killVerb} ${killPronoun}!`
    : `${atkName} ${verb} at ${article}${defName} for ${actualDamage} damage.`;

  return { damage: actualDamage, killed, messages: [msg] };
}
