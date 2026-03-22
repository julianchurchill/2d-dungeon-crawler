/**
 * Pure combat resolution functions — no Phaser dependencies.
 * GameScene calls these and handles visual effects.
 */

/**
 * Resolve a melee attack, applying any on-hit skill effects from the attacker's
 * skill system if one is present.
 *
 * @param {object}  attacker                         - has .attackPower or .stats.attack; optionally .skillSystem
 * @param {object}  defender                         - has .takeDamage(), .isDead(), .name
 * @param {object}  rng                              - RNG for variance roll
 * @param {object}  [options]
 * @param {boolean} [options.defenderIsInvincible]   - When true the defender takes 0 damage (dev mode).
 * @returns {{ damage: number, killed: boolean, messages: string[] }}
 */
export function resolveMeleeAttack(attacker, defender, rng, { defenderIsInvincible = false } = {}) {
  const atkPower = attacker.attackPower ?? attacker.stats.attack;
  const variance = rng.nextInt(-2, 2);
  let attackDamage = Math.max(1, atkPower + variance);

  // Apply on-hit skill effects (e.g. Lucky Strike) from the attacker's skill system.
  const messages = [];
  const skillSystem = attacker.skillSystem ?? null;
  if (skillSystem) {
    const skillResult = skillSystem.applyOnHitSkills(attackDamage);
    attackDamage = skillResult.damage;
    messages.push(...skillResult.messages);
  }

  // When the defender is invincible, skip takeDamage entirely so the
  // entity's minimum-1-damage floor does not apply.
  const actualDamage = defenderIsInvincible ? 0 : defender.takeDamage(attackDamage);
  const killed = defender.isDead();

  const atkName = attacker.name || 'You';
  const defName = defender.name || 'you';

  // Combat message is always last — skill trigger messages (e.g. "Lucky Strike!") precede it
  // so the sequence reads naturally: cause first, then outcome.
  if (killed) {
    messages.push(`${atkName} ${attacker.name ? 'kills' : 'kill'} ${defName} for ${actualDamage} damage!`);
  } else {
    messages.push(`${atkName} ${attacker.name ? 'hits' : 'hit'} ${defName} for ${actualDamage} damage.`);
  }

  return { damage: actualDamage, killed, messages };
}
