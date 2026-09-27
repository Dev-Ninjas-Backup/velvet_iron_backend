const { QuestsFeedService } = require('./dist/src/quests-feed/quests-feed.service');
const { QuestType } = require('./dist/src/quests-feed/dto/quests-feed-response.dto');
const assert = require('assert');

async function test() {
  const xpStatsService = { getTodayQuestXp: async () => ({ quests: [{ id: 'codex-1', title: 'Codex', xp: 10, isDone: false }] }) };
  const customQuestService = { findAll: async () => ({ data: [{ id: 'custom-1', title: 'Custom', xpReward: 15, isCompleted: false }], meta: {} }), complete: async () => ({ success: true, xp: 15 }) };
  const medicationScheduleService = { getTodaySchedules: async () => ({ schedules: [{ id: 'med-1', name: 'Med', doseMg: 10, isTaken: true }] }), markMedicationAsTaken: async (u, id, v) => ({ success: true }) };
  const exerciseLogService = { getTodaySchedules: async () => ([{ id: 'ex-1', exerciseName: 'Run', duration: 30, isTaken: false }]), markExerciseLogAsTaken: async (u, id, v) => ({ success: true }) };

  const service = new QuestsFeedService(xpStatsService, customQuestService, medicationScheduleService, exerciseLogService);

  const res = await service.getTodaysQuests('user-1');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.length, 4);
  assert.strictEqual(res.data[0].id, 'codex_codex-1');
  assert.strictEqual(res.data[1].id, 'custom_custom-1');
  assert.strictEqual(res.data[2].id, 'med_med-1');
  assert.strictEqual(res.data[3].id, 'workout_ex-1');
  console.log('✅ getTodaysQuests passed!');

  const compRes = await service.completeQuest('user-1', { questId: 'workout_ex-1', questType: QuestType.WORKOUT_SCHEDULE });
  assert.strictEqual(compRes.success, true);
  console.log('✅ completeQuest with prefix stripping passed!');
}

test().catch(console.error);
