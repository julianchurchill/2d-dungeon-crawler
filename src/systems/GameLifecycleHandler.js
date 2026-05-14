import { EventBus } from '../utils/EventBus.js';
import { GameEvents } from '../events/GameEvents.js';
import { TURN_STATE, TurnManager } from '../systems/TurnManager.js';
import { FloorManager } from '../systems/FloorManager.js';
import { Player } from '../entities/Player.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { LuckyStrikeSkill } from '../skills/LuckyStrikeSkill.js';
import { FerocitySkill } from '../skills/FerocitySkill.js';
import { DodgeSkill } from '../skills/DodgeSkill.js';
import { createRNG } from '../utils/RNG.js';
import { isDevEnvironment } from '../utils/Environment.js';
import { saveGame, serializeFloor, deleteSave } from '../save/SaveGame.js';
import { uniqueRoomRegistry } from '../dungeon/UniqueRoomRegistry.js';
import { restoreInventoryAndEquipment } from '../save/restorePlayer.js';
import { createSkillFromData } from '../save/SkillFactory.js';
import { recordGlobalDeath } from '../save/GlobalStatsStore.js';

/**
 * GameLifecycleHandler — game-over, restart, resurrect, save-and-exit, and
 * save-restore logic for GameScene.
 *
 * Encapsulates the lifecycle event handlers previously living in GameScene:
 * handling player death, restarting to the main menu, dev-mode resurrection,
 * saving and exiting, and restoring game state from a save file.
 */
export class GameLifecycleHandler {
  /**
   * @param {import('../scenes/GameScene.js').GameScene} scene
   */
  constructor(scene) {
    /** @private */
    this._scene = scene;
  }

  /** Triggers the game-over sequence: emits GAME_OVER, wires restart/resurrect keys. */
  gameOver() {
    const sc = this._scene;
    recordGlobalDeath();
    EventBus.emit(GameEvents.LOOK_HIDE);
    sc._lookCursor?.deactivate();
    EventBus.emit(GameEvents.GAME_OVER);
    sc.turnManager.setState(TURN_STATE.GAME_OVER);

    if (isDevEnvironment()) {
      EventBus.emit(GameEvents.MESSAGE, 'You died! Press R to restart or U to resurrect.');

      const onRestart = () => {
        sc.input.keyboard.off('keydown-U', onResurrect);
        deleteSave(sc._slot);
        this.restart();
      };
      const onResurrect = () => {
        sc.input.keyboard.off('keydown-R', onRestart);
        this.resurrect();
      };
      sc.input.keyboard.once('keydown-R', onRestart);
      sc.input.keyboard.once('keydown-U', onResurrect);
      EventBus.once(GameEvents.RESTART_GAME, () => {
        sc.input.keyboard.off('keydown-R', onRestart);
        sc.input.keyboard.off('keydown-U', onResurrect);
        deleteSave(sc._slot);
        this.restart();
      });
    } else {
      deleteSave(sc._slot);
      EventBus.emit(GameEvents.MESSAGE, 'You died! Press R to restart.');
      sc.input.keyboard.once('keydown-R', () => this.restart());
      EventBus.once(GameEvents.RESTART_GAME, () => this.restart());
    }
  }

  /** Restores the player to full HP and resumes (dev mode only). */
  resurrect() {
    const sc = this._scene;
    sc.player.resurrect();
    sc._setAimingRanged(false);
    sc.turnManager.setState(TURN_STATE.PLAYER_INPUT);
    sc._syncRegistry();
    EventBus.emit(GameEvents.MESSAGE, 'Resurrected! HP fully restored.');
  }

  /** Tears down the current run and transitions back to the main menu. */
  restart() {
    const sc = this._scene;
    sc._autosaveTimer?.stop();
    EventBus.emit(GameEvents.LOOK_HIDE);
    sc._lookCursor?.deactivate();
    EventBus.removeAllListeners();

    sc.rng = createRNG(Date.now());
    sc.player = new Player(0, 0, new SkillSystem(sc.rng, [new LuckyStrikeSkill()], [new FerocitySkill(), new DodgeSkill()]));
    sc.floorManager = new FloorManager();
    sc.turnManager = new TurnManager();
    sc.playerSprite = null;

    sc.scene.stop('UIScene');
    sc.cameras.main.fadeOut(300, 0, 0, 0);
    sc.time.delayedCall(350, () => {
      sc.scene.start('MainMenuScene');
      sc.scene.stop('GameScene');
    });
  }

  /** Saves the current floor state and restarts back to the main menu. */
  handleSaveAndExit() {
    const sc = this._scene;
    saveGame(
      sc.player,
      sc.floorManager,
      serializeFloor(sc.dungeonMap, sc.enemies, sc.items, sc.player, uniqueRoomRegistry, sc._entryTracker, sc.npcs),
      sc._slot,
    );
    this.restart();
  }

  /**
   * Applies a loaded save to the scene's player and floorManager.
   * @param {object} saveData
   */
  applyLoadedSave(saveData) {
    const sc = this._scene;
    if (!saveData) return;

    Object.assign(sc.player.stats, saveData.player.stats);
    sc.player.gold = saveData.player.gold;

    restoreInventoryAndEquipment(sc.player, saveData.player);

    if (sc.player.skillSystem && saveData.player.activeSkills) {
      sc.player.skillSystem._activeSkills =
        saveData.player.activeSkills.map(createSkillFromData).filter(Boolean);
      sc.player.skillSystem._inactiveSkills =
        saveData.player.inactiveSkills.map(createSkillFromData).filter(Boolean);
    }

    if (saveData.player.runStats) {
      sc.player.runStats = {
        deepestFloor:    saveData.player.runStats.deepestFloor    ?? 1,
        kills:           { ...(saveData.player.runStats.kills           ?? {}) },
        consumablesUsed: { ...(saveData.player.runStats.consumablesUsed ?? {}) },
        wallsBroken:     saveData.player.runStats.wallsBroken     ?? 0,
        goldGained:      saveData.player.runStats.goldGained      ?? 0,
        goldSpent:       saveData.player.runStats.goldSpent       ?? 0,
      };
    }

    sc.floorManager.currentFloor = saveData.floor;

    if (saveData.floorState?.uniqueRooms) {
      const { seen, entered } = saveData.floorState.uniqueRooms;
      for (const id of seen)    uniqueRoomRegistry.markSeen(id);
      for (const id of entered) uniqueRoomRegistry.markEntered(id);
    }

    sc._pendingFloorRestore = saveData.floorState ?? null;
  }
}
