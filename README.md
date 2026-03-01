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

## Testing

The game has an automated acceptance test suite written in [Gherkin](https://cucumber.io/docs/gherkin/) (plain English) and run with [Cucumber.js](https://github.com/cucumber/cucumber-js). Tests cover the core game logic: combat, player movement, inventory, character progression, dungeon generation, field of view, and turn management.

### Run tests

```bash
npm test                  # compact progress bar
npm run test:pretty       # full step-by-step output
npm run test:html         # generate cucumber-report.html
```

### Test structure

```text
features/
  combat.feature                    # attack resolution, kills, minimum damage
  player-movement.feature           # movement, walls, combat triggers, stairs
  inventory.feature                 # pickup, use potions, equip weapons/armor, drop
  character-progression.feature     # XP gain, levelling up, stat increases
  dungeon-generation.feature        # BSP generation, determinism, connectivity
  fov.feature                       # visibility radius, line of sight, explored state
  turn-management.feature           # turn state machine transitions
  step-definitions/                 # step implementations (one file per feature)
  support/
    world.js                        # shared state between Gherkin steps
    phaser-loader.mjs               # ESM hook: replaces Phaser with a Node.js mock
    mocks/phaser.mjs                # minimal Phaser stub for the test environment
```

### How it works

The game's core logic (`src/systems/`, `src/entities/`, `src/dungeon/`, `src/fov/`) is pure JavaScript with no browser dependencies, so it runs directly in Node.js. The only exception is `EventBus`, which wraps a Phaser class. A custom ESM loader hook intercepts the `phaser` import at test time and substitutes a lightweight Node.js `EventEmitter` mock, so no browser or canvas is needed to run the tests.

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

- consider making Claude work in feature branches using git worktrees and requiring changes are never made directly on main to ensure multiple contributors can work safely in parallel
- consider adding unit tests and a TDD requirement for Claude
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
