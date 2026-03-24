import { ENEMY_DEFS } from './EnemyTypes.js';

export class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    const def = ENEMY_DEFS[type];
    this.name = def.name;
    this.stats = {
      hp: def.hp,
      maxHp: def.hp,
      attack: def.attack,
      defense: def.defense,
    };
    this.xp = def.xp;
    this.aggroRange = def.aggroRange;
    this.textureKey = def.textureKey;
    this.teleportChance = def.teleportChance ?? 0;
    this.teleportRange = def.teleportRange ?? 0;
    this.sprite = null; // set by GameScene
    this.id = `${type}_${x}_${y}_${Math.random().toString(36).slice(2, 7)}`;
  }

  isDead() {
    return this.stats.hp <= 0;
  }

  takeDamage(amount) {
    const actual = Math.max(1, amount - this.stats.defense);
    this.stats.hp = Math.max(0, this.stats.hp - actual);
    return actual;
  }

  /**
   * Decide what to do this turn.
   * @param {Player} player
   * @param {DungeonMap} map
   * @param {function} getEntityAt - (x, y) => entity
   * @param {object} rng
   * @returns {{ action: 'idle'|'move'|'attack'|'teleport', dx?: number, dy?: number, x?: number, y?: number, target?: entity }}
   */
  takeTurn(player, map, getEntityAt, rng) {
    const distToPlayer = Math.abs(this.x - player.x) + Math.abs(this.y - player.y);

    // Check if adjacent to player
    if (distToPlayer === 1) {
      return { action: 'attack', target: player };
    }

    // Teleport chance — substitutes for normal movement when it fires
    if (this.teleportChance > 0 && rng.next() < this.teleportChance) {
      const teleport = this._tryTeleport(map, getEntityAt, rng);
      if (teleport) return teleport;
    }

    // If player is within aggro range, move toward them
    if (distToPlayer <= this.aggroRange) {
      const move = this._moveToward(player.x, player.y, map, getEntityAt);
      if (move) return { action: 'move', dx: move.dx, dy: move.dy };
    }

    // Random wander (25% chance)
    if (rng.nextBool(0.25)) {
      const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
      const shuffled = dirs.sort(() => rng.next() - 0.5);
      for (const { dx, dy } of shuffled) {
        const nx = this.x + dx;
        const ny = this.y + dy;
        if (map.isWalkable(nx, ny) && !getEntityAt(nx, ny)) {
          return { action: 'move', dx, dy };
        }
      }
    }

    return { action: 'idle' };
  }

  /**
   * Attempt to teleport to a random walkable tile within {@link teleportRange}.
   * Collects all candidate positions within Manhattan distance teleportRange,
   * shuffles them, and returns the first unoccupied walkable one.
   *
   * @param {DungeonMap} map
   * @param {function} getEntityAt
   * @param {object} rng
   * @returns {{ action: 'teleport', x: number, y: number }|null}
   */
  _tryTeleport(map, getEntityAt, rng) {
    const candidates = [];
    for (let dx = -this.teleportRange; dx <= this.teleportRange; dx++) {
      for (let dy = -this.teleportRange; dy <= this.teleportRange; dy++) {
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist === 0 || dist > this.teleportRange) continue;
        candidates.push({ x: this.x + dx, y: this.y + dy });
      }
    }
    candidates.sort(() => rng.next() - 0.5);
    for (const { x, y } of candidates) {
      if (map.isWalkable(x, y) && !getEntityAt(x, y)) {
        return { action: 'teleport', x, y };
      }
    }
    return null;
  }

  _moveToward(targetX, targetY, map, getEntityAt) {
    const dx = Math.sign(targetX - this.x);
    const dy = Math.sign(targetY - this.y);

    // Prefer the axis with greater distance
    const distX = Math.abs(targetX - this.x);
    const distY = Math.abs(targetY - this.y);

    const candidates = [];
    if (distX >= distY) {
      candidates.push({ dx, dy: 0 }, { dx: 0, dy }, { dx, dy });
    } else {
      candidates.push({ dx: 0, dy }, { dx, dy: 0 }, { dx, dy });
    }

    for (const move of candidates) {
      if (move.dx === 0 && move.dy === 0) continue;
      const nx = this.x + move.dx;
      const ny = this.y + move.dy;
      if (map.isWalkable(nx, ny) && !getEntityAt(nx, ny)) {
        return move;
      }
    }
    return null;
  }
}
