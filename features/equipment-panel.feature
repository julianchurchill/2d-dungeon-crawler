Feature: Equipment Panel

  The equipment panel sits next to the inventory panel and shows the
  player's currently equipped melee weapon and shield (armour) slots.

  # ── Visibility ───────────────────────────────────────────────────────────────

  Scenario: Equipment panel is visible when shown with a player
    Given an equipment panel with an unequipped player
    When the equipment panel is shown
    Then the equipment panel is visible

  Scenario: Equipment panel is hidden after hide is called
    Given an equipment panel with an unequipped player
    When the equipment panel is shown
    And the equipment panel is hidden
    Then the equipment panel is not visible

  # ── Empty slots ──────────────────────────────────────────────────────────────

  Scenario: Weapon slot shows "Empty" when no weapon is equipped
    Given an equipment panel with an unequipped player
    When the equipment panel is shown
    Then the weapon slot label is "Empty"

  Scenario: Shield slot shows "Empty" when no armour is equipped
    Given an equipment panel with an unequipped player
    When the equipment panel is shown
    Then the shield slot label is "Empty"

  # ── Equipped items ───────────────────────────────────────────────────────────

  Scenario: Weapon slot shows equipped weapon name
    Given an equipment panel with a player who has a short sword equipped
    When the equipment panel is shown
    Then the weapon slot label is "Short Sword"

  Scenario: Shield slot shows equipped armour name
    Given an equipment panel with a player who has leather armor equipped
    When the equipment panel is shown
    Then the shield slot label is "Leather Armor"

  # ── Live refresh ─────────────────────────────────────────────────────────────

  Scenario: Equipment panel updates when a weapon is equipped while open
    Given an equipment panel with an unequipped player
    And the equipment panel is shown
    When a short sword is equipped via the inventory changed event
    Then the weapon slot label is "Short Sword"

  Scenario: Equipment panel updates when armour is equipped while open
    Given an equipment panel with an unequipped player
    And the equipment panel is shown
    When leather armor is equipped via the inventory changed event
    Then the shield slot label is "Leather Armor"

  # ── Slot icons ───────────────────────────────────────────────────────────────

  Scenario: Weapon slot icon is hidden when no weapon is equipped
    Given an equipment panel with an unequipped player
    When the equipment panel is shown
    Then the weapon slot icon is not visible

  Scenario: Shield slot icon is hidden when no armour is equipped
    Given an equipment panel with an unequipped player
    When the equipment panel is shown
    Then the shield slot icon is not visible

  Scenario: Weapon slot icon is visible when a weapon is equipped
    Given an equipment panel with a player who has a short sword equipped
    When the equipment panel is shown
    Then the weapon slot icon is visible

  Scenario: Shield slot icon is visible when armour is equipped
    Given an equipment panel with a player who has leather armor equipped
    When the equipment panel is shown
    Then the shield slot icon is visible

  Scenario: Weapon slot icon uses the weapon's texture key
    Given an equipment panel with a player who has a short sword equipped
    When the equipment panel is shown
    Then the weapon slot icon texture contains "item_weapon"

  Scenario: Shield slot icon uses the armour's texture key
    Given an equipment panel with a player who has leather armor equipped
    When the equipment panel is shown
    Then the shield slot icon texture contains "item_armor"
