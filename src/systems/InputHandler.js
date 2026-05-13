/**
 * @module InputHandler
 * Handles keyboard, pointer, and EventBus input routing for GameScene.
 */

import Phaser from 'phaser';
import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { DIR } from '../utils/Direction.js';
import { FOV_STATE } from '../utils/TileTypes.js';
import { HeldMovementTracker } from '../systems/HeldMovementTracker.js';
import { HoldRepeatScheduler } from '../systems/HoldRepeatScheduler.js';
import { tilesetManager } from '../systems/TilesetManager.js';
import { isTouchDevice } from '../utils/TouchDeviceDetector.js';
import { wrapWithRunCancel } from '../utils/ActionWrapper.js';
import { handleMobileMenuPress } from '../systems/MobileMenuHandler.js';
import { applyEscPanelClose } from '../systems/EscPanelClose.js';
import { TURN_STATE } from '../systems/TurnManager.js';

/** Additional delay after the move animation before auto-repeat fires (~150 ms total). */
const MOVE_REPEAT_DELAY_MS = 70;

export class InputHandler {
  /**
   * @param {import('../scenes/GameScene.js').GameScene} scene
   */
  constructor(scene) {
    /** @private */
    this._scene = scene;
  }

  /** @private Tile size from the active tileset. */
  get _tileSize() { return tilesetManager.getTileSize(); }

  /**
   * Registers all keyboard and pointer input bindings on the scene.
   * Must be called after _runController and _runStartItems are set on the scene.
   */
  setup() {
    const sc = this._scene;

    sc.cursors = sc.input.keyboard.createCursorKeys();
    sc.wasd = sc.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // HeldMovementTracker self-registers its own keydown/keyup listeners.
    sc.heldMovement = new HeldMovementTracker(sc.input.keyboard, EventBus);
    sc._holdRepeat  = new HoldRepeatScheduler(sc.heldMovement, MOVE_REPEAT_DELAY_MS);

    // Non-movement actions: cancel any active run before executing.
    sc.input.keyboard.on('keydown-I',           wrapWithRunCancel(sc._runController, () => sc._toggleInventory()));
    sc.input.keyboard.on('keydown-K',           wrapWithRunCancel(sc._runController, () => sc._toggleSkills()));
    sc.input.keyboard.on('keydown-PERIOD',       wrapWithRunCancel(sc._runController, () => sc._tryUseStairs()));
    sc.input.keyboard.on('keydown-GREATER_THAN', wrapWithRunCancel(sc._runController, () => sc._tryUseStairs()));

    // 'l' — toggle look cursor (non-touch devices only).
    if (!isTouchDevice()) {
      sc.input.keyboard.on('keydown-L', wrapWithRunCancel(sc._runController, () => {
        if (sc._lookCursor?.active) {
          sc._lookCursor.deactivate();
          EventBus.emit(GameEvents.LOOK_HIDE);
        } else {
          sc._lookCursor?.activate(sc.player.x, sc.player.y);
          sc._showLookInfoAt(sc.player.x, sc.player.y);
        }
      }));

      // 'r' — toggle ranged-aim mode.
      sc.input.keyboard.on('keydown-R', wrapWithRunCancel(sc._runController, () => {
        sc._handleToggleRangedAim();
      }));
    }

    // ESC closes whichever panel is open (message log, sell, inventory, skills)
    // before falling through to the in-game menu — evaluated in priority order.
    sc.input.keyboard.on('keydown-ESC', wrapWithRunCancel(sc._runController, () => {
      // Look cursor takes highest priority — ESC deactivates it first.
      if (sc._lookCursor?.active) {
        sc._lookCursor.deactivate();
        EventBus.emit(GameEvents.LOOK_HIDE);
        return;
      }
      // Ranged aim mode — ESC cancels it.
      if (sc._aimingRanged) {
        sc._setAimingRanged(false);
        EventBus.emit(GameEvents.MESSAGE, 'Ranged aim cancelled.');
        return;
      }
      if (sc._messageLogOpen) {
        EventBus.emit(GameEvents.CLOSE_MESSAGE_LOG);
      } else if (sc.turnManager.state === TURN_STATE.DIALOGUE) {
        EventBus.emit(GameEvents.CLOSE_DIALOGUE);
      } else if (sc.turnManager.state === TURN_STATE.DISPLAY_CASE) {
        EventBus.emit(GameEvents.CLOSE_DISPLAY_CASE);
      } else if (sc.turnManager.state === TURN_STATE.SHOP) {
        // Close both shop panels together — UIScene handles the cascade.
        EventBus.emit(GameEvents.CLOSE_SELL_PANEL);
      } else {
        const action = applyEscPanelClose(sc.turnManager);
        if (action === 'close-inventory') {
          EventBus.emit(GameEvents.OPEN_INVENTORY, { inventory: sc.player.inventory, player: sc.player });
        } else if (action === 'close-skills') {
          EventBus.emit(GameEvents.OPEN_SKILLS, sc._buildSkillsPayload());
        } else {
          sc._openInGameMenu();
        }
      }
    }));

    // SHIFT+direction starts a run; a plain direction key cancels any active run
    // and performs a single step.
    const wUp    = wrapWithRunCancel(sc._runController, () => sc._handleDir(DIR.UP));
    const wDown  = wrapWithRunCancel(sc._runController, () => sc._handleDir(DIR.DOWN));
    const wLeft  = wrapWithRunCancel(sc._runController, () => sc._handleDir(DIR.LEFT));
    const wRight = wrapWithRunCancel(sc._runController, () => sc._handleDir(DIR.RIGHT));

    sc.input.keyboard.on('keydown-UP',    (e) => { if (e.shiftKey) { sc._startRun(DIR.UP);    } else { wUp();    } });
    sc.input.keyboard.on('keydown-DOWN',  (e) => { if (e.shiftKey) { sc._startRun(DIR.DOWN);  } else { wDown();  } });
    sc.input.keyboard.on('keydown-LEFT',  (e) => { if (e.shiftKey) { sc._startRun(DIR.LEFT);  } else { wLeft();  } });
    sc.input.keyboard.on('keydown-RIGHT', (e) => { if (e.shiftKey) { sc._startRun(DIR.RIGHT); } else { wRight(); } });
    sc.input.keyboard.on('keydown-W',     (e) => { if (e.shiftKey) { sc._startRun(DIR.UP);    } else { wUp();    } });
    sc.input.keyboard.on('keydown-S',     (e) => { if (e.shiftKey) { sc._startRun(DIR.DOWN);  } else { wDown();  } });
    sc.input.keyboard.on('keydown-A',     (e) => { if (e.shiftKey) { sc._startRun(DIR.LEFT);  } else { wLeft();  } });
    sc.input.keyboard.on('keydown-D',     (e) => { if (e.shiftKey) { sc._startRun(DIR.RIGHT); } else { wRight(); } });

    // Pointer click/touch — look at the tapped cell without advancing the turn.
    sc.input.on('pointerdown', (pointer) => this._handleLookClick(pointer));
  }

  /**
   * Registers EventBus input-routing handlers: D-pad, mobile menu, and
   * the UI-button equivalents of keyboard actions.
   */
  setupEvents() {
    const sc = this._scene;

    // D-pad presses from UIScene — cancel any active run first (mirrors keyboard behaviour).
    EventBus.on(GameEvents.DPAD_PRESS, wrapWithRunCancel(sc._runController, (dir) => sc._handleDir(dir)), sc);
    // D-pad double-tap starts a run (equivalent to SHIFT+direction on keyboard).
    EventBus.on(GameEvents.DPAD_RUN, (dir) => sc._startRun(dir), sc);
    // Mobile menu button (≡): cancel run, then close message log if open or open in-game menu.
    EventBus.on(GameEvents.OPEN_IN_GAME_MENU, () => {
      sc._runController.cancel();
      handleMobileMenuPress(
        sc._messageLogOpen,
        () => EventBus.emit(GameEvents.CLOSE_MESSAGE_LOG),
        () => sc._openInGameMenu(),
      );
    }, sc);
    EventBus.on(GameEvents.TOGGLE_INVENTORY,  wrapWithRunCancel(sc._runController, () => sc._toggleInventory()), sc);
    EventBus.on(GameEvents.TOGGLE_SKILLS,     wrapWithRunCancel(sc._runController, () => sc._toggleSkills()), sc);
    EventBus.on(GameEvents.TOGGLE_RANGED_AIM, wrapWithRunCancel(sc._runController, () => sc._handleToggleRangedAim()), sc);
    EventBus.on(GameEvents.USE_STAIRS, wrapWithRunCancel(sc._runController, () => sc._tryUseStairs()), sc);
  }

  /**
   * Maps a screen-space pointer position to tile coordinates and shows look info.
   * Only acts when the player can take input.
   * @private
   * @param {Phaser.Input.Pointer} pointer
   */
  _handleLookClick(pointer) {
    const sc = this._scene;
    if (sc.turnManager.state !== TURN_STATE.PLAYER_INPUT) return;

    // A click while the cursor is active deactivates it.
    if (sc._lookCursor?.active) {
      sc._lookCursor.deactivate();
    }

    // Convert screen-space pointer position to world-space tile coordinates.
    const world = sc.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tileSize = this._tileSize;
    const tx = Math.floor(world.x / tileSize);
    const ty = Math.floor(world.y / tileSize);

    // Only reveal info for tiles currently in the player's line of sight.
    if (!sc.dungeonMap.inBounds(tx, ty)) return;
    if (sc.dungeonMap.getFovState(tx, ty) !== FOV_STATE.VISIBLE) return;

    sc._showLookInfoAt(tx, ty);
  }
}
