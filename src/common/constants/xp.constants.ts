/**
 * Centralized XP configuration for Velvet & Iron platform.
 * Single source of truth for action logging rewards, daily quests, and daily login.
 */
export const XP_REWARDS = {
  // Daily Login Claim Reward
  DAILY_LOGIN: 25,

  // Action Logging (Immediate XP on entry)
  MOOD_LOG: 30, // Spirit (Mood Check)
  MEAL_LOG: 10,
  EXERCISE_LOG: 10,
  MEDICATION_LOG: 10,
  WEIGHT_LOG: 10,
  SCHEDULE_ITEM_COMPLETION: 10,

  // Daily Codex Quests (Quests screen & XP stats evaluation)
  QUESTS: {
    TRACK_YOUR_SHOT: 10,
    THREE_MEALS: 30,
    MOOD_CHECK: 30, // Spirit
    STEP_MASTER: 20,
    TITANS_NOURISHMENT: 30, // Titan's Nourishment (>= 30g single-meal protein)
    MANA_INFUSION: 20,
  },

  // Custom Quests
  CUSTOM_QUEST: {
    MIN_XP: 5,
    MAX_XP: 15,
    DEFAULT_XP: 10,
    DAILY_TOTAL_CAP: 50,
  },
} as const;


