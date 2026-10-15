import { QuestsFeedService } from './quests-feed.service';
import { QuestType } from './dto/quests-feed-response.dto';

describe('QuestsFeedService', () => {
  let service: QuestsFeedService;
  let prisma: any;
  let xpStatsService: any;
  let customQuestService: any;
  let schedulesService: any;
  let leveladdService: any;

  beforeEach(() => {
    prisma = {
      client: {
        scheduleCompletionLog: {
          findMany: jest.fn().mockResolvedValue([]),
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
        },
        scheduleItem: {
          findFirst: jest.fn(),
        },
        userProfile: {
          findUnique: jest.fn().mockResolvedValue({ totalEarnXp: 100, level: 2 }),
        },
      },
    };
    xpStatsService = { getTodayQuestXp: jest.fn() };
    customQuestService = { findAll: jest.fn(), complete: jest.fn() };
    schedulesService = { findAll: jest.fn() };
    leveladdService = { addXpToUser: jest.fn() };

    service = new QuestsFeedService(
      prisma,
      xpStatsService,
      customQuestService,
      schedulesService,
      leveladdService,
    );
  });

  it('should aggregate quests from all sources', async () => {
    xpStatsService.getTodayQuestXp.mockResolvedValue({
      quests: [{ id: 'codex-1', title: 'Codex Quest', xp: 20, isDone: false }],
    });
    customQuestService.findAll.mockResolvedValue({
      data: [{ id: 'cq-1', title: 'Custom', xpReward: 15, isCompleted: false }],
      meta: { todayCustomXpEarned: 0, dailyCustomXpCap: 50 },
    });
    schedulesService.findAll.mockResolvedValue({
      data: [
        { id: 'med-1', title: 'Aspirin', itemType: 'MEDICATION' },
        { id: 'ex-1', title: 'Run', itemType: 'WORKOUT' },
      ],
    });

    const result = await service.getTodaysQuests('user-1');

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(4);
    expect(result.data.find((q: any) => q.questType === QuestType.CODEX)?.title).toBe('Codex Quest');
    expect(result.data.find((q: any) => q.questType === QuestType.CUSTOM)?.title).toBe('Custom');
    expect(result.data.find((q: any) => q.questType === QuestType.MEDICATION_SCHEDULE)?.title).toBe('Aspirin');
    expect(result.data.find((q: any) => q.questType === QuestType.WORKOUT_SCHEDULE)?.title).toBe('Run');
  });

  describe('completeQuest', () => {
    it('should strip prefixes and route completion correctly (MEDICATION)', async () => {
      prisma.client.scheduleItem.findFirst.mockResolvedValue({ id: '123', userId: 'user-1', title: 'Meds' });

      const res = await service.completeQuest('user-1', {
        questId: 'medication_123',
        questType: QuestType.MEDICATION_SCHEDULE,
      });

      expect(res.success).toBe(true);
      expect(prisma.client.scheduleCompletionLog.create).toHaveBeenCalled();
      expect(leveladdService.addXpToUser).toHaveBeenCalledWith('user-1', 10, 'SCHEDULED_ITEM: Meds');
    });

    it('should strip prefixes and route completion correctly (WORKOUT)', async () => {
      prisma.client.scheduleItem.findFirst.mockResolvedValue({ id: '456', userId: 'user-1', title: 'Workout' });

      const res = await service.completeQuest('user-1', {
        questId: 'workout_456',
        questType: QuestType.WORKOUT_SCHEDULE,
      });

      expect(res.success).toBe(true);
      expect(prisma.client.scheduleCompletionLog.create).toHaveBeenCalled();
      expect(leveladdService.addXpToUser).toHaveBeenCalledWith('user-1', 10, 'SCHEDULED_ITEM: Workout');
    });

    it('should strip prefixes and route completion correctly (CUSTOM)', async () => {
      customQuestService.complete.mockResolvedValue({ success: true, earnedXp: 15 });

      const res = await service.completeQuest('user-1', {
        questId: 'custom_789',
        questType: QuestType.CUSTOM,
      });

      expect(res.success).toBe(true);
      expect(customQuestService.complete).toHaveBeenCalledWith('user-1', '789');
    });
  });
});

