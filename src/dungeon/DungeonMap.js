import { TILE, FOV_STATE } from '../utils/TileTypes.js';

export class DungeonMap {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = new Uint8Array(width * height).fill(TILE.EMPTY);
    this.fovState = new Uint8Array(width * height).fill(FOV_STATE.UNEXPLORED);
    // Entity refs for collision lookup (set/cleared by GameScene)
    this._entities = new Map(); // key: "x,y" -> entity object
  }

  _idx(x, y) {
    return y * this.width + x;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  getTile(x, y) {
    if (!this.inBounds(x, y)) return TILE.EMPTY;
    return this.tiles[this._idx(x, y)];
  }

  setTile(x, y, type) {
    if (!this.inBounds(x, y)) return;
    this.tiles[this._idx(x, y)] = type;
  }

  isWalkable(x, y) {
    const t = this.getTile(x, y);
    return t === TILE.FLOOR || t === TILE.DOOR || t === TILE.STAIRS_DOWN;
  }

  isOpaque(x, y) {
    const t = this.getTile(x, y);
    return t === TILE.WALL || t === TILE.EMPTY;
  }

  getFovState(x, y) {
    if (!this.inBounds(x, y)) return FOV_STATE.UNEXPLORED;
    return this.fovState[this._idx(x, y)];
  }

  setFovState(x, y, state) {
    if (!this.inBounds(x, y)) return;
    this.fovState[this._idx(x, y)] = state;
  }

  // Entity occupancy tracking
  setEntity(x, y, entity) {
    if (entity === null) {
      this._entities.delete(`${x},${y}`);
    } else {
      this._entities.set(`${x},${y}`, entity);
    }
  }

  getEntity(x, y) {
    return this._entities.get(`${x},${y}`) || null;
  }

  // Carve a rectangular region as floor
  carveRoom(x, y, w, h) {
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        this.setTile(col, row, TILE.FLOOR);
      }
    }
  }

  // Carve a horizontal corridor
  carveHCorridor(x1, x2, y) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
      this.setTile(x, y, TILE.FLOOR);
    }
  }

  // Carve a vertical corridor
  carveVCorridor(y1, y2, x) {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y++) {
      this.setTile(x, y, TILE.FLOOR);
    }
  }

  // Add walls around all floor/door tiles
  buildWalls() {
    const dirs = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.getTile(x, y) === TILE.EMPTY) {
          for (const [dx, dy] of dirs) {
            const t = this.getTile(x + dx, y + dy);
            if (t === TILE.FLOOR || t === TILE.DOOR || t === TILE.STAIRS_DOWN) {
              this.setTile(x, y, TILE.WALL);
              break;
            }
          }
        }
      }
    }
  }

  // Debug: print ASCII representation to console
  toAscii() {
    const chars = { [TILE.EMPTY]: ' ', [TILE.FLOOR]: '.', [TILE.WALL]: '#', [TILE.DOOR]: '+', [TILE.STAIRS_DOWN]: '>' };
    let out = '';
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        out += chars[this.getTile(x, y)] || '?';
      }
      out += '\n';
    }
    return out;
  }
}
