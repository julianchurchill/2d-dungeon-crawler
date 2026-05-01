Feature: Autosave Timer

  While a game is in progress, the game state is saved automatically at a
  regular interval so that unexpected interruptions (browser crash, accidental
  tab close) do not cause the player to lose significant progress.

  Scenario: Save is triggered after one interval elapses
    Given an autosave timer with an interval of 120000 ms
    And a fake save callback
    When the timer is started
    And the interval elapses once
    Then the save callback should have been called 1 time

  Scenario: Save is not triggered before the interval elapses
    Given an autosave timer with an interval of 120000 ms
    And a fake save callback
    When the timer is started
    Then the save callback should have been called 0 times

  Scenario: Save is triggered repeatedly at each interval
    Given an autosave timer with an interval of 120000 ms
    And a fake save callback
    When the timer is started
    And the interval elapses 3 times
    Then the save callback should have been called 3 times

  Scenario: Stopping the timer prevents further saves
    Given an autosave timer with an interval of 120000 ms
    And a fake save callback
    When the timer is started
    And the interval elapses once
    And the timer is stopped
    And the interval elapses once
    Then the save callback should have been called 1 time

  Scenario: Starting an already-running timer is a no-op
    Given an autosave timer with an interval of 120000 ms
    And a fake save callback
    When the timer is started
    And the timer is started
    And the interval elapses once
    Then the save callback should have been called 1 time
