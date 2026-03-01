export default {
  default: {
    paths: ['features/**/*.feature'],
    import: ['features/step-definitions/**/*.js', 'features/support/world.js'],
    loader: ['./features/support/phaser-loader.mjs'],
    format: ['progress-bar'],
  },
};
