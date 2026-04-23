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
    // Contains the Bone Blade unique weapon and a piece of armour as guaranteed drops.
    items: ['BONE_BLADE', 'LEATHER_ARMOR'],
    // A champion orc guards the armoury.
    enemies: [{ type: 'orc', isChampion: true }],
  },
  {
    id: 'necropolis_library',
    name: 'The Necropolis Library',
    entryMessage: 'A dusty library of forgotten lore… the air hums with old magic.',
    minFloor: 5,
    chance: 0.12,
    // Shelves stocked with restorative potions.
    items: ['MEGA_POTION', 'MEGA_POTION'],
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
