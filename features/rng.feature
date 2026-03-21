Feature: Random Number Generator

  # next() — deterministic sequence with a known seed
  Scenario: next() produces a value between 0 and 1 exclusive
    Given an RNG seeded with 42
    When next is called
    Then the result is between 0 and 1

  Scenario: next() produces a deterministic sequence for a known seed
    Given an RNG seeded with 42
    When next is called 3 times
    Then the sequence matches the expected values for seed 42

  # nextInt — range and formula correctness
  Scenario: nextInt always returns a value within the given range
    Given an RNG seeded with 42
    When nextInt is called 100 times with min 2 and max 5
    Then every result is between 2 and 5 inclusive

  Scenario: nextInt with a non-zero min returns the correct value for a known seed
    Given an RNG seeded with 42
    When nextInt is called with min 2 and max 5
    Then the result is 4

  Scenario: nextInt with equal min and max always returns that value
    Given an RNG seeded with 42
    When nextInt is called with min 3 and max 3
    Then the result is 3

  # nextBool — threshold comparison
  Scenario: nextBool returns false when the random value equals the chance threshold
    Given an RNG seeded with 42
    When nextBool is called with chance equal to the first next value
    Then the result is false

  Scenario: nextBool returns true when chance is above the random value
    Given an RNG seeded with 42
    When nextBool is called with chance slightly above the first next value
    Then the result is true

  Scenario: nextBool with chance 0 always returns false
    Given an RNG seeded with 42
    When nextBool is called with chance 0
    Then the result is false

  Scenario: nextBool with chance 1 always returns true
    Given an RNG seeded with 42
    When nextBool is called with chance 1
    Then the result is true

  # pick — valid index selection
  Scenario: pick always returns a defined element from the array
    Given an RNG seeded with 42
    When pick is called 100 times on a 3-element array
    Then every result is a defined element

  Scenario: pick returns the correct element for a known seed
    Given an RNG seeded with 42
    When pick is called on array "a", "b", "c"
    Then the result is "b"
