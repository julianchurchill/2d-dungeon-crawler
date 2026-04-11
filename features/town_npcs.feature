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

  # --- Contextual dialogue ---

  Scenario: NPC returns a contextual line when condition matches and rng triggers it
    Given an NPC with a contextual line triggered when player has a weapon
    And a player carrying a weapon named "Long Sword (+7)"
    When the player talks to the NPC with an rng that always triggers contextual dialogue
    Then the dialogue should be the contextual line referencing the weapon

  Scenario: NPC falls back to a regular line when rng does not trigger contextual dialogue
    Given an NPC with a contextual line triggered when player has a weapon
    And a player carrying a weapon named "Long Sword (+7)"
    When the player talks to the NPC with an rng that never triggers contextual dialogue
    Then the dialogue should be the NPC's first fixed line

  Scenario: NPC falls back to a regular line when no contextual condition applies
    Given an NPC with a contextual line triggered when player has a weapon
    And a player with no items
    When the player talks to the NPC with an rng that always triggers contextual dialogue
    Then the dialogue should be the NPC's first fixed line

  Scenario: Town NPCs include contextual lines in their definitions
    Given the town NPCs are defined
    Then every NPC should have at least one contextual line defined

  # --- Distinctive sprites ---

  Scenario: Each town NPC has a unique sprite key
    Given the town NPCs are defined
    Then every NPC should have a unique sprite key

  # --- NPC roaming ---

  Scenario: NpcRoamController stays when interval has not been reached
    Given an NPC roam controller with interval 3
    When the roam controller is ticked once on a walkable floor
    Then the roam result should be "stay"

  Scenario: NpcRoamController attempts to move when the interval is reached
    Given an NPC roam controller with interval 1
    When the roam controller is ticked once on a walkable floor
    Then the roam result action should be "move"

  Scenario: NpcRoamController does not move into a wall
    Given an NPC roam controller with interval 1 surrounded by walls on three sides
    When the roam controller is ticked once
    Then the roam result should indicate movement to the open side or stay

  Scenario: NpcRoamController does not move into an occupied tile
    Given an NPC roam controller with interval 1 and all neighbours occupied
    When the roam controller is ticked once
    Then the roam result should be "stay"
