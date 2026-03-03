Feature: Inventory Cursor Navigation

  Background:
    Given an inventory cursor for a 4 column 5 row grid

  Scenario: Cursor starts at the first slot
    Then the cursor is at slot 0

  Scenario: Moving right advances the cursor one column
    When the cursor moves right
    Then the cursor is at slot 1

  Scenario: Moving right at the last column does not move the cursor
    Given the cursor has been placed at slot 3
    When the cursor moves right
    Then the cursor is at slot 3

  Scenario: Moving left retreats the cursor one column
    Given the cursor has been placed at slot 2
    When the cursor moves left
    Then the cursor is at slot 1

  Scenario: Moving left at the first column does not move the cursor
    When the cursor moves left
    Then the cursor is at slot 0

  Scenario: Moving down advances the cursor one row
    When the cursor moves down
    Then the cursor is at slot 4

  Scenario: Moving down at the last row does not move the cursor
    Given the cursor has been placed at slot 16
    When the cursor moves down
    Then the cursor is at slot 16

  Scenario: Moving up retreats the cursor one row
    Given the cursor has been placed at slot 4
    When the cursor moves up
    Then the cursor is at slot 0

  Scenario: Moving up at the first row does not move the cursor
    When the cursor moves up
    Then the cursor is at slot 0

  Scenario: Resetting the cursor returns it to slot 0
    Given the cursor has been placed at slot 5
    When the cursor is reset
    Then the cursor is at slot 0
