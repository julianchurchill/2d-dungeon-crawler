Feature: Level-up screen effect
  As a player I want a visible screen effect when I level up so that the
  moment feels rewarding and I do not miss that my character has improved.

  Scenario: Level-up event is emitted with the new level when the player levels up
    Given a player who needs 20 XP to reach the next level
    When the player gains 20 XP and the game processes the level-up
    Then a level-up event should have been emitted for level 2

  Scenario: No level-up event is emitted when XP is not enough to level up
    Given a player who needs 20 XP to reach the next level
    When the player gains 10 XP and the game processes the level-up
    Then no level-up event should have been emitted
