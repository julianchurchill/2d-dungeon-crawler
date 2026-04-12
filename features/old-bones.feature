Feature: Old Bones boss

  # ── Construction ─────────────────────────────────────────────────────────────

  Scenario: Old Bones has the correct type and name
    Given an Old Bones boss at position 5, 5
    Then the boss type is "old_bones"
    And the boss name is "Old Bones"

  Scenario: Old Bones is flagged as a boss
    Given an Old Bones boss at position 5, 5
    Then the boss is flagged as a boss

  Scenario: Old Bones starts with minions not yet spawned
    Given an Old Bones boss at position 5, 5
    Then the boss has not spawned minions yet

  Scenario: Old Bones has higher than normal hp
    Given an Old Bones boss at position 5, 5
    Then the boss hp is at least 30

  Scenario: Old Bones has gold to drop
    Given an Old Bones boss at position 5, 5
    Then the boss drop gold is greater than 0

  Scenario: Old Bones has a unique item to drop
    Given an Old Bones boss at position 5, 5
    Then the boss has a drop item

  # ── Combat ───────────────────────────────────────────────────────────────────

  Scenario: Old Bones is not dead when hp is above zero
    Given an Old Bones boss at position 5, 5
    Then the boss is not dead

  Scenario: Old Bones is dead when hp reaches zero
    Given an Old Bones boss at position 5, 5
    When the boss takes 9999 damage
    Then the boss is dead

  Scenario: Old Bones attacks when adjacent to the player
    Given an Old Bones boss at position 1, 0
    And a boss target player at position 0, 0
    When the boss takes its turn on an open map
    Then the boss action is "attack"

  Scenario: Old Bones moves toward the player within aggro range
    Given an Old Bones boss at position 5, 0
    And a boss target player at position 0, 0
    When the boss takes its turn on an open map
    Then the boss action is "move"

  # ── Unique drops ─────────────────────────────────────────────────────────────

  Scenario: Bone Blade is a weapon
    Then the Bone Blade item type is "weapon"

  Scenario: Bone Blade has an attack bonus
    Then the Bone Blade attack bonus is greater than 0

  Scenario: Skeleton Shield is armor
    Then the Skeleton Shield item type is "armor"

  Scenario: Skeleton Shield has a defense bonus
    Then the Skeleton Shield defense bonus is greater than 0

  # ── Achievement ──────────────────────────────────────────────────────────────

  Scenario: Old Bones Slayer achievement exists
    Then the "old_bones_slayer" achievement is defined

  Scenario: Old Bones Slayer unlocks when 1 old bones is killed
    Given the achievement system is initialised
    When the player kills 1 old_bones
    Then the "Bone Breaker" achievement should be completed

  # ── Skeleton minion type ─────────────────────────────────────────────────────

  Scenario: Skeleton enemy type is defined
    Then the "skeleton" enemy type is defined in ENEMY_DEFS

  Scenario: Skeleton has stats appropriate for a minion
    Then the skeleton hp is at least 8
