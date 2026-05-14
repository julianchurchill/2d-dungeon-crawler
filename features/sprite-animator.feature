Feature: SpriteAnimator

  SpriteAnimator encapsulates all Phaser sprite animation and health-bar
  rendering logic extracted from GameScene: tweening sprites to tile positions,
  animating projectiles, flashing sprites on hit, and creating and updating
  enemy health bars. It accepts a scene reference and exposes each operation
  as a named method.

  Scenario: SpriteAnimator exposes the expected methods
    Given a SpriteAnimator bound to a minimal scene context
    Then the sprite animator exposes animateMove
    And the sprite animator exposes animateProjectile
    And the sprite animator exposes flashSprite
    And the sprite animator exposes createHealthBar
    And the sprite animator exposes updateHealthBar
    And the sprite animator exposes repositionSprite
