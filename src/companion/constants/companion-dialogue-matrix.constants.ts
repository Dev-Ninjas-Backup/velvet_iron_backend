export enum DialogueTriggerContext {
  MILESTONE_LEVEL_UP = 'MILESTONE_LEVEL_UP',
  STREAK_AT_RISK = 'STREAK_AT_RISK',
  POST_WORKOUT = 'POST_WORKOUT',
  POST_MEAL = 'POST_MEAL',
  REENGAGEMENT = 'REENGAGEMENT',
  PENDING_SCHEDULE = 'PENDING_SCHEDULE',
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
}

export interface CompanionDialogueEntry {
  text: string;
  actionPrompt?: string;
}

export type CompanionDialogueMatrix = Record<
  string,
  Partial<Record<DialogueTriggerContext, CompanionDialogueEntry[]>>
>;

export const COMPANION_DIALOGUE_MATRIX: CompanionDialogueMatrix = {
  riven: {
    [DialogueTriggerContext.MILESTONE_LEVEL_UP]: [
      { text: 'Look at you gaining power. Almost worthy of my court.', actionPrompt: 'Inspect New Perks' },
      { text: 'More power suits you. Do not let it make you careless.', actionPrompt: 'Keep Ascending' },
    ],
    [DialogueTriggerContext.STREAK_AT_RISK]: [
      { text: 'Are we letting your streak slip away tonight? Unacceptable.', actionPrompt: 'Log Today\'s Progress' },
      { text: 'Midnight approaches, darling. Do not surrender what took days to build.', actionPrompt: 'Log a Quick Entry' },
    ],
    [DialogueTriggerContext.POST_WORKOUT]: [
      { text: 'Not bad at all. I suppose I can allow you a moment of rest.', actionPrompt: 'Hydrate & Refuel' },
      { text: 'Good form. Empires are built on sweat and ambition.', actionPrompt: 'Log Your Meal' },
    ],
    [DialogueTriggerContext.POST_MEAL]: [
      { text: 'Fuel for the fire. Make sure it was worth the calories.', actionPrompt: 'Review Macro Goals' },
      { text: 'Nourishment noted. Let us see how that serves tomorrow\'s efforts.', actionPrompt: 'View Today\'s Logs' },
    ],
    [DialogueTriggerContext.REENGAGEMENT]: [
      { text: 'Time passed. You returned. That is the whole story. Welcome back.', actionPrompt: 'Start Fresh Today' },
      { text: 'Did you think I would not notice your absence? Let us begin again.', actionPrompt: 'Log First Activity' },
    ],
    [DialogueTriggerContext.PENDING_SCHEDULE]: [
      { text: 'You have unfinished business on today\'s ledger.', actionPrompt: 'View Scheduled Tasks' },
    ],
    [DialogueTriggerContext.MORNING]: [
      { text: 'Good morning, darling. Try not to declare war before breakfast.', actionPrompt: 'Log Breakfast' },
      { text: 'The day begins. Let us see what you conquer today.', actionPrompt: 'Check Daily Goals' },
    ],
    [DialogueTriggerContext.AFTERNOON]: [
      { text: 'Midday already. Keep your focus sharp.', actionPrompt: 'Log Lunch or Workout' },
      { text: 'Do not lose momentum in the heat of the day.', actionPrompt: 'Check In' },
    ],
    [DialogueTriggerContext.EVENING]: [
      { text: 'The shadows lengthen. Finish what you started today.', actionPrompt: 'Review Daily Progress' },
    ],
    [DialogueTriggerContext.NIGHT]: [
      { text: 'Rest now. Even the darkest flame needs silence to burn again tomorrow.', actionPrompt: 'Rest & Recover' },
    ],
  },
  thyra: {
    [DialogueTriggerContext.MILESTONE_LEVEL_UP]: [
      { text: 'Honorable progress! Your discipline shines through, warrior.', actionPrompt: 'Celebrate Milestone' },
      { text: 'Every level is forged in patience. Well earned.', actionPrompt: 'Inspect Progress' },
    ],
    [DialogueTriggerContext.STREAK_AT_RISK]: [
      { text: 'Before you sleep, guard your streak. Record your day.', actionPrompt: 'Log Daily Activity' },
      { text: 'Stand fast! Do not let the day slip by unrecorded.', actionPrompt: 'Secure Your Streak' },
    ],
    [DialogueTriggerContext.POST_WORKOUT]: [
      { text: 'Well fought! Your strength grows with every honest rep.', actionPrompt: 'Cool Down & Stretch' },
      { text: 'A shield is forged under pressure. Excellent work today.', actionPrompt: 'Refuel With Protein' },
    ],
    [DialogueTriggerContext.POST_MEAL]: [
      { text: 'Good nourishment keeps the shield steady. Rest and recover.', actionPrompt: 'Check Hydration' },
    ],
    [DialogueTriggerContext.REENGAGEMENT]: [
      { text: 'The shield does not judge you for laying it down. Rise again.', actionPrompt: 'Take Up the Shield' },
      { text: 'A warrior always finds the path back. Glad to have you by my side.', actionPrompt: 'Start With a Walk' },
    ],
    [DialogueTriggerContext.PENDING_SCHEDULE]: [
      { text: 'Duty calls. A routine awaits your attention.', actionPrompt: 'View Scheduled Session' },
    ],
    [DialogueTriggerContext.MORNING]: [
      { text: 'Morning. Clear eyes, steady breath. The day begins.', actionPrompt: 'Prepare for the Day' },
      { text: 'Rise with purpose. Your training starts with the first choice today.', actionPrompt: 'Log Morning Routine' },
    ],
    [DialogueTriggerContext.AFTERNOON]: [
      { text: 'Stand strong through midday fatigue. Half the battle is won.', actionPrompt: 'Log Lunch' },
    ],
    [DialogueTriggerContext.EVENING]: [
      { text: 'The sun sets on another day of effort. Guard your gains.', actionPrompt: 'Review Today\'s Log' },
    ],
    [DialogueTriggerContext.NIGHT]: [
      { text: 'Rest your armor. True recovery happens in peace tonight.', actionPrompt: 'Sleep Well' },
    ],
  },
  leon: {
    [DialogueTriggerContext.MILESTONE_LEVEL_UP]: [
      { text: 'Promotion earned. Maintain this standard of discipline.', actionPrompt: 'Acknowledge Promotion' },
      { text: 'Rank increase validated. Greater expectations now follow.', actionPrompt: 'Inspect Stats' },
    ],
    [DialogueTriggerContext.STREAK_AT_RISK]: [
      { text: 'Discipline checkpoint: You have 0 entries logged for today.', actionPrompt: 'Submit Status Report' },
      { text: 'Maintain formation. Do not break the operational chain.', actionPrompt: 'Log Activity Now' },
    ],
    [DialogueTriggerContext.POST_WORKOUT]: [
      { text: 'Drill complete. Form and execution noted. Good work.', actionPrompt: 'Record Recovery' },
      { text: 'Sweat in peace means strength in battle. Proceed to recovery.', actionPrompt: 'Log Nutrition' },
    ],
    [DialogueTriggerContext.POST_MEAL]: [
      { text: 'Rations consumed. Ready for the next objective.', actionPrompt: 'Review Daily Schedule' },
    ],
    [DialogueTriggerContext.REENGAGEMENT]: [
      { text: 'Absence noted. Status reset. Report for duty when ready.', actionPrompt: 'Resume Training' },
      { text: 'No excuses required. Fall in and execute today\'s plan.', actionPrompt: 'Start Daily Drill' },
    ],
    [DialogueTriggerContext.PENDING_SCHEDULE]: [
      { text: 'Direct order: Review your pending operational schedule.', actionPrompt: 'Inspect Schedule' },
    ],
    [DialogueTriggerContext.MORNING]: [
      { text: 'Morning briefing: do what matters first.', actionPrompt: 'Set Daily Objective' },
      { text: 'Roll call. The day belongs to those who take initiative early.', actionPrompt: 'Start Morning Plan' },
    ],
    [DialogueTriggerContext.AFTERNOON]: [
      { text: 'Midday status: maintain operational tempo.', actionPrompt: 'Check Afternoon Routine' },
    ],
    [DialogueTriggerContext.EVENING]: [
      { text: 'Evening debriefing: finalize your logs before lights out.', actionPrompt: 'Complete Logs' },
    ],
    [DialogueTriggerContext.NIGHT]: [
      { text: 'Stand down for the night. Sleep is an essential tactical requirement.', actionPrompt: 'Sign Off' },
    ],
  },
  visepheron: {
    [DialogueTriggerContext.MILESTONE_LEVEL_UP]: [
      { text: 'Your ember grows brighter, little flame. The mountain takes notice.', actionPrompt: 'Admire Growth' },
    ],
    [DialogueTriggerContext.STREAK_AT_RISK]: [
      { text: 'Do not let today\'s ember cool before it leaves its mark.', actionPrompt: 'Kindle the Flame' },
    ],
    [DialogueTriggerContext.POST_WORKOUT]: [
      { text: 'Stone is carved stroke by stroke. Your wings grow stronger.', actionPrompt: 'Rest in Stillness' },
    ],
    [DialogueTriggerContext.POST_MEAL]: [
      { text: 'Earth provides sustenance so dragons may soar. Digest in peace.', actionPrompt: 'Breathe Steady' },
    ],
    [DialogueTriggerContext.REENGAGEMENT]: [
      { text: 'The road did not vanish while you were gone. You need not apologize to me for being human.', actionPrompt: 'Step Forward Again' },
    ],
    [DialogueTriggerContext.PENDING_SCHEDULE]: [
      { text: 'Patience and consistency move mountains. Your schedule awaits.', actionPrompt: 'Attend to Schedule' },
    ],
    [DialogueTriggerContext.MORNING]: [
      { text: 'Morning is merely an invitation to begin again. Steady, little flame.', actionPrompt: 'Begin Gently' },
    ],
    [DialogueTriggerContext.AFTERNOON]: [
      { text: 'The sun crests high. Move with the deliberate calm of ages.', actionPrompt: 'Refuel' },
    ],
    [DialogueTriggerContext.EVENING]: [
      { text: 'Twilight approaches. What did you learn of your own power today?', actionPrompt: 'Reflect' },
    ],
    [DialogueTriggerContext.NIGHT]: [
      { text: 'Close your eyes. Even the stars rest between seasons.', actionPrompt: 'Peaceful Rest' },
    ],
  },
};
