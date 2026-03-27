# UI Style Guide

Reference for building consistent UI panels in the dungeon crawler.
Follow these conventions when adding new panels or modifying existing ones.

---

## Font

All UI text must use the shared constant from `src/utils/FontConfig.js`:

```js
import { FONT_FAMILY } from '../utils/FontConfig.js';
// FONT_FAMILY === 'Roboto Mono'
```

Always set `resolution: 2` on Phaser text objects for crisp rendering at any
display density.

---

## Panel Container

| Property | Value |
| --- | --- |
| `setDepth` | `300` |
| `setScrollFactor` | `0` (fixed to the screen, not the world) |
| Initial visibility | `false` — call `setVisible(true)` in `show()` |

---

## Panel Background

| Property | Value |
| --- | --- |
| Fill color | `0x111122` |
| Fill alpha | `0.95` |
| Stroke color | `0x4466aa` (blue) |
| Stroke width | `2` |

Shop panels may use a green stroke (`0x44aa66`) to reinforce their distinct
context. New panels should use the blue default unless there is a strong
thematic reason to differ.

---

## Panel Title

| Property | Value |
| --- | --- |
| Font size | `'12px'` |
| Color | `'#aaccff'` |
| Stroke | `'#000000'`, `strokeThickness: 2` |
| Position | `(panelW / 2, 10)` |
| Origin | `(0.5, 0)` — horizontally centred, anchored to the top |
| Word wrap | `{ width: panelW - PANEL_PAD * 2 }` |
| Alignment | `'center'` |
| Casing | Title case — e.g. `'Inventory'`, `'Skills'` |

On **non-touch** devices, append keyboard hints to the title string:

```js
// Example pattern
isTouchDev ? 'Panel Name' : 'Panel Name  [Key] action'
```

Export the title-building function so it can be tested without Phaser:

```js
export function getMyPanelTitle(isTouchDev) { ... }
```

---

## Close Button (✕)

| Property | Value |
| --- | --- |
| Text | `'✕'` |
| Font size | `'14px'` |
| Color (default) | `'#aaccff'` |
| Color (hover) | `'#ffffff'` |
| Stroke | `'#000000'`, `strokeThickness: 2` |
| Position | `(panelW - PANEL_PAD / 2, 10)` |
| Origin | `(1, 0)` — anchored to the top-right corner of the panel |
| Interactivity | `setInteractive({ useHandCursor: true })` |

Always attach hover color effects:

```js
closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
closeBtn.on('pointerout',  () => closeBtn.setColor('#aaccff'));
```

The close button must emit an EventBus event — **do not** call `hide()`
directly — so that `GameScene` can update `TurnManager` state and keep
the panel and the game state in sync:

```js
closeBtn.on('pointerdown', () => EventBus.emit(GameEvents.TOGGLE_MY_PANEL));
```

On **non-touch** devices the keyboard shortcut replaces the close button.
Show the ✕ button unconditionally only on panels that have no keyboard
shortcut (e.g. the sell panel, which closes with ESC).

> **Note — `SellPanel` exception:** `SellPanel` predates this convention and
> calls `this.hide()` directly from the close button. Its `hide()` method
> emits `SELL_PANEL_TOGGLED` which `GameScene` uses to reset `TurnManager`
> state. New panels should follow the EventBus-emit pattern above.

---

## ESC Key Behaviour

ESC is handled centrally in `GameScene`'s `keydown-ESC` handler. The
priority order is:

1. Message log open → close message log
2. Sell panel open (`TURN_STATE.SHOP`) → close sell panel *(checked directly
   in `GameScene` before calling `applyEscPanelClose`)*
3. Inventory open (`TURN_STATE.INVENTORY`) → close inventory
4. Skills open (`TURN_STATE.SKILLS`) → close skills panel
5. Nothing open → open the in-game menu

Cases 3–4 are handled by the pure helper `applyEscPanelClose`
(`src/systems/EscPanelClose.js`), which transitions the `TurnManager` state
and returns an action token that `GameScene` dispatches on.

To make a new panel closeable with ESC:

1. Add a `TURN_STATE` value for the new panel in `src/systems/TurnManager.js`.
2. Set that state in `GameScene` when the panel opens.
3. Add a case in `applyEscPanelClose` and a corresponding branch in the ESC
   handler in `GameScene`.
4. Write a Cucumber scenario in `features/esc-panel-close.feature` to cover
   the new case.

---

## TurnManager Integration

Every panel that blocks player movement must own a `TURN_STATE` value.
`GameScene` sets this state when the panel opens and resets it to
`PLAYER_INPUT` when the panel closes.

Panel toggle helpers (e.g. `applyInventoryToggle`, `applySkillsToggle`,
`applyEscPanelClose`) are **pure functions** that accept a `TurnManager`
and return a boolean or action token. Keep this logic out of Phaser scenes
so it can be tested without Phaser.

---

## Keyboard Hints in Titles

Show keyboard hints only on non-touch devices. Use the `isTouchDevice()`
helper from `src/utils/TouchDeviceDetector.js` and pass the result into
the title-building function at construction time:

```js
import { isTouchDevice } from '../utils/TouchDeviceDetector.js';

// In _build():
const title = scene.add.text(panelW / 2, 10, getMyPanelTitle(isTouchDevice()), { ... });
```

---

## Checklist for New Panels

- [ ] `FONT_FAMILY` used for all text; `resolution: 2` set on all text objects
- [ ] Container at `depth: 300`, `scrollFactor: 0`, initially hidden
- [ ] Background: fill `0x111122`, alpha `0.95`, stroke `0x4466aa` width `2`
- [ ] Title: `12px`, `#aaccff`, centred at `(panelW / 2, 10)`, title case
- [ ] Close button: `14px`, `#aaccff`/`#ffffff` hover, at `(panelW - PANEL_PAD / 2, 10)`, origin `(1, 0)`
- [ ] Close button emits an EventBus event (not `hide()` directly)
- [ ] `TURN_STATE` value added and wired in `GameScene`
- [ ] ESC closes the panel (add case to `applyEscPanelClose` + feature scenario)
- [ ] Title-building function exported and tested independently of Phaser
- [ ] Touch vs non-touch: close button shown on touch; keyboard hint shown on non-touch
