import { QuestsFeedService } from './quests-feed.service';
import { QuestType } from './dto/quests-feed-response.dto';

describe('QuestsFeedService', () => {
  let service: QuestsFeedService;
  let customQuestService: any;
  let medicationScheduleService: any;
  let exerciseLogService: any;
  let xpStatsService: any;

  beforeEach(() => {
    xpStatsService = { getTodayQuestXp: jest.fn() };
    customQuestService = { findAll: jest.fn(), complete: jest.fn() };
    medicationScheduleService = { getTodaySchedules: jest.fn(), markMedicationAsTaken: jest.fn() };
    exerciseLogService = { getTodaySchedules: jest.fn(), markExerciseLogAsTaken: jest.fn() };

    service = new QuestsFeedService(
      xpStatsService,
      customQuestService,
      medicationScheduleService,
      exerciseLogService
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
    medicationScheduleService.getTodaySchedules.mockResolvedValue({
      schedules: [{ id: 'med-1', name: 'Aspirin', doseMg: 50, isTaken: true }],
    });
    exerciseLogService.getTodaySchedules.mockResolvedValue([
      { id: 'ex-1', exerciseName: 'Run', duration: 30, isTaken: false },
    ]);

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
      medicationScheduleService.markMedicationAsTaken.mockResolvedValue(true);
      
      const res = await service.completeQuest('user-1', {
        questId: 'med_123',
        questType: QuestType.MEDICATION_SCHEDULE
      });

      expect(res.success).toBe(true);
      expect(medicationScheduleService.markMedicationAsTaken).toHaveBeenCalledWith('user-1', '123', true);
    });

    it('should strip prefixes and route completion correctly (WORKOUT)', async () => {
      exerciseLogService.markExerciseLogAsTaken.mockResolvedValue(true);
      
      const res = await service.completeQuest('user-1', {
        questId: 'workout_456',
        questType: QuestType.WORKOUT_SCHEDULE
      });

      expect(res.success).toBe(true);
      expect(exerciseLogService.markExerciseLogAsTaken).toHaveBeenCalledWith('user-1', '456', true);
    });

    it('should strip prefixes and route completion correctly (CUSTOM)', async () => {
      customQuestService.complete.mockResolvedValue({ success: true, earnedXp: 15 });
      
      const res = await service.completeQuest('user-1', {
        questId: 'custom_789',
        questType: QuestType.CUSTOM
      });

      expect(res.success).toBe(true);
      expect(customQuestService.complete).toHaveBeenCalledWith('user-1', '789');
    });
  });
});
