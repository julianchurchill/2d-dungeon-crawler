Feature: Keyboard menu navigation

  A MenuNavigator tracks which item in a list has focus and wraps
  at the boundaries, so menu scenes can drive keyboard navigation
  without Phaser-specific logic.

  Scenario: Focus starts at the first item
    Given a menu navigator with 3 items
    Then the focused index is 0

  Scenario: Moving down advances focus by one
    Given a menu navigator with 3 items
    When the navigator moves down
    Then the focused index is 1

  Scenario: Moving up from the first item wraps to the last
    Given a menu navigator with 3 items
    When the navigator moves up
    Then the focused index is 2

  Scenario: Moving down from the last item wraps to the first
    Given a menu navigator with 3 items
    When the navigator moves down
    And the navigator moves down
    And the navigator moves down
    Then the focused index is 0

  Scenario: Moving up then down returns to the start
    Given a menu navigator with 3 items
    When the navigator moves up
    And the navigator moves down
    Then the focused index is 0

  Scenario: Single-item menu stays at index 0 when moving down
    Given a menu navigator with 1 item
    When the navigator moves down
    Then the focused index is 0

  Scenario: Single-item menu stays at index 0 when moving up
    Given a menu navigator with 1 item
    When the navigator moves up
    Then the focused index is 0
