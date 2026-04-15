/**
 * @module HelpContent
 * @description Pure data for the in-game help screen.
 * Returns device-appropriate control instructions so the help screen
 * can be tested independently of Phaser.
 */

/**
 * @typedef {{ heading: string, lines: string[] }} HelpSection
 */

/**
 * Returns the help content sections appropriate for the current device.
 * Touch devices receive button-based controls; non-touch devices receive
 * keyboard bindings.
 *
 * @param {boolean} isTouchDev - True when running on a touchscreen device.
 * @returns {HelpSection[]}
 */
export function getHelpContent(isTouchDev) {
  if (isTouchDev) {
    return [
      {
        heading: 'MOVEMENT',
        lines: [
          'Tap a direction button to move',
          'double-tap a direction button to run',
          'Hold a direction button to keep moving',
        ],
      },
      {
        heading: 'ACTIONS',
        lines: [
          'INV    \u2014 open / close inventory',
          'SKILLS \u2014 open skills',
          '\u25bc\u25bc     \u2014 use stairs',
          '\u2261      \u2014 open this menu',
        ],
      },
    ];
  }
  return [
    {
      heading: 'MOVEMENT',
      lines: [
        'Arrow keys or WASD to move',
        'SHIFT + direction to run',
        'Hold a key to keep moving',
      ],
    },
    {
      heading: 'ACTIONS',
      lines: [
        'I       \u2014 open / close inventory',
        'k       \u2014 open skills',
        'l       \u2014 look cursor',
        '. or >  \u2014 use stairs',
        'ESC     \u2014 open this menu',
      ],
    },
    {
      heading: 'INVENTORY',
      lines: [
        'Arrow keys or WASD to navigate',
        'ENTER to use or equip item',
      ],
    },
  ];
}
