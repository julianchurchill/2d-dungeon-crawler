Feature: Enemy behaviour

  # Construction
  Scenario: Enemy is constructed with correct stats from its type definition
    Given an enemy of type "goblin" at position 2, 3
    Then the enemy name is "Goblin"
    And the enemy hp equals the goblin max hp
    And the enemy attack equals the goblin attack
    And the enemy defense equals the goblin defense
    And the enemy xp equals the goblin xp
    And the enemy aggroRange equals the goblin aggroRange

  Scenario: Enemy id encodes its type and position
    Given an enemy of type "goblin" at position 4, 7
    Then the enemy id starts with "goblin_4_7_"

  # isDead
  Scenario: Enemy is not dead when hp is above zero
    Given an enemy of type "goblin" at position 0, 0
    Then the enemy is not dead

  Scenario: Enemy is dead when hp reaches zero
    Given an enemy of type "goblin" at position 0, 0
    When the enemy takes 999 damage
    Then the enemy is dead

  # takeDamage
  Scenario: takeDamage reduces hp by amount minus defense
    Given an enemy of type "goblin" at position 0, 0
    When the enemy takes 5 damage
    Then the enemy hp is reduced by the attack minus goblin defense
    And takeDamage returns the actual damage dealt

  Scenario: takeDamage deals at least 1 damage
    Given an enemy of type "goblin" at position 0, 0
    When the enemy takes 0 damage
    Then the enemy hp is reduced by 1

  Scenario: takeDamage does not reduce hp below zero
    Given an enemy of type "goblin" at position 0, 0
    When the enemy takes 999 damage
    Then the enemy hp is 0

  # takeTurn — attack when adjacent
  Scenario: Enemy attacks when exactly 1 tile away from the player
    Given an enemy of type "goblin" at position 1, 0
    And an enemy target player at position 0, 0
    When the enemy takes its turn
    Then the action is "attack"
    And the target is the player

  Scenario: Enemy does not attack when 2 tiles away from the player
    Given an enemy of type "goblin" at position 2, 0
    And an enemy target player at position 0, 0
    When the enemy takes its turn on an open map
    Then the action is not "attack"

  # takeTurn — distance calculation
  Scenario: Enemy uses Manhattan distance to determine adjacency
    Given an enemy of type "goblin" at position 1, 1
    And an enemy target player at position 0, 0
    When the enemy takes its turn
    Then the action is not "attack"

  # takeTurn — aggro range
  Scenario: Enemy moves toward player when within aggro range
    Given an enemy of type "goblin" at position 3, 0
    And an enemy target player at position 0, 0
    When the enemy takes its turn on an open map
    Then the action is "move"

  Scenario: Enemy idles when player is outside aggro range and wander roll fails
    Given an enemy of type "goblin" at position 20, 0
    And an enemy target player at position 0, 0
    When the enemy takes its turn on an open map with wander suppressed
    Then the action is "idle"

  # takeTurn — wander
  Scenario: Enemy wanders to a walkable unoccupied tile when wander roll passes
    Given an enemy of type "goblin" at position 5, 5
    And an enemy target player at position 0, 0
    When the enemy takes its turn with wander forced on an open map
    Then the action is "move"

  Scenario: Enemy idles when all wander directions are blocked
    Given an enemy of type "goblin" at position 5, 5
    And an enemy target player at position 0, 0
    When the enemy takes its turn with wander forced on a fully blocked map
    Then the action is "idle"

  # _moveToward — axis preference
  Scenario: Enemy prefers horizontal movement when x distance is greater
    Given an enemy of type "goblin" at position 3, 1
    And an enemy target player at position 0, 0
    When the enemy moves toward the player on an open map
    Then the move dx is -1
    And the move dy is 0

  Scenario: Enemy prefers vertical movement when y distance is greater
    Given an enemy of type "goblin" at position 1, 3
    And an enemy target player at position 0, 0
    When the enemy moves toward the player on an open map
    Then the move dx is 0
    And the move dy is -1

  Scenario: Enemy falls back to diagonal when preferred axis is blocked
    Given an enemy of type "goblin" at position 2, 1
    And an enemy target player at position 0, 0
    When the enemy moves toward the player with horizontal blocked
    Then the move dy is -1

  Scenario: Enemy returns null when all move candidates are blocked
    Given an enemy of type "goblin" at position 1, 1
    And an enemy target player at position 0, 0
    When the enemy moves toward the player with all directions blocked
    Then no move is returned

  # Distance calculation — non-zero player position exposes +/- mutations
  Scenario: Enemy attacks when x-adjacent to player at non-zero position
    Given an enemy of type "goblin" at position 1, 1
    And an enemy target player at position 1, 0
    When the enemy takes its turn
    Then the action is "attack"

  Scenario: Enemy attacks when y-adjacent to player at non-zero position
    Given an enemy of type "goblin" at position 1, 1
    And an enemy target player at position 0, 1
    When the enemy takes its turn
    Then the action is "attack"

  # Aggro range boundary — distance exactly equal to aggroRange
  Scenario: Enemy moves when player is exactly at the edge of aggro range
    Given an enemy of type "goblin" at position 6, 0
    And an enemy target player at position 0, 0
    When the enemy takes its turn on an open map
    Then the action is "move"

  # if (move) null check — within aggro range but all paths blocked
  Scenario: Enemy does not move when within aggro range but path is fully blocked
    Given an enemy of type "goblin" at position 3, 0
    And an enemy target player at position 0, 0
    When the enemy takes its turn with aggro path blocked and wander suppressed
    Then the action is not "move"

  # _moveToward distX/distY with non-zero target position
  Scenario: Enemy prefers vertical when y distance is greater with non-zero target
    Given an enemy of type "goblin" at position 1, 2
    And an enemy target player at position 2, 0
    When the enemy moves toward the player on an open map
    Then the move dy is -1

  Scenario: Enemy prefers horizontal when x distance is greater with non-zero target
    Given an enemy of type "goblin" at position 2, 1
    And an enemy target player at position 0, 2
    When the enemy moves toward the player on an open map
    Then the move dx is -1

  # distX == distY — equal distances prefer horizontal first
  Scenario: Enemy prefers horizontal step when x and y distances are equal
    Given an enemy of type "goblin" at position 1, 1
    And an enemy target player at position 0, 0
    When the enemy moves toward the player with only horizontal step open
    Then the move dx is -1

  # Wander nx/ny — verify enemy moves to correct adjacent tile (not opposite)
  Scenario: Enemy wanders upward when only the tile above is open
    Given an enemy of type "goblin" at position 5, 5
    And an enemy target player at position 0, 0
    When the enemy wanders with only the tile above open
    Then the action is "move"
    And the move dy is -1

  Scenario: Enemy wanders leftward when only the tile to the left is open
    Given an enemy of type "goblin" at position 5, 5
    And an enemy target player at position 0, 0
    When the enemy wanders with only the tile to the left open
    Then the action is "move"
    And the move dx is -1

  # _moveToward else-branch fallback candidates (distX < distY)
  Scenario: Enemy uses horizontal fallback when vertical is blocked and y distance is greater
    Given an enemy of type "goblin" at position 1, 2
    And an enemy target player at position 2, 0
    When the enemy moves toward the player with vertical step blocked
    Then the move dx is 1

  Scenario: Enemy uses diagonal fallback when both primary candidates are blocked and y distance is greater
    Given an enemy of type "goblin" at position 1, 2
    And an enemy target player at position 2, 0
    When the enemy moves toward the player with vertical and horizontal steps blocked
    Then the move dx is 1
    And the move dy is -1

  # Sprite teleport
  Scenario: Sprite has a teleport chance defined
    Given an enemy of type "sprite" at position 5, 5
    Then the enemy teleport chance is greater than 0

  Scenario: Sprite teleports when the teleport roll passes and a valid tile exists
    Given an enemy of type "sprite" at position 5, 5
    And an enemy target player at position 0, 0
    When the enemy takes its turn with teleport forced on an open map
    Then the action is "teleport"
    And the teleport destination is within 3 tiles of the enemy origin

  Scenario: Goblin never teleports even when the teleport roll would pass
    Given an enemy of type "goblin" at position 5, 5
    And an enemy target player at position 20, 20
    When the enemy takes its turn with teleport forced on an open map
    Then the action is not "teleport"

  Scenario: Sprite falls back to normal behaviour when all tiles in range are blocked
    Given an enemy of type "sprite" at position 5, 5
    And an enemy target player at position 20, 20
    When the sprite takes its turn with teleport forced but all range tiles blocked
    Then the action is not "teleport"

  Scenario: Sprite does not teleport when the teleport roll fails
    Given an enemy of type "sprite" at position 5, 5
    And an enemy target player at position 20, 20
    When the enemy takes its turn with teleport suppressed on an open map
    Then the action is not "teleport"
