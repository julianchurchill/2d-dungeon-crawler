/**
 * Field of View using Bresenham raycasting.
 * For each tile within radius, trace a ray from origin.
 * Simple, correct, and efficient for radius ≤ 10.
 *
 * @param {number} originX
 * @param {number} originY
 * @param {number} radius
 * @param {function} isOpaque  - (x, y) => boolean
 * @param {function} markVisible - (x, y) => void
 */
export function computeFOV(originX, originY, radius, isOpaque, markVisible) {
  markVisible(originX, originY);

  const r2 = radius * radius;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const tx = originX + dx;
      const ty = originY + dy;
      if (_hasLoS(originX, originY, tx, ty, isOpaque)) {
        markVisible(tx, ty);
      }
    }
  }
}

/**
 * Daylight FOV — marks every non-opaque tile within the given bounds as visible.
 * No radius limit or origin is used; this simulates open-sky daylight where all
 * accessible tiles are fully lit regardless of the player's position.
 * Opaque tiles (e.g. walls) are never marked visible.
 *
 * @param {number}   width       - Map width in tiles.
 * @param {number}   height      - Map height in tiles.
 * @param {function} isOpaque    - (x, y) => boolean
 * @param {function} markVisible - (x, y) => void
 */
export function computeDaylightFOV(width, height, isOpaque, markVisible) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isOpaque(x, y)) {
        markVisible(x, y);
      }
    }
  }
}

/**
 * Bresenham line-of-sight check from (sx,sy) to (ex,ey).
 * Walls block sight; the wall itself is visible (you can see a wall
 * that is blocking you).
 */
function _hasLoS(sx, sy, ex, ey, isOpaque) {
  let x = sx;
  let y = sy;
  const adx = Math.abs(ex - sx);
  const ady = Math.abs(ey - sy);
  const stepX = ex > sx ? 1 : -1;
  const stepY = ey > sy ? 1 : -1;
  let err = adx - ady;

  while (true) {
    // If we're not at origin and not at destination, check if blocked
    if ((x !== sx || y !== sy) && (x !== ex || y !== ey)) {
      if (isOpaque(x, y)) return false;
    }

    if (x === ex && y === ey) break;

    const e2 = 2 * err;
    if (e2 > -ady) { err -= ady; x += stepX; }
    if (e2 <  adx) { err += adx; y += stepY; }
  }

  return true;
}
