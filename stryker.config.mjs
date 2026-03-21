import { execSync } from 'child_process';

/**
 * Resolves a version string for the Stryker dashboard report.
 *
 * Returns the current git branch name so reports are grouped by branch on the
 * dashboard (e.g. "main").  Falls back to the short commit hash if the branch
 * cannot be determined (e.g. detached HEAD in CI), and to "unknown" if git is
 * unavailable entirely.
 *
 * @returns {string} The current branch name, or a short commit hash as fallback.
 */
function resolveVersion() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    if (branch !== 'HEAD') return branch;
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

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
 * Reporters:
 *   - html       — interactive report at reports/mutation/mutation.html
 *   - json       — machine-readable report at reports/mutation/mutation.json
 *   - clear-text — summary printed to stdout after the run
 *   - progress   — live progress bar during the run
 *   - dashboard  — uploads results to dashboard.stryker-mutator.io
 *                  Requires STRYKER_DASHBOARD_API_KEY to be set in the environment.
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

  /**
   * Incremental mode: reuses results from the previous run stored in
   * .stryker-tmp/incremental.json, only re-testing mutants that are new or
   * affected by code changes. Dramatically speeds up repeated runs.
   */
  incremental: true,

  reporters: ['html', 'json', 'clear-text', 'progress', 'dashboard'],

  /**
   * Dashboard reporter settings.
   * The API key must be provided via the STRYKER_DASHBOARD_API_KEY environment
   * variable — never hardcode it here.
   * The version is resolved dynamically as the current branch name so reports
   * are grouped by branch on the dashboard.
   */
  dashboard: {
    project: 'github.com/julianchurchill/2d-dungeon-crawler',
    version: resolveVersion(),
  },

  /** Write the JSON report to the same directory as the HTML report. */
  jsonReporter: {
    fileName: 'reports/mutation/mutation.json',
  },

  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
};
