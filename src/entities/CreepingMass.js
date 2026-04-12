/**
 * @module CreepingMass
 * @description A multi-tile enemy composed of 3–5 connected segments.
 * Each segment occupies one dungeon tile. On each turn the mass moves by
 * removing a removable outer segment and placing it on a free adjacent tile,
 * slithering toward the player. HP is proportional to segment count; segments
 * are lost as the mass is damaged.
 */

/** HP awarded to the player per segment of the mass. */
export const HP_PER_SEGMENT = 10;

export class CreepingMass {
  /**
   * @param {Array<{x: number, y: number}>} segments - Initial connected segment positions.
   */
  constructor(segments) {
    this.type = 'creeping_mass';
    this.name = 'Creeping Mass';
    this.textureKey = 'entity_creeping_mass';
    this.aggroRange = 5;
    this.xp = 60;

    /**
     * Each entry holds `{x, y, sprite}` for one tile of the mass.
     * @type {Array<{x: number, y: number, sprite: object|null}>}
     */
    this.segments = segments.map(s => ({ x: s.x, y: s.y, sprite: null }));
    this._initialSegmentCount = segments.length;

    const totalHp = segments.length * HP_PER_SEGMENT;
    this.stats = {
      hp: totalHp,
      maxHp: totalHp,
      attack: 6,
      defense: 1,
    };

    // Expose x, y and sprite from the head segment for systems that expect
    // single-tile enemy coordinates (bump animation, FOV flash, etc.).
    this.x = this.segments[0].x;
    this.y = this.segments[0].y;
    this.sprite = null; // set to segments[0].sprite after sprites are created

    /**
     * Segments removed from the mass this turn due to damage.
     * GameScene reads this list after combat to destroy their sprites and clear
     * their tiles from the dungeon entity map.
     * @type {Array<{x: number, y: number, sprite: object|null}>}
     */
    this.pendingRemovedSegments = [];

    this.id = `creeping_mass_${segments[0].x}_${segments[0].y}_${Math.random().toString(36).slice(2, 7)}`;
  }

  /** @returns {boolean} True when the mass has no hp or no segments remaining. */
  isDead() {
    return this.stats.hp <= 0 || this.segments.length === 0;
  }

  /**
   * Reduces hp by `amount` minus defense (minimum 1).  Segment count is then
   * synchronised with remaining hp and any removed segments are pushed onto
   * `pendingRemovedSegments` for the caller to clean up visually.
   *
   * @param {number} amount - Incoming raw damage.
   * @returns {number} Actual damage dealt.
   */
  takeDamage(amount) {
    const actual = Math.max(1, amount - this.stats.defense);
    this.stats.hp = Math.max(0, this.stats.hp - actual);
    this.pendingRemovedSegments = [];
    this._syncSegments();
    return actual;
  }

  /**
   * Decide the mass's action for this turn.
   *
   * @param {object} player          - The player entity (`{x, y}`).
   * @param {object} map             - Dungeon map with `isWalkable(x, y)`.
   * @param {function} getEntityAt   - `(x, y) => entity|null`
   * @param {object} rng             - RNG (`next()`, `nextBool()`, `pick()`).
   * @returns {{ action: string, target?: object, removeSegment?: {x,y}, addSegment?: {x,y} }}
   */
  takeTurn(player, map, getEntityAt, rng) {
    this.pendingRemovedSegments = [];
    if (this.segments.length === 0) return { action: 'idle' };

    // Update the head to the segment closest to the player for external systems
    // that rely on this.x / this.y (bump animation direction, etc.).
    const head = this._closestSegmentToPlayer(player);
    this.x = head.x;
    this.y = head.y;

    // Attack if any segment is orthogonally adjacent to the player
    const minDist = this._minDistToPlayer(player);
    if (minDist === 1) {
      return { action: 'attack', target: player };
    }

    // Move toward the player when within aggro range
    if (minDist <= this.aggroRange) {
      const move = this._computeCreepMove(player, map, getEntityAt);
      if (move) return { action: 'creeping_move', ...move };
    }

    return { action: 'idle' };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Synchronises segment count to the current hp value.  Outer (removable)
   * segments are removed first and pushed onto `pendingRemovedSegments`.
   */
  _syncSegments() {
    const targetCount = this.stats.hp <= 0
      ? 0
      : Math.ceil((this.stats.hp / this.stats.maxHp) * this._initialSegmentCount);

    while (this.segments.length > targetCount) {
      const outerIdx = this._findOuterSegmentIndex();
      const [removed] = this.segments.splice(outerIdx, 1);
      this.pendingRemovedSegments.push(removed);
    }

    // Keep x, y and sprite in sync with the first remaining segment.
    if (this.segments.length > 0) {
      this.x = this.segments[0].x;
      this.y = this.segments[0].y;
      this.sprite = this.segments[0].sprite;
    }
  }

  /**
   * Returns the minimum Manhattan distance between any segment and the player.
   * @param {object} player
   * @returns {number}
   */
  _minDistToPlayer(player) {
    return Math.min(
      ...this.segments.map(s => Math.abs(s.x - player.x) + Math.abs(s.y - player.y)),
    );
  }

  /**
   * Returns the segment closest to the player.
   * @param {object} player
   * @returns {{x: number, y: number, sprite: object|null}}
   */
  _closestSegmentToPlayer(player) {
    return this.segments.reduce((best, s) => {
      const d = Math.abs(s.x - player.x) + Math.abs(s.y - player.y);
      const bd = Math.abs(best.x - player.x) + Math.abs(best.y - player.y);
      return d < bd ? s : best;
    });
  }

  /**
   * Finds the index of the segment with the fewest neighbours within the mass
   * that can be removed without disconnecting the rest.  Falls back to the
   * segment with fewest neighbours if none can be removed safely.
   *
   * @returns {number} Index into `this.segments`.
   */
  _findOuterSegmentIndex() {
    // Prefer a removable outer segment (disconnection-safe)
    for (let i = 0; i < this.segments.length; i++) {
      if (this._isRemovable(i)) return i;
    }
    // Fallback: return the segment with fewest neighbours
    let minN = Infinity;
    let minIdx = 0;
    for (let i = 0; i < this.segments.length; i++) {
      const n = this._countNeighbours(i);
      if (n < minN) { minN = n; minIdx = i; }
    }
    return minIdx;
  }

  /**
   * Returns true when removing segment at `idx` leaves the rest connected.
   * @param {number} idx
   * @returns {boolean}
   */
  _isRemovable(idx) {
    if (this.segments.length <= 1) return false;
    const remaining = this.segments.filter((_, i) => i !== idx);
    return this._isConnected(remaining);
  }

  /**
   * Returns the number of same-mass neighbours the segment at `idx` has.
   * @param {number} idx
   * @returns {number}
   */
  _countNeighbours(idx) {
    const s = this.segments[idx];
    return this.segments.filter(
      (o, i) => i !== idx && Math.abs(o.x - s.x) + Math.abs(o.y - s.y) === 1,
    ).length;
  }

  /**
   * BFS connectivity check for an arbitrary array of `{x,y}` positions.
   * @param {Array<{x:number,y:number}>} segs
   * @returns {boolean}
   */
  _isConnected(segs) {
    if (segs.length <= 1) return true;
    const visited = new Set();
    const queue = [segs[0]];
    visited.add(`${segs[0].x},${segs[0].y}`);
    while (queue.length > 0) {
      const curr = queue.shift();
      for (const s of segs) {
        const key = `${s.x},${s.y}`;
        if (!visited.has(key) && Math.abs(s.x - curr.x) + Math.abs(s.y - curr.y) === 1) {
          visited.add(key);
          queue.push(s);
        }
      }
    }
    return visited.size === segs.length;
  }

  /**
   * Computes one creep-move step: which segment to remove and where to add one.
   * Prefers expansion tiles closer to the player and removes the segment
   * furthest from the player.
   *
   * @param {object}   player
   * @param {object}   map
   * @param {function} getEntityAt
   * @returns {{ removeSegment: {x,y}, addSegment: {x,y} }|null}
   */
  _computeCreepMove(player, map, getEntityAt) {
    // Candidate tiles for the new segment (adjacent to any existing segment, free)
    const selfKeys = new Set(this.segments.map(s => `${s.x},${s.y}`));
    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
    const seen = new Set();
    const candidates = [];

    for (const seg of this.segments) {
      for (const { dx, dy } of dirs) {
        const nx = seg.x + dx;
        const ny = seg.y + dy;
        const key = `${nx},${ny}`;
        if (seen.has(key) || selfKeys.has(key)) continue;
        seen.add(key);
        if (map.isWalkable(nx, ny) && !getEntityAt(nx, ny)) {
          candidates.push({ x: nx, y: ny });
        }
      }
    }

    if (candidates.length === 0) return null;

    // Pick the candidate tile closest to the player
    candidates.sort(
      (a, b) =>
        Math.abs(a.x - player.x) + Math.abs(a.y - player.y) -
        (Math.abs(b.x - player.x) + Math.abs(b.y - player.y)),
    );
    const addSegment = candidates[0];

    // Pick the removable segment furthest from the player
    const removable = this.segments.filter((_, i) => this._isRemovable(i));
    if (removable.length === 0) return null;

    const removeSegment = removable.reduce((worst, s) => {
      const sd = Math.abs(s.x - player.x) + Math.abs(s.y - player.y);
      const wd = Math.abs(worst.x - player.x) + Math.abs(worst.y - player.y);
      return sd > wd ? s : worst;
    });

    return {
      removeSegment: { x: removeSegment.x, y: removeSegment.y },
      addSegment:    { x: addSegment.x,    y: addSegment.y    },
    };
  }
}
