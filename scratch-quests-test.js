const { QuestsFeedService } = require('./dist/src/quests-feed/quests-feed.service');
const assert = require('assert');

async function test() {
  const MOCK_USER_ID = 'user123';
  let logsCreated = [];

  const PrismaMock = {
    client: {
      scheduleCompletionLog: {
        findMany: async () => [{ scheduleItemId: 'sched2' }],
        findFirst: async (args) => {
          if (args.where.scheduleItemId === 'sched2') return { id: 'log1' };
          return null;
        },
        create: async (args) => {
          logsCreated.push(args.data);
          return { id: 'log2', ...args.data };
        }
      },
      scheduleItem: {
        findFirst: async (args) => {
          return { id: args.where.id, userId: args.where.userId, title: 'Test Schedule' };
        }
      },
      userProfile: {
        findUnique: async () => ({ totalEarnXp: 100, level: 2 })
      }
    }
  };

  const XpStatsMock = {
    getTodayQuestXp: async () => ({
      quests: [
        { id: 'codex1', title: 'Codex 1', xp: 30, isDone: true }
      ]
    })
  };

  const CustomQuestMock = {
    findAll: async () => ({
      data: [
        { id: 'custom1', name: 'Custom 1', xpReward: 15, isCompleted: false }
      ],
      meta: { todayCustomXpEarned: 10, dailyCustomXpCap: 50 }
    }),
    complete: async (userId, id) => ({
      success: true,
      data: { id: `custom_${id}`, xpAwarded: 15 }
    })
  };

  const SchedulesMock = {
    findAll: async () => ({
      data: [
        { id: 'sched1', title: 'Med 1', itemType: 'MEDICATION' },
        { id: 'sched2', title: 'Workout 1', itemType: 'WORKOUT' }
      ]
    })
  };

  const LeveladdMock = {
    addXpToUser: async () => {}
  };

  const service = new QuestsFeedService(
    PrismaMock,
    XpStatsMock,
    CustomQuestMock,
    SchedulesMock,
    LeveladdMock
  );

  // Test 1: getTodaysQuests aggregation
  const feed = await service.getTodaysQuests(MOCK_USER_ID);
  assert(feed.data.length === 4, 'Should aggregate 4 quests (1 codex, 1 custom, 2 schedules)');
  
  const sched1 = feed.data.find(q => q.originalRefId === 'sched1');
  assert(sched1.isCompleted === false, 'Sched1 should not be completed');
  
  const sched2 = feed.data.find(q => q.originalRefId === 'sched2');
  assert(sched2.isCompleted === true, 'Sched2 should be completed via Prisma mock');

  // Test 2: completeQuest routing
  const resSched1 = await service.completeQuest(MOCK_USER_ID, { questId: 'medication_sched1', questType: 'MEDICATION_SCHEDULE' });
  assert(resSched1.data.xpAwarded === 10);
  assert(logsCreated.length === 1, 'Should create completion log');
  assert(logsCreated[0].scheduleItemId === 'sched1');

  console.log('✅ All Tests Passed');
}

test().catch(console.error);
