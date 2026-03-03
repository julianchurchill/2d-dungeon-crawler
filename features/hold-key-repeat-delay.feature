Feature: Hold Key Repeat Delay

  Scenario: No repeat is scheduled when no key is held
    Given the repeat scheduler is ready with no key held
    When auto-repeat is checked
    Then no repeat callback is pending

  Scenario: A repeat callback is pending when a key is held
    Given the repeat scheduler is ready with the right key held
    When auto-repeat is checked
    Then a repeat callback is pending

  Scenario: The repeat fires with the held direction when the delay elapses
    Given the repeat scheduler is ready with the right key held
    When auto-repeat is checked and the repeat delay elapses
    Then the repeat fires in the right direction

  Scenario: No repeat fires if the key is released before the delay elapses
    Given the repeat scheduler is ready with the right key held
    When auto-repeat is checked
    And the right key is released
    And the repeat delay elapses
    Then no repeat fires
