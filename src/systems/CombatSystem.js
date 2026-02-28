/**
 * Pure combat resolution functions — no Phaser dependencies.
 * GameScene calls these and handles visual effects.
 */

/**
 * Resolve a melee attack.
 * @param {object} attacker - has .attackPower or .stats.attack
 * @param {object} defender - has .takeDamage(), .isDead(), .name
 * @param {object} rng
 * @returns {{ damage: number, killed: boolean, message: string }}
 */
export function resolveMeleeAttack(attacker, defender, rng) {
  const atkPower = attacker.attackPower ?? attacker.stats.attack;
  const variance = rng.nextInt(-2, 2);
  const rawDamage = Math.max(1, atkPower + variance);
  const actualDamage = defender.takeDamage(rawDamage);
  const killed = defender.isDead();

  const atkName = attacker.name || 'You';
  const defName = defender.name || 'you';

  let message;
  if (killed) {
    message = `${atkName} ${attacker.name ? 'kills' : 'kill'} ${defName} for ${actualDamage} damage!`;
  } else {
    message = `${atkName} ${attacker.name ? 'hits' : 'hit'} ${defName} for ${actualDamage} damage.`;
  }

  return { damage: actualDamage, killed, message };
}
