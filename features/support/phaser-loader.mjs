/**
 * Node.js ESM loader hook.
 * Intercepts `import 'phaser'` and redirects it to the test mock,
 * preventing browser-only Phaser code from running in Node.js.
 */
export function resolve(specifier, context, nextResolve) {
  if (specifier === 'phaser') {
    return {
      shortCircuit: true,
      url: new URL('./mocks/phaser.mjs', import.meta.url).href,
    };
  }
  return nextResolve(specifier, context);
}
