# TODO

## Bugs

- [x] mobile inventory panel has no way to close it — no close button on touch devices
- [x] mobile double-tap run does not stop when another button is pressed — any d-pad button press should cancel an active run, mirroring keyboard behaviour
- [x] mobile controls overlap the message log and lack an Achievements/ESC button: move D-pad up to clear the message log, move INV to the centre position, add a menu button that opens Achievements (or closes the message log if it is open)
- [x] mobile controls cover message panel - when message panel is expanded it states 'ESC to close' which is not relevant for mobile - should have a X to press
- [x] can't run with mobile controls
- [x] Inventory window does not change the currently equipped weapon/armour name when clicked (it does change the equipped state, just not the text)

## General

- [ ] music
- [ ] bosses - unique (once per run) and repeatable (champions?)
- [ ] stats - deepest level reached, monster types kill count, unique bosses kill count
- [x] in-game help screen — pressing ESC or the mobile ≡ menu button shows an in-game menu with Achievements and Help options; Help shows controls relevant to the current device (keyboard or mobile)
- [x] display and maintain an application version number following semantic versioning and include the git commit hash for the built application
- [x] deployment to GitHub Pages

## Achievements

- [ ] 'Goblin Slayer - killed 100 goblins (n killed so far)' grants 'Goblin slaying' permanent skill of an extra 15% damage against goblins (cumulative with 'Goblin hunting').
- [ ] 'Top Nogg - killed Boss Nogg' grants 'Goblin destroyer' permanent skill of extra 25% damage against goblins (cumulative with 'Goblin hunting' and 'Goblin slaying').
- [x] some achievements unlock the availability of new items that can appear from then on in the game based on any other item specific conditions (e.g. only appears after level 10)
- [x] some achievements unlock the availability of new skills that can be selected by the player from then on in the game based on any other skill specific conditions (e.g. only appears after level 10)
- [x] some achievements unlock the availability of new permanent skills that apply to the player from then such as 'Goblin Killer' achievement unlocks 'Goblin hunting' permanent skill that gives the player an extra 10% damage against goblins
- [x] when running in dev mode allow the achievements to be completed and uncompleted by a tick box that is otherwise hidden
- [x] achievements can be viewed by pressing ESCAPE to access an in game menu which shows 'Achievements'. This same screen can also be reached from the main menu before starting a game. This screen shows all achievements completed so far as well as achievements not yet completed.
- [x] achievements are events that occur as a player explores the dungeon when they achieve certain conditions, for example 'Goblin Killer - killed 10 goblins' and 'Burrower - reached level 10'. Once an achievement is completed a message appears and a clear alert is shown to the player. Each achievement can only be completed once. Achievements that require the player to reach a certain number of something should have the value so far alongside, e.g 'Goblin Killer - killed 10 goblins (4 killed so far)'.

## Inventory

- [ ] show details of inventory item when highlighted
- [ ] drop items with 'd' when in inventory. Provide a button for mobile interface.
- [ ] destroy items to get collectable materials that could be used later to create new items or enhance existing ones. Use 'D' when in inventory and provide a button for mobile interface. Protect unique items by asking the player to confirm the action.
- [x] arrow keys to move around inventory (no mouse)

## UI

- [ ] map - press 'm' to show and provide a button for the mobile interface
- [x] allow arrows and WASD keys to navigate menus and ENTER/SPACE to select buttons
- [x] mobile controls on mobile only
- [x] screen effect when you level up during the game

## Enemies

- [ ] boss spawn developer options - add to developer options to spawn unique bosses, alongside enemy spawning controls.
- [ ] enemy health - perhaps a health bar
- [ ] enemy types
- [ ] associate enemies with a chance of appearing based on the dungeon level. Record that against their enemy stats as their level. This can then be used for Hall of Legends information when players die for the highest level enemy they have defeated.
- [ ] have an optional max dungeon level below which enemies will appear
- [x] Boss - Old Bones, the first boss the player can encounter. Will randomly appear between level 10 and 15 until the player defeats it. As it is a unique boss it can only appear once in a level. Gives player an achievement on defeating. Drops 1 unique weapon or piece of armour with a bone/skeleton theme. Drops some gold. Is quite aggressive. May spawn up to 2 skeleton minions nearby once combat starts.
- [x] new enemy - Creeping Mass, appears from level 10, is solitary. It has 3-5 segments which each cover 1 tile. The segments are always connected by at least one other segment. The whole enemy moves one tile at a time by removing one outer segment and placing it on a free adjacent tile to any other segment. A Creeping Mass has hp relative to the number of segments it has. As it gets damaged it loses segments in proportion to it's remaining hp.

## Character

- [ ] increase defense when a character levels up
- [ ] character graphic
- [ ] show a character sheet by pressing 'c' which shows all the players stats currently. Provide a button for the mobile interface.
- [ ] look - the player can click or touch a cell in the map to see more information about what is in that cell, e.g. for an enemy see the name and hp "Goblin 8hp", for items show the name and description "Short Sword +3 Attack", for other things at least show the name "Stone floor" or "Stone wall". The information should pop up perhaps in the bottom right or top right of the screen. Position appropriately for mobile devices. Using look does not advance the game turn. Look can only be used on cells that is in the character's line of sight.
- [ ] look cursor - a cursor can be activated on non-touch devices with 'l' and deactivated with ESC. When activated the player can move the cursor around the map with the direction keys to highlight the thing that is being looked at. The cursor starts on the player.
- [x] hold keys for continued movement
- [x] run movement - SHIFT+direction keeps going until an obstacle or visible enemy/item stops them

## Character Skills

- [x] every 1 levels the character can either choose a new skill from the pool of not activated skills to activate or upgrade an existing one. 'Lucky Strike' can be upgraded increasing the chance of activation by 1% on each upgrade to a maximum of 50%.
- [x] the character initially has two deactivated skills. When active 'Ferocity' adds +1 to each attack and does not output a message. When active 'Dodge' gives a 1% chance of completely dodging an attack and shows a message when it is triggered. 'Ferocity' can be upgraded by +1 per upgrade with no maximum. 'Dodge' can be upgraded by +1% per upgrade to a maximum of 50%.
- [x] in dev mode the player can upgrade their skills or activate new ones at any time in the skills screen
- [x] a character can have skills that have dynamic effects. These can be viewed by pressing 'k' or using a button on the mobile interface. Initially the character has one active skill of 'Lucky Strike' which gives a 1% chance for the character to gain 50% damage on a hit during combat and shows a message when it is triggered.

## Town

- [x] the town contains shops that can be entered where the player can buy items with currency. The items will have randomly generated stats and may include occasional rare items that are powerful for the players level. They will not include unique items that can only be found by exploring the dungeon.
- [x] the town contains shops that can be entered where items from the players inventory can be sold for currency
- [x] the town is a special level, always appears at level 0 and is the starting place for a new game. It has a non-random layout and combat is disabled there.
- [x] the town contains NPCs that can be interacted with for short conversations

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

- [x] add in-game dev menu with toggle to make enemies invincible and another toggle to make the player invincible
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
