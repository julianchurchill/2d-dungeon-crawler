/**
 * @module MinorTeleportation
 * @description Pure logic for the Potion of Minor Teleportation.
 *
 * Finds a random walkable, unoccupied tile that is within a Chebyshev distance
 * range from the source position.  Does not consider walls between the source
 * and destination — only the destination tile itself must be walkable.
 */

/**
 * Finds a random valid teleport destination near a given position.
 *
 * @param {number}   px          - Source x position.
 * @param {number}   py          - Source y position.
 * @param {Function} isWalkable  - `(x, y) => boolean` — true if tile can be stood on.
 * @param {Function} getEntityAt - `(x, y) => object|null` — null when tile is free.
 * @param {object}   rng         - RNG with a `next()` method returning 0–1.
 * @param {number}   minDist     - Minimum Chebyshev distance from source (inclusive).
 * @param {number}   maxDist     - Maximum Chebyshev distance from source (inclusive).
 * @returns {{ x: number, y: number } | null} A valid destination, or null if none found.
 */
export function findMinorTeleportDestination(px, py, isWalkable, getEntityAt, rng, minDist, maxDist) {
  // Collect all candidate tiles in the distance band.
  const candidates = [];
  for (let dx = -maxDist; dx <= maxDist; dx++) {
    for (let dy = -maxDist; dy <= maxDist; dy++) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy)); // Chebyshev distance
      if (dist < minDist || dist > maxDist) continue;

      const x = px + dx;
      const y = py + dy;
      if (isWalkable(x, y) && getEntityAt(x, y) === null) {
        candidates.push({ x, y });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Fisher-Yates shuffle using the injectable RNG, then return the first element.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates[0];
}
