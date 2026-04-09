Feature: Combined Shop Panel

  The shop panel merges buying and selling into a single panel.
  Player-owned sellable items appear at the top of the list;
  shop stock available to buy appears below them.
  The player's current gold balance is always visible.

  Scenario: Panel lists sell items above buy items
    Given a weapon shop with stock containing a "Iron Sword" for 30 gold
    And a player with a "Short Sword" in their inventory and 50 gold
    When the shop panel is shown
    Then the panel should show "Short Sword" in the sell section
    And the panel should show "Iron Sword" in the buy section
    And the sell section should appear before the buy section

  Scenario: Player gold is visible in the panel
    Given a weapon shop with stock containing a "Iron Sword" for 30 gold
    And a player with a "Short Sword" in their inventory and 50 gold
    When the shop panel is shown
    Then the panel gold display should show 50

  Scenario: Selecting a sell-section row emits SELL_ITEM
    Given a weapon shop with stock containing a "Iron Sword" for 30 gold
    And a player with a "Short Sword" in their inventory and 50 gold
    When the shop panel is shown
    And the cursor is on the sell row for "Short Sword"
    And the player selects it
    Then a SELL_ITEM event should have been emitted for "Short Sword"

  Scenario: Selecting a buy-section row emits BUY_ITEM
    Given a weapon shop with stock containing a "Iron Sword" for 30 gold
    And a player with a "Short Sword" in their inventory and 50 gold
    When the shop panel is shown
    And the cursor is navigated past the sell section to the buy row for "Iron Sword"
    And the player selects it
    Then a BUY_ITEM event should have been emitted for "Iron Sword"

  Scenario: Gold display updates after a purchase
    Given a weapon shop with stock containing a "Iron Sword" for 30 gold
    And a player with a "Short Sword" in their inventory and 50 gold
    When the shop panel is shown
    And the panel gold is updated to 20
    Then the panel gold display should show 20

  Scenario: Panel shows nothing-to-sell message when inventory has no matching items
    Given a weapon shop with stock containing a "Iron Sword" for 30 gold
    And a player with no matching inventory items and 50 gold
    When the shop panel is shown
    Then the panel should indicate there is nothing to sell

  Scenario: Panel shows nothing-to-buy message when shop stock is empty
    Given a weapon shop with no stock
    And a player with no matching inventory items and 50 gold
    When the shop panel is shown
    Then the panel should indicate there is nothing to buy
