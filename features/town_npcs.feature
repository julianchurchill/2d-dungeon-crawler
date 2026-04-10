Feature: Town NPCs

  The town contains NPCs that can be interacted with for short conversations.
  Bumping into an NPC opens a dialogue panel showing their name and a line of
  dialogue. The player dismisses it with ENTER or ESC.

  # --- NPC definitions ---

  Scenario: Town NPCs have names
    Given the town NPCs are defined
    Then every NPC should have a non-empty name

  Scenario: Town NPCs have at least one dialogue line
    Given the town NPCs are defined
    Then every NPC should have at least one dialogue line

  Scenario: Town NPCs have unique positions
    Given the town NPCs are defined
    Then no two NPCs should share the same position

  Scenario: Town NPCs are placed on walkable town tiles
    Given the town is generated
    Then each NPC position should be on a walkable tile

  # --- TownGenerator integration ---

  Scenario: TownGenerator result includes NPCs
    Given the town is generated
    Then the town result should include at least one NPC

  Scenario: Each NPC in the result has a name and position
    Given the town is generated
    Then each NPC in the result should have a name and an x/y position

  # --- NPC entity ---

  Scenario: Bumping an NPC emits an npc action
    Given a player adjacent to an NPC
    When the player moves into the NPC
    Then the move result action should be "npc"
    And the move result should reference the NPC

  # --- Dialogue cycling ---

  Scenario: NPC returns the first dialogue line on first interaction
    Given an NPC with two dialogue lines
    When the NPC is talked to for the first time
    Then the dialogue should show the first line

  Scenario: NPC cycles to the next dialogue line on subsequent interactions
    Given an NPC with two dialogue lines
    When the NPC is talked to twice
    Then the dialogue should show the second line

  Scenario: NPC dialogue wraps back to the first line after the last
    Given an NPC with two dialogue lines
    When the NPC is talked to three times
    Then the dialogue should show the first line again
