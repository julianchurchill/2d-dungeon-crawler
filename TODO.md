# TODO

## Bugs

- [x] Inventory window does not change the currently equipped weapon/armour name when clicked (it does change the equipped state, just not the text)

## General

- [ ] music
- [ ] bosses - unique (once per run) and repeatable (champions?)
- [ ] stats - deepest level reached, monster types kill count, unique bosses kill count
- [x] display and maintain an application version number following semantic versioning and include the git commit hash for the built application
- [x] deployment to GitHub Pages

## Achievements

- [ ] some achievements unlock the availability of new permanent skills that apply to the player from then such as 'Goblin Killer' achievement unlocks 'Goblin hunting' permanent skill that gives the player an extra 10% damage against goblins
- [ ] some achievements unlock the availability of new items that can appear from then on in the game based on any other item specific conditions (e.g. only appears after level 10)
- [ ] some achievements unlock the availability of new skills that can be selected by the player from then on in the game based on any other skill specific conditions (e.g. only appears after level 10)
- [ ] 'Goblin Slayer - killed 100 goblins (n killed so far)' grants 'Goblin slaying' permanent skill of an extra 15% damage against goblins (cumulative with 'Goblin hunting').
- [ ] 'Top Nogg - killed Boss Nogg' grants 'Goblin destroyer' permanent skill of extra 25% damage against goblins (cumulative with 'Goblin hunting' and 'Goblin slaying').
- [x] when running in dev mode allow the achievements to be completed and uncompleted by a tick box that is otherwise hidden
- [x] achievements can be viewed by pressing ESCAPE to access an in game menu which shows 'Achievements'. This same screen can also be reached from the main menu before starting a game. This screen shows all achievements completed so far as well as achievements not yet completed.
- [x] achievements are events that occur as a player explores the dungeon when they achieve certain conditions, for example 'Goblin Killer - killed 10 goblins' and 'Burrower - reached level 10'. Once an achievement is completed a message appears and a clear alert is shown to the player. Each achievement can only be completed once. Achievements that require the player to reach a certain number of something should have the value so far alongside, e.g 'Goblin Killer - killed 10 goblins (4 killed so far)'.

## Inventory

- [ ] show details of inventory item when highlighted
- [ ] drop items with 'd' when in inventory. Provide a button for mobile interface.
- [ ] destroy items to get collectable materials that could be used later to create new items or enhance existing ones. Use 'D' when in inventory and provide a button for mobile interface. Protect unique items by asking the player to confirm the action.
- [x] arrow keys to move around inventory (no mouse)

## UI

- [ ] allow arrows and WASD keys to navigate menus and ENTER/SPACE to select buttons
- [ ] map - press 'm' to show and provide a button for the mobile interface
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
- [ ] show a character sheet by pressing 'c' which shows all the players stats currently. Provide a button for the mobile interface.
- [ ] xp bar - make it clearer that it is an XP bar
- [x] hold keys for continued movement
- [x] run movement - SHIFT+direction keeps going until an obstacle or visible enemy/item stops them

## Character Skills

- [ ] a character can have skills that have dynamic effects. These can be viewed by pressing 'k' or using a button on the mobile interface. Initially the character has one active skill of 'Lucky Strike' which gives a 1% chance for the character to gain 50% damage on a hit during combat and shows a message when it is triggered.
- [ ] every 5 levels the character can either choose a new skill from the pool of not activated skills to activate or upgrade an existing one. 'Lucky Strike' can be upgraded increasing the chance of activation by 1% on each upgrade to a maximum of 50%.
- [ ] in dev mode the player can upgrade their skills or activate new ones at any time in the skills screen
- [ ] the character initially has two deactivated skills. When active 'Ferocity' adds +1 to each attack and does not output a message. When active 'Dodge' gives a 1% chance of completely dodging an attack and shows a message when it is triggered. 'Ferocity' can be upgraded by +1 per upgrade with no maximum. 'Dodge' can be upgraded by +1% per upgrade to a maximum of 50%.

## Town

- [ ] the town is a special level, always appears at level 0 and is the starting place for a new game. It has a non-random layout and combat is disabled there.
- [ ] the town contains shops that can be entered where items from the players inventory can be sold for currency
- [ ] the town contains shops that can be entered where the player can buy items with currency. The items will have randomly generated stats and may include occasional rare items that are powerful for the players level. They will not include unique items that can only be found by exploring the dungeon.
- [ ] the town contains NPCs that can be interacted with for short conversations

## Special Levels

- [ ] special levels are non-random layout levels such as arena, nest, dungeon market, labyrinth, boss room, with a chance of unique bosses and items

## Unique Rooms

- [ ] randomly generated levels have a small chance of generating a unique room that only appears once per game, e.g. "The Dark Armoury" or "Necropolis Library". When the player enters a level with such a room the player is alerted by a message and a special notification. Unique rooms will contain at least one unique item or enemy and may also contain a unique NPC.

## Saving

- [ ] local save (cookies)
- [ ] export save as text file/string option
- [ ] multiple save slots
- [ ] cloud save (Google?)

## Hall of Legends

- [ ] add a Hall of Legends from the main screen where players can view the stats and game record for previous runs where they have died
- [ ] Hall of Legends should show the previous runs as an ordered table based on a field the player can select which defaults to deepest dungeon level reached. Other options for ordering could be xp, character level, highest level enemy defeated.

## Developer

- [x] add to developer options the ability to edit the spawn table and to change minimum and maximum number of enemies per room to be set before the game starts
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
