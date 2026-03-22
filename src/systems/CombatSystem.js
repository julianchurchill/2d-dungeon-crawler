/**
 * Pure combat resolution functions — no Phaser dependencies.
 * GameScene calls these and handles visual effects.
 */

/**
 * Resolve a melee attack, optionally applying skill effects from the attacker's skill system.
 *
 * @param {object}      attacker    - has .attackPower or .stats.attack
 * @param {object}      defender    - has .takeDamage(), .isDead(), .name
 * @param {object}      rng         - RNG for variance roll
 * @param {object|null} skillSystem - Optional SkillSystem; if provided its on-hit effects are applied.
 * @returns {{ damage: number, killed: boolean, message: string, skillMessages: string[] }}
 */
export function resolveMeleeAttack(attacker, defender, rng, skillSystem = null) {
  const atkPower = attacker.attackPower ?? attacker.stats.attack;
  const variance = rng.nextInt(-2, 2);
  let attackDamage = Math.max(1, atkPower + variance);

  // Apply on-hit skill effects (e.g. Lucky Strike) before the defender absorbs the blow.
  const skillMessages = [];
  if (skillSystem) {
    const skillResult = skillSystem.applyOnHitSkills(attackDamage);
    attackDamage = skillResult.damage;
    skillMessages.push(...skillResult.messages);
  }

  const actualDamage = defender.takeDamage(attackDamage);
  const killed = defender.isDead();

  const atkName = attacker.name || 'You';
  const defName = defender.name || 'you';

  let message;
  if (killed) {
    message = `${atkName} ${attacker.name ? 'kills' : 'kill'} ${defName} for ${actualDamage} damage!`;
  } else {
    message = `${atkName} ${attacker.name ? 'hits' : 'hit'} ${defName} for ${actualDamage} damage.`;
  }

  return { damage: actualDamage, killed, message, skillMessages };
}
