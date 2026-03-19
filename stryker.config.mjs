/**
 * Stryker mutation testing configuration.
 *
 * Targets all pure-JS source files under src/, excluding Phaser scene files
 * (which depend on browser APIs unavailable in Node.js) and the generated
 * build-info module.
 *
 * The phaser-loader.mjs ESM hook is passed via testRunnerNodeArgs so that any
 * src/ module that imports 'phaser' is redirected to the test mock, matching
 * the behaviour of the regular `npm test` command.
 *
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  testRunner: 'cucumber',

  /** Re-use the default Cucumber profile defined in cucumber.js. */
  cucumber: {
    profile: 'default',
  },

  /**
   * Pass the custom ESM loader to every Node.js child process Stryker spawns,
   * so that `import 'phaser'` is intercepted and redirected to the test mock —
   * exactly as the regular test command does via NODE_OPTIONS.
   */
  testRunnerNodeArgs: [
    '--loader', './features/support/phaser-loader.mjs',
    '--no-warnings',
  ],

  /**
   * Mutate all source files except:
   * - src/scenes/  — Phaser scene classes use browser-only APIs (canvas, DOM)
   * - src/build-info.js — generated at build time, not meaningful to mutate
   */
  mutate: [
    'src/**/*.js',
    '!src/scenes/**/*.js',
    '!src/build-info.js',
  ],

  /** Coverage analysis is disabled; Cucumber runner reruns all tests per mutant. */
  coverageAnalysis: 'off',

  reporters: ['html', 'clear-text', 'progress'],

  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
};
