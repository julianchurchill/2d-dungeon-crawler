Feature: Tileset-aware item icons in UI panels

  UI panels (inventory, shop, display case) display item icons using sprite
  textures from the active tileset rather than fixed emoji characters.

  Scenario: Inventory panel uses classic-prefixed texture key for item icons
    Given the active tileset is "classic" for item icon tests
    And the inventory panel is showing a health potion for icon testing
    Then the inventory panel item icon should use texture "classic_item_potion_health"

  Scenario: Inventory panel uses modern-prefixed texture key for item icons
    Given the active tileset is "modern" for item icon tests
    And the inventory panel is showing a health potion for icon testing
    Then the inventory panel item icon should use texture "modern_item_potion_health"

  Scenario: Inventory panel uses hd-prefixed texture key for item icons
    Given the active tileset is "hd" for item icon tests
    And the inventory panel is showing a health potion for icon testing
    Then the inventory panel item icon should use texture "hd_item_potion_health"

  Scenario: Shop panel uses classic-prefixed texture key for item icons
    Given the active tileset is "classic" for item icon tests
    And the shop panel is showing a health potion for sale for icon testing
    Then the shop panel item icon should use texture "classic_item_potion_health"

  Scenario: Shop panel uses modern-prefixed texture key for item icons
    Given the active tileset is "modern" for item icon tests
    And the shop panel is showing a health potion for sale for icon testing
    Then the shop panel item icon should use texture "modern_item_potion_health"

  Scenario: Display case panel uses classic-prefixed texture key for item icons
    Given the active tileset is "classic" for item icon tests
    And the display case panel is showing a Bone Blade in inventory for icon testing
    Then the display case panel item icon should use texture "classic_item_bone_blade"

  Scenario: Display case panel uses modern-prefixed texture key for item icons
    Given the active tileset is "modern" for item icon tests
    And the display case panel is showing a Bone Blade in inventory for icon testing
    Then the display case panel item icon should use texture "modern_item_bone_blade"
