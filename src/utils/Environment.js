/**
 * @module Environment
 * @description Utilities for detecting the current runtime environment.
 * Dependencies are injectable so behaviour can be verified in unit tests
 * without relying on the Vite build pipeline.
 */

/**
 * Returns true when the application is running in development mode.
 *
 * In a Vite build, `import.meta.env.DEV` is `true` during `vite dev` and
 * `false` in a production build.  The `env` parameter can be injected in
 * tests to simulate either environment without a real Vite context.
 *
 * @param {object} [env=import.meta.env] - The Vite env object (injectable for testing).
 * @returns {boolean} True if the DEV flag is set on the env object.
 */
export function isDevEnvironment(env = import.meta.env) {
  return env?.DEV === true;
}
