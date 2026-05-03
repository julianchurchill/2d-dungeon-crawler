Feature: Dev-mode resurrect after death

  In dev mode, when the player dies the game offers a resurrect option.
  Choosing it restores the player to full HP in place without returning
  to the main menu or losing any items or stats.

  Scenario: Resurrecting a dead player restores HP to maximum
    Given a player with max HP of 30 and current HP of 0
    When the player is resurrected
    Then the player's current HP should be 30

  Scenario: Resurrecting a player with partial HP restores to maximum
    Given a player with max HP of 30 and current HP of 5
    When the player is resurrected
    Then the player's current HP should be 30

  Scenario: Resurrection does not affect the player's max HP
    Given a player with max HP of 30 and current HP of 0
    When the player is resurrected
    Then the player's max HP should still be 30
