Feature: Inventory slot pointer interaction

  Tapping or clicking an inventory slot selects it (moving the cursor and
  showing item stats) without immediately using the item.  A second tap on
  the already-selected slot uses the item.  Clicking an empty slot does nothing.

  Scenario: Clicking an occupied unselected slot selects it without using it
    Given an inventory cursor at slot 0 with 3 items
    When slot 2 is pointer-pressed
    Then the pointer action should be "select"
    And the cursor should be at slot 2

  Scenario: Clicking the currently selected slot uses the item
    Given an inventory cursor at slot 2 with 3 items
    When slot 2 is pointer-pressed
    Then the pointer action should be "use"
    And the cursor should still be at slot 2

  Scenario: Clicking an empty slot does nothing
    Given an inventory cursor at slot 0 with 3 items
    When slot 5 is pointer-pressed
    Then no pointer action should occur
    And the cursor should still be at slot 0
