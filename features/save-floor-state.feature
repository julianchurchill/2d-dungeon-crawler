Feature: Save Floor State

  When a game is saved, the exact state of the current dungeon floor is
  persisted alongside player state.  Continuing a game restores the floor
  as it was left — tile layout, enemy positions with current HP, floor
  items, unique room discovery history, and the player's position within
  the floor.

  Scenario: Tile data is included in the saved floor state
    Given an empty save storage
    And a dungeon map 10 wide and 10 tall with tile 1 at position 3,4
    And a player at position 2,2 on floor 1 with 30 HP and 0 gold
    When the floor state is serialised
    Then the floor state should have width 10 and height 10
    And the floor state tile at position 3,4 should be 1

  Scenario: Enemy positions and current HP are saved
    Given an empty save storage
    And a dungeon map 10 wide and 10 tall with tile 1 at position 3,4
    And a player at position 2,2 on floor 1 with 30 HP and 0 gold
    And an enemy of type "goblin" at 5,6 with 4 of 8 HP on the floor
    When the floor state is serialised
    Then the floor state should contain an enemy of type "goblin" at 5,6 with hp 4

  Scenario: Champion enemies are saved with their drop item
    Given an empty save storage
    And a dungeon map 10 wide and 10 tall with tile 1 at position 3,4
    And a player at position 2,2 on floor 1 with 30 HP and 0 gold
    And a champion enemy of type "orc" at 7,3 with drop item "sword"
    When the floor state is serialised
    Then the floor state should contain a champion enemy of type "orc" at 7,3
    And that champion's drop item id should be "sword"

  Scenario: CreepingMass segments are saved
    Given an empty save storage
    And a dungeon map 10 wide and 10 tall with tile 1 at position 3,4
    And a player at position 2,2 on floor 1 with 30 HP and 0 gold
    And a creeping mass with segments at 2,5 and 3,5
    When the floor state is serialised
    Then the floor state should contain a creeping_mass with 2 segments

  Scenario: Floor items are saved with their position and count
    Given an empty save storage
    And a dungeon map 10 wide and 10 tall with tile 1 at position 3,4
    And a player at position 2,2 on floor 1 with 30 HP and 0 gold
    And an item "health_potion" at 8,1 with count 1 on the floor
    When the floor state is serialised
    Then the floor state should contain item "health_potion" at 8,1

  Scenario: Player position within the floor is saved
    Given an empty save storage
    And a dungeon map 10 wide and 10 tall with tile 1 at position 3,4
    And a player at position 2,2 on floor 1 with 30 HP and 0 gold
    When the floor state is serialised
    Then the floor state should record player position as 2,2

  Scenario: Unique room discovery is saved
    Given an empty save storage
    And a dungeon map 10 wide and 10 tall with tile 1 at position 3,4
    And a player at position 2,2 on floor 1 with 30 HP and 0 gold
    And the unique room "the_dark_armoury" has been seen
    And the unique room "the_necropolis_library" has been entered
    When the floor state is serialised
    Then the floor state unique rooms seen should include "the_dark_armoury"
    And the floor state unique rooms entered should include "the_necropolis_library"

  Scenario: Full save includes floor state when provided
    Given an empty save storage
    And a player at position 2,2 on floor 1 with 30 HP and 0 gold
    And a dungeon map 10 wide and 10 tall with tile 1 at position 3,4
    When the game is saved with floor state
    Then the loaded save should contain floor state data

  Scenario: Serialised floor state includes FOV explored tiles
    Given a real dungeon map 10 wide and 10 tall with explored tile at 3,4
    When the floor state is serialised
    Then the floor state fovState at 3,4 should be EXPLORED
    And the floor state fovState at 0,0 should be UNEXPLORED

  Scenario: FOV explored state survives a serialise and restore round-trip
    Given a real dungeon map 10 wide and 10 tall with explored tile at 3,4
    When the floor state is serialised
    Then a DungeonMap restored from the floor state has EXPLORED fovState at 3,4
