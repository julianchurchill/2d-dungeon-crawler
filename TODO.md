# TODO

## Bugs

- [x] Inventory window does not change the currently equipped weapon/armour name when clicked (it does change the equipped state, just not the text)

## General

- [ ] music
- [ ] bosses - unique (once per run) and repeatable (champions?)
- [ ] remote deployment/hosting for app
- [ ] stats - deepest level reached, monster types kill count, unique bosses kill count
- [ ] achievements - hide achievements until completed, hints. Examples 'Burrower - reached level 10' (hint 'reach level 10'), with some more cryptic: achievement 'Hoarder - gained 100g' (hint 'what would Smaug do?')
- [x] display and maintain an application version number following semantic versioning and include the git commit hash for the built application
- [x] deployment to GitHub Pages

## Inventory

- [ ] show details of inventory item when highlighted
- [ ] drop items
- [ ] destroy items
- [x] arrow keys to move around inventory (no mouse)

## UI

- [ ] allow arrows and WASD keys to navigate menus and ENTER/SPACE to select buttons
- [ ] map - press 'm'
- [x] mobile controls on mobile only
- [x] screen effect when you level up during the game

## Enemies

- [ ] enemy health - perhaps a health bar
- [ ] enemy types
- [ ] associate enemies with a chance of appearing based on the dungeon level. Record that against their enemy stats as their level. This can then be used for Hall of Legends information when players die for the highest level enemy they have defeated.
- [ ] have an optional max dungeon level below which enemies will appear

## Character

- [ ] increase defense when a character levels up
- [ ] character graphic
- [ ] show a character sheet by pressing 'c' which shows all the players stats currently
- [ ] xp bar - make it clearer that it is an XP bar
- [x] hold keys for continued movement
- [x] run movement - SHIFT+direction keeps going until an obstacle or visible enemy/item stops them

## Character Skills

- [ ] a character can have passive skills that have dynamic effects. These can be viewed by pressing 'k'. Initially the character has one placeholder skill of 'Lucky Strike' which gives a 1% chance for the character to gain 50% damage on a hit during combat.
- [ ] on level up there is a chance the character can gain a special skill

## Saving

- [ ] save between sessions
- [ ] multiple save slots
- [ ] cloud save (Google?)

## Hall of Legends

- [ ] add a Hall of Legends from the main screen where players can view the stats and game record for previous runs where they have died
- [ ] Hall of Legends should show the previous runs as an ordered table based on a field the player can select which defaults to deepest dungeon level reached. Other options for ordering could be xp, character level, highest level enemy defeated.

## Developer

- [x] add a developer options screen accessible from the main menu that allows:
  - [x] set start character level
  - [x] set start dungeon level
  - [x] when the player starts the game the settings from the developer options are immediately applied. When the level is set the the character is leveled up to match the value specified
- [x] allow inventory contents to be set via developer options

## Other

- [x] Add to README: instructions on building and running the app
- [x] Add to README: information about the chosen frameworks
- [x] Add to README: information about key design choices
- [x] Add an automated acceptance test suite with plain English specifications seeded with current game capabilities
- [x] Add a CLAUDE.md requiring tests to be run whenever application code changes
- [x] Rename `master` branch to `main`
- [x] Make Claude work on feature branches — branching guidelines added to CLAUDE.md
- [x] Add TDD (red-green-refactor) requirement to CLAUDE.md
- [x] Add code commenting and SOLID design principles to CLAUDE.md
