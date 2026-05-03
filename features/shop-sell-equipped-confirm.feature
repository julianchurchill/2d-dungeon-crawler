Feature: Confirm before selling an equipped item

  Accidentally selling an equipped item could leave the player
  unexpectedly underequipped.  The shop panel warns on the first
  attempt and requires a second press to confirm the sale.

  Scenario: Selling an unequipped item proceeds immediately without confirmation
    Given a sell-confirm shop panel with a non-equipped Short Sword
    When the player presses sell
    Then the sell-confirm SELL_ITEM event should have been emitted for "Short Sword"

  Scenario: First attempt to sell an equipped item emits a warning and does not sell
    Given a sell-confirm shop panel with the Short Sword equipped
    When the player presses sell
    Then no SELL_ITEM event should have been emitted
    And a sell-equipped warning message should be shown

  Scenario: Second attempt on the same equipped item confirms the sale
    Given a sell-confirm shop panel with the Short Sword equipped
    When the player presses sell
    And the player presses sell again
    Then the sell-confirm SELL_ITEM event should have been emitted for "Short Sword"

  Scenario: Navigating away after the warning resets the sell confirmation
    Given a sell-confirm shop panel with the Short Sword equipped
    When the player presses sell
    And the shop panel cursor is moved
    Then the pending sell confirmation should be cleared
