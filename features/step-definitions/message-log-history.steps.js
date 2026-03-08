import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { MessageHistory } from '../../src/ui/MessageHistory.js';

/**
 * Step definitions for the MessageHistory data model.
 * Tests cover retention, ordering, and windowed retrieval of stored messages.
 */

Given('a new message history', function () {
  this.history = new MessageHistory();
});

Given('a new message history with {int} messages', function (count) {
  this.history = new MessageHistory();
  for (let i = 1; i <= count; i++) {
    this.history.add(`message ${i}`);
  }
});

When('{int} messages are added to the history', function (count) {
  for (let i = 1; i <= count; i++) {
    this.history.add(`msg ${i}`);
  }
});

When('the messages {string}, {string}, and {string} are added to the history', function (a, b, c) {
  this.history.add(a);
  this.history.add(b);
  this.history.add(c);
});

When('a history window of {int} is retrieved at scroll offset {int}', function (windowSize, offset) {
  this.window = this.history.getWindow(offset, windowSize);
});

Then('the message history should contain {int} messages', function (expected) {
  assert.equal(this.history.getCount(), expected,
    `Expected history count ${expected} but got ${this.history.getCount()}`);
});

Then('the message at index {int} should be {string}', function (index, expected) {
  const all = this.history.getAll();
  assert.equal(all[index], expected,
    `Expected message at index ${index} to be "${expected}" but got "${all[index]}"`);
});

Then('the window should contain {int} messages', function (expected) {
  assert.equal(this.window.length, expected,
    `Expected window length ${expected} but got ${this.window.length}`);
});

Then('the last message in the window should be {string}', function (expected) {
  const last = this.window[this.window.length - 1];
  assert.equal(last, expected,
    `Expected last window message to be "${expected}" but got "${last}"`);
});
