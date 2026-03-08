Feature: Message log history
  As a player I want to scroll through the full message history
  so that I can review earlier events I may have missed.

  Scenario: Message log retains all messages beyond the visible limit
    Given a new message history
    When 10 messages are added to the history
    Then the message history should contain 10 messages

  Scenario: Messages are stored in chronological order
    Given a new message history
    When the messages "alpha", "beta", and "gamma" are added to the history
    Then the message at index 0 should be "alpha"
    And the message at index 2 should be "gamma"

  Scenario: History window returns the newest messages at offset zero
    Given a new message history with 10 messages
    When a history window of 4 is retrieved at scroll offset 0
    Then the window should contain 4 messages
    And the last message in the window should be "message 10"

  Scenario: History window scrolls back through older messages
    Given a new message history with 10 messages
    When a history window of 4 is retrieved at scroll offset 3
    Then the last message in the window should be "message 7"

  Scenario: History window does not go below zero when offset is large
    Given a new message history with 3 messages
    When a history window of 4 is retrieved at scroll offset 10
    Then the window should contain 3 messages
