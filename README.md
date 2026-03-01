# 2D Game

## Summary

Created using Claude Code - initial request "Create a 2D web browser dungeon crawler game with randomly generated levels, responsive on mobile".

## Building and Running

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (included with Node.js)

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

Opens a local dev server (default: `http://localhost:5173`) with hot module reload.

### Build for production

```bash
npm run build
```

Output is written to the `dist/` folder.

### Preview the production build

```bash
npm run preview
```

Serves the `dist/` folder locally so you can verify the production build before deployment.

## Frameworks

| Framework                       | Version | Purpose                                             |
|---------------------------------|---------|-----------------------------------------------------|
| [Phaser 3](https://phaser.io/)  | ^3.60   | 2D game framework — rendering, input, scenes, audio |
| [Vite](https://vitejs.dev/)     | ^4.5    | Build tool and dev server with fast HMR             |

No other runtime dependencies are used. All game assets (tiles, sprites, UI elements) are generated procedurally in code at startup — no external image files are required.

## Key Design Choices

### Binary Space Partitioning (BSP) level generation

Dungeons are generated using a BSP tree that recursively splits the map into rooms, then connects them with L-shaped corridors. Each floor is seeded deterministically (`floor * 31337 + 12345`), so a given floor number always produces the same layout.

### Raycasting field of view

Each turn the game casts rays from the player outward (radius 8 tiles) using Bresenham's line algorithm. Tiles have three states: *unexplored*, *explored* (seen before, drawn dark), and *visible* (fully lit). Walls block sight but are themselves visible.

### Scene-based architecture

Phaser's multi-scene system is used to keep concerns separate:

- **BootScene** — generates all textures procedurally
- **MainMenuScene** — title/start screen
- **GameScene** — gameplay, map, entities, input
- **UIScene** — HUD, inventory, and message log overlay

Scenes communicate exclusively through an **EventBus** (a shared Phaser EventEmitter singleton), keeping them decoupled.

### Strict turn state machine

A `TurnManager` enforces a simple state machine: `PLAYER_INPUT → PLAYER_ACTING → ENEMY_ACTING → back to PLAYER_INPUT`. Only one actor can be active at a time, preventing race conditions in the turn loop.

### Data-driven enemies and items

Enemy and item definitions live in plain data tables (`EnemyTypes.js`, `ItemTypes.js`). Adding a new enemy or item type only requires an entry in the relevant table — no new classes needed.

### Rendering: static map + dynamic shadow layer

The map tileset is rendered once into a `RenderTexture` when a floor loads. A separate `Graphics` layer is redrawn only when FOV changes, painting dark overlays over unexplored/explored tiles. Entities are individual sprites layered on top. This minimises per-frame redraw work.

### Procedural textures

All visual assets — tiles, characters, items — are drawn with Phaser's `Graphics` API at boot time. This keeps the project free of external image assets and makes visual tweaks straightforward.

## Dev Containers

To enable Claude (and yourself) to push to GitHub from the dev container add a `GH_TOKEN=xxx` line into .devcontainer/.env.devcontainer with `xxx` as your GitHub access token for accessing this repository. New tokens can be created here <https://github.com/settings/personal-access-tokens/new>.

### Troubleshooting

If containers are not rebuilding after changing devcontainer.json, Dockerfile, init-firewall.sh or any other dependencies choose 'Dev Containers: Rebuild Without Cache and Reopen in Container' instead of 'Dev Containers: Rebuild and Reopen in Container' as the latter uses a cache when building the container images which can sometimes miss your changes.

If this doesn't work then try running `docker buildx prune` from a terminal to forcefully clear out the docker build cache.

## TODO

### Bugs

- Inventory window does not change the currently equipped weapon/armour name when clicked (it does change the equipped state, just not the text)

### General

- Add an automated acceptance test suite
  - test specfications should be in plain English
  - tests should be seeded with the current capabilities of the game
  - add a CLAUDE.md file which includes a requirement that the automated acceptance tests should be run whenever making a change to the application code to ensure existing features are not broken
- music
- bosses - unique (once per run) and repeatable (champions?)
- remote deployment/hosting for app
- stats - deepest level reached, monster types kill count, unique bosses kill count
- achievements - hide achievements until completed, hints. Examples 'Burrower - reached level 10' (hint 'reach level 10'), with some more cryptic: achievement 'Hoarder - gained 100g' (hint 'what would Smaug do?')

### Inventory

- arrow keys to move around inventory (no mouse)
- show details of inventory item when highlighted

### UI

- mobile controls on mobile only
- map - press 'm'

### Enemies

- enemy health - perhaps a health bar
- enemy types

### Character

- hold keys for continued movement
- compressed movement - if nothing new then SHIFT-direction keeps going until an obstacle is hit
- character graphic
- detailed status
- xp bar - make it clearer that it is an XP bar

### Saving

- save between sessions
- multiple save slots
- cloud save (Google?)

## References

- <https://code.claude.com/docs/en/devcontainer>
- <https://nakamasato.medium.com/using-claude-code-safely-with-dev-containers-b46b8fedbca9>
- <https://github.com/anthropics/claude-code/issues/15611>
