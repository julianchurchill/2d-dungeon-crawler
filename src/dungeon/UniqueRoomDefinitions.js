/**
 * @module UniqueRoomDefinitions
 * @description Definitions for unique named rooms that can appear once per game
 * on normal dungeon floors.  Each definition describes the room's name,
 * discovery message, minimum floor, spawn chance, guaranteed items, optional
 * enemies, and an optional NPC.
 *
 * @typedef {object} UniqueRoomDef
 * @property {string}   id           - Unique identifier used by UniqueRoomRegistry.
 * @property {string}   name         - Display name shown in the discovery message.
 * @property {string}   entryMessage - Flavour text emitted when the floor is entered.
 * @property {number}   minFloor     - Earliest dungeon floor on which this room can appear.
 * @property {number}   chance       - Probability [0,1] that the room spawns on an eligible floor.
 * @property {string}   floorKey     - Base tile key for the room's floor texture (tileset prefix
 *   is applied at render time via TilesetManager).
 * @property {string}   wallKey      - Base tile key for the room's wall texture.
 * @property {{ tileType: string, placement: string, count?: number, spacing?: number }} [decorations]
 *   Optional decoration tiles to place inside the room.  `tileType` names a key in TILE
 *   (e.g. 'WEAPON_MOUNT').  `placement` is 'inner_corners' (one at each inner corner) or
 *   'edge_rows' (regular spacing along all inner edges).
 * @property {string[]} items        - ITEM_TYPES keys guaranteed to spawn inside the room.
 * @property {Array<{type:string, isChampion?:boolean}>} [enemies]
 *   Enemy spawn specs placed inside the room.
 * @property {{ name:string, spriteKey:string, lines:string[] } | null} [npc]
 *   Optional NPC to place in the room.
 */

/** @type {UniqueRoomDef[]} */
export const UNIQUE_ROOM_DEFS = [
  {
    id: 'dark_armoury',
    name: 'The Dark Armoury',
    entryMessage: 'You discover a hidden armoury — ancient weapons line the walls.',
    minFloor: 8,
    chance: 0.12,
    // Blackened iron and rust — themed floor and wall tiles distinguish this room visually.
    floorKey: 'tile_floor_dark_armoury',
    wallKey:  'tile_wall_dark_armoury',
    // Four weapon mounts placed at the inner corners give the room its armoury feel.
    decorations: { tileType: 'WEAPON_MOUNT', placement: 'inner_corners' },
    // Contains the Null Scimitar and Night Cloak — unique items found nowhere else.
    items: ['NULL_SCIMITAR', 'NIGHT_CLOAK'],
    // A champion troll guards the armoury.
    enemies: [{ type: 'troll', isChampion: true }],
  },
  {
    id: 'darker_way',
    name: 'The Darker Way',
    entryMessage: 'A cold silence fills this passage — someone has been here a long time.',
    minFloor: 10,
    chance: 0.12,
    prerequisites: ['necropolis_library'],
    // Deep void-stone floor and shadow-cracked walls — heavier and darker than the armoury.
    floorKey: 'tile_floor_darker_way',
    wallKey:  'tile_wall_darker_way',
    items: [],
    enemies: [],
    // Martel the Varangian — a soldier who wandered too deep and never found his way out.
    npc: {
      name: 'Martel the Varangian',
      spriteKey: 'entity_npc_warrior',
      lines: [
        'You… you found me. I have been lost here for years.',
        'There is a sealed chamber beyond that locked door. I have never been able to open it.',
        'The Archivist upstairs spoke of a key — The Key to Elsewhere. That must be what opens it.',
        'Whatever lies inside… I no longer have the strength to claim it. Take it. Just get out of here alive.',
      ],
    },
    // A locked alcove seals the Eclipse Blade and The Key to Beyond behind a door
    // that only yields to The Key to Elsewhere.
    lockedRoom: {
      keyId: 'key_to_elsewhere',
      items: ['ECLIPSE_BLADE', 'KEY_TO_BEYOND'],
    },
  },
  {
    id: 'necropolis_library',
    name: 'The Necropolis Library',
    entryMessage: 'A dusty library of forgotten lore… the air hums with old magic.',
    minFloor: 5,
    chance: 0.12,
    // Obsidian floor with arcane rune glow — themed tiles distinguish the library.
    floorKey: 'tile_floor_necropolis_library',
    wallKey:  'tile_wall_necropolis_library',
    // Bookcases line the inner edges at regular spacing, creating a library feel.
    decorations: { tileType: 'BOOKCASE', placement: 'edge_rows', spacing: 3 },
    // Shelves stocked with restorative potions and a mysterious key of unknown purpose.
    items: ['MEGA_POTION', 'MEGA_POTION', 'KEY_TO_ELSEWHERE'],
    enemies: [],
    // An Archivist NPC offers cryptic lore about the deeper dungeon.
    npc: {
      name: 'Archivist',
      spriteKey: 'entity_npc_elder',
      lines: [
        'Curious visitor… these texts speak of the deeper evils below.',
        'The dungeon runs far deeper than most dare explore.',
        'Take whatever you need. Knowledge is the only treasure worth keeping.',
      ],
    },
  },
];
