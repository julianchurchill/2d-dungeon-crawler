/**
 * SkillEventHandler — skill and achievement-skill event handling for GameScene.
 *
 * Encapsulates the skill upgrade/downgrade/activate handlers and the
 * achievement-to-skill grant/revoke handlers previously living in GameScene.
 */

import { EventBus }       from '../utils/EventBus.js';
import { GameEvents }     from '../events/GameEvents.js';
import { HuntingSkill }   from '../skills/HuntingSkill.js';
import { NightVisionSkill } from '../skills/NightVisionSkill.js';

export class SkillEventHandler {
  /**
   * @param {import('../scenes/GameScene.js').GameScene} scene
   */
  constructor(scene) {
    /** @private */
    this._scene = scene;
  }

  // ── Public methods ────────────────────────────────────────────────────────

  /**
   * Upgrades the named skill via SkillSystem and refreshes the SkillsPanel.
   * @param {string} skillId
   */
  handleUpgradeSkill(skillId) {
    const sc = this._scene;
    if (sc.player.skillSystem) {
      sc.player.skillSystem.upgradeSkill(skillId);
    }
    // Re-emit with forceRefresh so the panel re-renders without toggling.
    EventBus.emit(GameEvents.OPEN_SKILLS, { ...this._buildSkillsPayload(), forceRefresh: true });
  }

  /**
   * Downgrades the named skill via SkillSystem and refreshes the SkillsPanel.
   * @param {string} skillId
   */
  handleDowngradeSkill(skillId) {
    const sc = this._scene;
    if (sc.player.skillSystem) {
      sc.player.skillSystem.downgradeSkill(skillId);
    }
    EventBus.emit(GameEvents.OPEN_SKILLS, { ...this._buildSkillsPayload(), forceRefresh: true });
  }

  /**
   * Activates the named inactive skill via SkillSystem and refreshes the SkillsPanel.
   * @param {string} skillId
   */
  handleActivateSkill(skillId) {
    const sc = this._scene;
    if (sc.player.skillSystem) {
      sc.player.skillSystem.activateSkill(skillId);
    }
    EventBus.emit(GameEvents.OPEN_SKILLS, { ...this._buildSkillsPayload(), forceRefresh: true });
  }

  /**
   * Grants the skill associated with a newly unlocked achievement.
   * Permanent skills are applied immediately; pool skills are added to the
   * inactive list for the player to activate on a future level-up.
   *
   * @param {string} achievementId
   */
  handleAchievementSkillUnlock(achievementId) {
    const skillSystem = this._scene.player?.skillSystem;
    if (!skillSystem) return;

    const PERMANENT_SKILLS = {
      goblin_killer:            () => new HuntingSkill('GOBLIN_HUNTING'),
      orc_killer:               () => new HuntingSkill('ORC_HUNTING'),
      troll_killer:             () => new HuntingSkill('TROLL_HUNTING'),
      cockroach_killer:         () => new HuntingSkill('COCKROACH_HUNTING'),
      sprite_killer:            () => new HuntingSkill('SPRITE_HUNTING'),
      mass_slayer:              () => new HuntingSkill('CREEPING_MASS_HUNTING'),
      skeleton_killer:          () => new HuntingSkill('SKELETON_HUNTING'),
      skeleton_warrior_killer:  () => new HuntingSkill('SKELETON_WARRIOR_HUNTING'),
      skeleton_mage_killer:     () => new HuntingSkill('SKELETON_MAGE_HUNTING'),
    };

    const POOL_SKILLS = {
      burrower: () => new NightVisionSkill(),
    };

    const permanentFactory = PERMANENT_SKILLS[achievementId];
    if (permanentFactory) {
      const skill = permanentFactory();
      skillSystem.unlockPermanentSkill(skill);
      EventBus.emit(GameEvents.MESSAGE, `Permanent skill unlocked: ${skill.name}!`);
      return;
    }

    const poolFactory = POOL_SKILLS[achievementId];
    if (poolFactory) {
      const skill = poolFactory();
      skillSystem.unlockSkill(skill);
      EventBus.emit(GameEvents.MESSAGE, `New skill available: ${skill.name}! Select it on your next level up.`);
    }
  }

  /**
   * Removes the skill associated with a re-locked achievement.
   * Only called in dev mode when an achievement is toggled off.
   *
   * @param {string} achievementId
   */
  handleAchievementSkillLock(achievementId) {
    const skillSystem = this._scene.player?.skillSystem;
    if (!skillSystem) return;

    const SKILL_IDS = {
      goblin_killer:            'goblin_hunting',
      orc_killer:               'orc_hunting',
      troll_killer:             'troll_hunting',
      cockroach_killer:         'cockroach_hunting',
      sprite_killer:            'sprite_hunting',
      mass_slayer:              'creeping_mass_hunting',
      skeleton_killer:          'skeleton_hunting',
      skeleton_warrior_killer:  'skeleton_warrior_hunting',
      skeleton_mage_killer:     'skeleton_mage_hunting',
      burrower:                 'night_vision',
    };

    const skillId = SKILL_IDS[achievementId];
    if (skillId) skillSystem.removeSkill(skillId);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Builds the payload for the OPEN_SKILLS event.
   * @returns {{ skills: object[], inactiveSkills: object[] }}
   */
  _buildSkillsPayload() {
    const skillSystem = this._scene.player.skillSystem;
    const skills         = skillSystem ? skillSystem.getSkills()         : [];
    const inactiveSkills = skillSystem ? skillSystem.getInactiveSkills() : [];
    return { skills, inactiveSkills };
  }
}
