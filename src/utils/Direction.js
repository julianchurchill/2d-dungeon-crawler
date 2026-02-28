export const DIR = Object.freeze({
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
});

export const DIR_DELTA = Object.freeze({
  [DIR.UP]:    { dx: 0,  dy: -1 },
  [DIR.DOWN]:  { dx: 0,  dy: 1  },
  [DIR.LEFT]:  { dx: -1, dy: 0  },
  [DIR.RIGHT]: { dx: 1,  dy: 0  },
});
