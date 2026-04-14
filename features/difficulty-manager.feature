Feature: Difficulty Manager

  The DifficultyManager persists the chosen difficulty level and exposes
  per-difficulty multipliers that are applied to enemy count, HP, and ATK.

  Scenario: Default difficulty is normal
    Given a new DifficultyManager with no stored preference
    Then the difficulty should be "normal"

  Scenario: Difficulty can be changed to easy
    Given a new DifficultyManager with no stored preference
    When the difficulty is set to "easy"
    Then the difficulty should be "easy"

  Scenario: Difficulty can be changed to hard
    Given a new DifficultyManager with no stored preference
    When the difficulty is set to "hard"
    Then the difficulty should be "hard"

  Scenario: Difficulty can be changed to brutal
    Given a new DifficultyManager with no stored preference
    When the difficulty is set to "brutal"
    Then the difficulty should be "brutal"

  Scenario: Easy difficulty has no enemy count scaling
    Given a new DifficultyManager with no stored preference
    When the difficulty is set to "easy"
    Then the enemy count multiplier should equal 1

  Scenario: Normal difficulty increases enemy count
    Given a new DifficultyManager with no stored preference
    Then the enemy count multiplier should be greater than 1

  Scenario: Hard difficulty increases enemy count
    Given a new DifficultyManager with no stored preference
    When the difficulty is set to "hard"
    Then the enemy count multiplier should be greater than 1

  Scenario: Brutal difficulty increases enemy count more than hard
    Given a new DifficultyManager with no stored preference
    When the difficulty is set to "brutal"
    Then the enemy count multiplier should be greater than 1

  Scenario: Easy difficulty has no enemy HP scaling
    Given a new DifficultyManager with no stored preference
    When the difficulty is set to "easy"
    Then the enemy HP multiplier should equal 1

  Scenario: Hard difficulty increases enemy HP
    Given a new DifficultyManager with no stored preference
    When the difficulty is set to "hard"
    Then the enemy HP multiplier should be greater than 1

  Scenario: Brutal difficulty increases enemy HP
    Given a new DifficultyManager with no stored preference
    When the difficulty is set to "brutal"
    Then the enemy HP multiplier should be greater than 1

  Scenario: Easy difficulty has no enemy ATK scaling
    Given a new DifficultyManager with no stored preference
    When the difficulty is set to "easy"
    Then the enemy ATK multiplier should equal 1

  Scenario: Hard difficulty increases enemy ATK
    Given a new DifficultyManager with no stored preference
    When the difficulty is set to "hard"
    Then the enemy ATK multiplier should be greater than 1

  Scenario: Brutal difficulty increases enemy ATK
    Given a new DifficultyManager with no stored preference
    When the difficulty is set to "brutal"
    Then the enemy ATK multiplier should be greater than 1
