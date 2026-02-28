import { DungeonMap } from './DungeonMap.js';
import { TILE } from '../utils/TileTypes.js';

const MAP_WIDTH = 80;
const MAP_HEIGHT = 60;
const MIN_NODE_SIZE = 12;
const MIN_ROOM_SIZE = 6;
const MAX_ROOM_SIZE = 14;

class BSPNode {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.left = null;
    this.right = null;
    this.room = null; // { x, y, w, h, cx, cy }
  }

  isLeaf() {
    return this.left === null && this.right === null;
  }

  split(rng) {
    if (this.w < MIN_NODE_SIZE * 2 && this.h < MIN_NODE_SIZE * 2) return false;

    // Choose direction based on aspect ratio
    let splitH;
    if (this.w / this.h > 1.25) {
      splitH = false;
    } else if (this.h / this.w > 1.25) {
      splitH = true;
    } else {
      splitH = rng.nextBool();
    }

    if (splitH && this.h < MIN_NODE_SIZE * 2) splitH = false;
    if (!splitH && this.w < MIN_NODE_SIZE * 2) splitH = true;

    const ratio = rng.next() * 0.3 + 0.35; // 0.35–0.65

    if (splitH) {
      const splitAt = Math.floor(this.h * ratio);
      if (splitAt < MIN_NODE_SIZE || this.h - splitAt < MIN_NODE_SIZE) return false;
      this.left  = new BSPNode(this.x, this.y, this.w, splitAt);
      this.right = new BSPNode(this.x, this.y + splitAt, this.w, this.h - splitAt);
    } else {
      const splitAt = Math.floor(this.w * ratio);
      if (splitAt < MIN_NODE_SIZE || this.w - splitAt < MIN_NODE_SIZE) return false;
      this.left  = new BSPNode(this.x, this.y, splitAt, this.h);
      this.right = new BSPNode(this.x + splitAt, this.y, this.w - splitAt, this.h);
    }

    return true;
  }

  splitAll(rng, depth = 0) {
    if (depth > 8) return;
    if (this.split(rng)) {
      this.left.splitAll(rng, depth + 1);
      this.right.splitAll(rng, depth + 1);
    }
  }

  placeRoom(rng) {
    if (!this.isLeaf()) return;
    const maxW = Math.min(MAX_ROOM_SIZE, this.w - 2);
    const maxH = Math.min(MAX_ROOM_SIZE, this.h - 2);
    const roomW = rng.nextInt(MIN_ROOM_SIZE, Math.max(MIN_ROOM_SIZE, maxW));
    const roomH = rng.nextInt(MIN_ROOM_SIZE, Math.max(MIN_ROOM_SIZE, maxH));
    const padX = Math.max(1, this.w - roomW - 1);
    const padY = Math.max(1, this.h - roomH - 1);
    const roomX = this.x + rng.nextInt(1, padX);
    const roomY = this.y + rng.nextInt(1, padY);
    this.room = {
      x: roomX, y: roomY, w: roomW, h: roomH,
      cx: Math.floor(roomX + roomW / 2),
      cy: Math.floor(roomY + roomH / 2),
    };
  }

  getRoom() {
    if (this.isLeaf()) return this.room;
    const l = this.left?.getRoom();
    const r = this.right?.getRoom();
    return l || r;
  }

  collectRooms(out = []) {
    if (this.isLeaf()) {
      if (this.room) out.push(this.room);
    } else {
      this.left?.collectRooms(out);
      this.right?.collectRooms(out);
    }
    return out;
  }

  connectChildren(map) {
    if (this.isLeaf()) return;
    this.left?.connectChildren(map);
    this.right?.connectChildren(map);
    const lRoom = this.left?.getRoom();
    const rRoom = this.right?.getRoom();
    if (lRoom && rRoom) {
      map.carveHCorridor(lRoom.cx, rRoom.cx, lRoom.cy);
      map.carveVCorridor(lRoom.cy, rRoom.cy, rRoom.cx);
    }
  }
}

export class BSPDungeonGenerator {
  /**
   * @param {object} rng - Seeded RNG instance from createRNG()
   * @returns {{ map: DungeonMap, rooms: Array, startPos: {x,y}, stairsPos: {x,y} }}
   */
  generate(rng) {
    const map = new DungeonMap(MAP_WIDTH, MAP_HEIGHT);

    const root = new BSPNode(1, 1, MAP_WIDTH - 2, MAP_HEIGHT - 2);
    root.splitAll(rng);

    this._placeRoomsInLeaves(root, rng);

    const rooms = root.collectRooms();
    for (const room of rooms) {
      map.carveRoom(room.x, room.y, room.w, room.h);
    }

    root.connectChildren(map);
    map.buildWalls();

    // Place stairs in room farthest from start (Manhattan distance)
    const startRoom = rooms[0];
    let farthestRoom = rooms[0];
    let maxDist = 0;
    for (const room of rooms) {
      const dist = Math.abs(room.cx - startRoom.cx) + Math.abs(room.cy - startRoom.cy);
      if (dist > maxDist) {
        maxDist = dist;
        farthestRoom = room;
      }
    }
    map.setTile(farthestRoom.cx, farthestRoom.cy, TILE.STAIRS_DOWN);

    return {
      map,
      rooms,
      startPos: { x: startRoom.cx, y: startRoom.cy },
      stairsPos: { x: farthestRoom.cx, y: farthestRoom.cy },
    };
  }

  _placeRoomsInLeaves(node, rng) {
    if (node.isLeaf()) {
      node.placeRoom(rng);
    } else {
      if (node.left) this._placeRoomsInLeaves(node.left, rng);
      if (node.right) this._placeRoomsInLeaves(node.right, rng);
    }
  }
}

export { MAP_WIDTH, MAP_HEIGHT };
