/**
 * Mulberry32 — fast seedable 32-bit PRNG.
 * Returns an RNG object with next() and nextInt(min, max) methods.
 */
export function createRNG(seed = Date.now()) {
  let s = seed >>> 0;

  return {
    next() {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    nextInt(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    nextBool(chance = 0.5) {
      return this.next() < chance;
    },
    pick(arr) {
      return arr[this.nextInt(0, arr.length - 1)];
    },
  };
}
