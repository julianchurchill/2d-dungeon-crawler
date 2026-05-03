Feature: Restore player inventory and equipment from save data

  When a save is loaded, inventory items and equipment slots must share
  the same object references.  If they don't, identity checks like
  Player.isEquipped() silently break, causing warnings to be skipped
  and sold items to remain visually equipped.

  Scenario: Equipped weapon shares the same reference as the inventory item
    Given a saved player with a Short Sword in inventory equipped as weapon
    When the save data is restored onto a fresh player
    Then the player's equippedWeapon should be the same instance as the inventory item

  Scenario: Equipped armour shares the same reference as the inventory item
    Given a saved player with Leather Armor in inventory equipped as armor
    When the save data is restored onto a fresh player
    Then the player's equippedArmor should be the same instance as the inventory item

  Scenario: Two rings of the same type occupy distinct inventory slots
    Given a saved player with two Iron Rings in inventory both equipped
    When the save data is restored onto a fresh player
    Then ring1 and ring2 should each reference a different inventory item
