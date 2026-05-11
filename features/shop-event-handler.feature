Feature: ShopEventHandler

  ShopEventHandler encapsulates the four shop and display-case event
  handlers extracted from GameScene: buying items from a shop, selling
  items to a shop, storing items in the display case, and retrieving
  items from the display case. It accepts a scene reference and exposes
  each operation as a named method.

  Scenario: ShopEventHandler exposes the expected shop methods
    Given a ShopEventHandler bound to a minimal scene context
    Then the shop event handler exposes handleBuyItem
    And the shop event handler exposes handleSellItem
    And the shop event handler exposes handleStoreItem
    And the shop event handler exposes handleRetrieveItem
