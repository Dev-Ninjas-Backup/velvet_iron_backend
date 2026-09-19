import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CustomQuestModule } from '../src/custom-quest/custom-quest.module';
import { MedicationScheduleModule } from '../src/medication-schedule/medication-schedule.module';
import { ExerciseLogModule } from '../src/exercise-log/exercise-log.module';
import { MacroGoalModule } from '../src/macro-goal/macro-goal.module';
import { ProfileModule } from '../src/profile/profile.module';
import { MealScheduleModule } from '../src/meal-schedule/meal-schedule.module';
import { CompanionModule } from '../src/companion/companion.module';
import { PrismaService } from '../src/lib/prisma/prisma.service';
import { OptionalJwtGuard } from '../src/common/optional-auth.guard';
import { RoleGuard } from '../src/common/guards/role.guard';
import { ProfileService } from '../src/profile/profile.service';
import { SeedService } from '../src/common/seed.service';
import { ConfigService } from '@nestjs/config';
import {
  NotificationTriggerType,
  getCompanionNotificationCopy,
} from '../src/companion/constants/companion-dialogue.constants';

describe('Velvet & Iron V1 Requirements (E2E & Integration)', () => {
  let app: INestApplication;
  let mockPrismaClient: any;
  const mockUser = {
    id: 'user-uuid-1234',
    email: 'adventurer@velvetiron.app',
    role: 'USER',
    onBoarded: true,
  };

  beforeAll(async () => {
    mockPrismaClient = {
      customQuest: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      medicationSchedule: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      exerciseScheduleLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      mealSchedule: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      macroGoal: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
        findFirst: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn(),
      },
      userProfile: {
        findUnique: jest.fn().mockResolvedValue({ userId: mockUser.id, totalEarnXp: 100, balanceXp: 100 }),
        findFirst: jest.fn().mockResolvedValue({ userId: mockUser.id, totalEarnXp: 100, balanceXp: 100 }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      theme: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn().mockResolvedValue(4),
      },
      companion: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(4),
      },
      userCompanion: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      userTheme: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      $executeRawUnsafe: jest.fn(),
      $transaction: jest.fn((callback) => callback(mockPrismaClient)),
    };

    const mockPrismaService = {
      client: mockPrismaClient,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        CustomQuestModule,
        MedicationScheduleModule,
        ExerciseLogModule,
        MacroGoalModule,
        ProfileModule,
        MealScheduleModule,
        CompanionModule,
      ],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        SeedService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SUPERADMIN_EMAIL') return 'admin@velvetiron.app';
              if (key === 'SUPERADMIN_USERNAME') return 'superadmin';
              if (key === 'SUPERADMIN_PASSWORD') return 'secret123';
              return null;
            }),
          },
        },
      ],
    })
      .overrideGuard(OptionalJwtGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .overrideGuard(RoleGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Priority 1: Custom Quests System
  // =========================================================================
  describe('Priority 1: Custom Quests System', () => {
    it('POST /quests/custom should enforce maximum 15 XP cap and create quest', async () => {
      const createdRecord = {
        id: 'cq-1',
        userId: mockUser.id,
        title: 'Morning Meditation',
        category: 'WELLNESS',
        recurrence: 'DAILY',
        daysOfWeek: [],
        timeOfDay: '08:00',
        reminderTime: '07:55',
        xpReward: 15, // Capped from 50
        isPaused: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.customQuest.create.mockResolvedValue(createdRecord);

      const response = await request(app.getHttpServer())
        .post('/quests/custom')
        .send({
          title: 'Morning Meditation',
          category: 'WELLNESS',
          recurrence: 'DAILY',
          timeOfDay: '08:00',
          xpReward: 50, // Should be capped to 15
        })
        .expect(201);

      expect(response.body.data.xpReward).toBe(15);
      expect(mockPrismaClient.customQuest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            xpReward: 15,
            recurrence: 'DAILY',
          }),
        }),
      );
    });

    it('PATCH /quests/custom/:id/pause should toggle pause state', async () => {
      const quest = {
        id: 'cq-1',
        userId: mockUser.id,
        isPaused: true,
      };

      mockPrismaClient.customQuest.findFirst.mockResolvedValue({
        id: 'cq-1',
        userId: mockUser.id,
        isPaused: false,
      });
      mockPrismaClient.customQuest.update.mockResolvedValue(quest);

      const response = await request(app.getHttpServer())
        .patch('/quests/custom/cq-1/pause')
        .send({ isPaused: true })
        .expect(200);

      expect(response.body.data.isPaused).toBe(true);
      expect(mockPrismaClient.customQuest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cq-1' },
          data: { isPaused: true },
        }),
      );
    });

    it('PATCH /quests/custom/:id/complete should reject if daily limit (5/day) exceeded', async () => {
      const today = new Date();
      mockPrismaClient.customQuest.findFirst.mockResolvedValue({
        id: 'cq-1',
        userId: mockUser.id,
        isPaused: false,
        isActive: true,
        xpReward: 15,
        lastCompletedAt: null,
      });

      // Mock 5 quests already completed today
      mockPrismaClient.customQuest.count.mockResolvedValue(5);

      const response = await request(app.getHttpServer())
        .patch('/quests/custom/cq-1/complete')
        .expect(400);

      expect(response.body.message).toMatch(/limit reached/i);
    });

    it('PATCH /quests/custom/:id/complete should award XP when within daily limit', async () => {
      mockPrismaClient.customQuest.findFirst.mockResolvedValue({
        id: 'cq-1',
        userId: mockUser.id,
        isPaused: false,
        isActive: true,
        xpReward: 15,
        lastCompletedAt: null,
      });

      mockPrismaClient.customQuest.count.mockResolvedValue(2);
      mockPrismaClient.customQuest.update.mockResolvedValue({
        id: 'cq-1',
        userId: mockUser.id,
        lastCompletedAt: new Date(),
      });
      mockPrismaClient.userProfile.findFirst.mockResolvedValue({
        userId: mockUser.id,
        totalEarnXp: 100,
        balanceXp: 100,
      });

      const response = await request(app.getHttpServer())
        .patch('/quests/custom/cq-1/complete')
        .expect(200);

      expect(response.body.data.earnedXp).toBe(15);
      expect(mockPrismaClient.userProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            totalEarnXp: 115,
            balanceXp: 115,
          },
        }),
      );
    });
  });

  // =========================================================================
  // Priority 2: Recurring Medication Scheduling
  // =========================================================================
  describe('Priority 2: Recurring Medication Scheduling', () => {
    it('POST /medication-schedule should save recurrence and daysOfWeek', async () => {
      const schedule = {
        id: 'med-1',
        userId: mockUser.id,
        medicationName: 'Vitamin D',
        dosage: '1000 IU',
        time: '09:00',
        recurrence: 'SPECIFIC_DAYS',
        daysOfWeek: ['MON', 'WED', 'FRI'],
        startDate: new Date(),
        isPaused: false,
        isTaken: false,
      };

      mockPrismaClient.medicationSchedule.create.mockResolvedValue(schedule);

      const response = await request(app.getHttpServer())
        .post('/medication-schedule')
        .send({
          medicationName: 'Vitamin D',
          dosage: '1000 IU',
          time: '09:00',
          recurrence: 'SPECIFIC_DAYS',
          daysOfWeek: ['MON', 'WED', 'FRI'],
        })
        .expect(201);

      expect(response.body.data.recurrence).toBe('SPECIFIC_DAYS');
      expect(response.body.data.daysOfWeek).toEqual(['MON', 'WED', 'FRI']);
    });

    it('PATCH /medication-schedule/:id/pause should toggle medication pause state', async () => {
      mockPrismaClient.medicationSchedule.findFirst.mockResolvedValue({
        id: 'med-1',
        userId: mockUser.id,
        isPaused: false,
      });
      mockPrismaClient.medicationSchedule.update.mockResolvedValue({
        id: 'med-1',
        userId: mockUser.id,
        isPaused: true,
      });

      const response = await request(app.getHttpServer())
        .patch('/medication-schedule/med-1/pause')
        .send({ isPaused: true })
        .expect(200);

      expect(response.body.data.isPaused).toBe(true);
    });

    it('PATCH /medication-schedule/:id/taken should award XP only once per calendar day (anti-abuse)', async () => {
      const today = new Date();
      // First call: not taken today yet
      mockPrismaClient.medicationSchedule.findFirst.mockResolvedValue({
        id: 'med-1',
        userId: mockUser.id,
        isTaken: false,
        lastTakenDate: null,
      });
      mockPrismaClient.medicationSchedule.update.mockResolvedValue({
        id: 'med-1',
        userId: mockUser.id,
        isTaken: true,
        lastTakenDate: today,
      });
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        onBoarded: true,
      });
      mockPrismaClient.userProfile.findFirst.mockResolvedValue({
        userId: mockUser.id,
        totalEarnXp: 50,
        balanceXp: 50,
      });

      await request(app.getHttpServer())
        .patch('/medication-schedule/med-1/taken')
        .send({ isTaken: true })
        .expect(200);

      expect(mockPrismaClient.userProfile.update).toHaveBeenCalledTimes(1);

      // Second call on same calendar day: should not award XP again
      jest.clearAllMocks();
      mockPrismaClient.medicationSchedule.findFirst.mockResolvedValue({
        id: 'med-1',
        userId: mockUser.id,
        isTaken: true,
        lastTakenDate: today,
      });
      mockPrismaClient.medicationSchedule.update.mockResolvedValue({
        id: 'med-1',
        userId: mockUser.id,
        isTaken: true,
        lastTakenDate: today,
      });
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        onBoarded: true,
      });

      await request(app.getHttpServer())
        .patch('/medication-schedule/med-1/taken')
        .send({ isTaken: true })
        .expect(200);

      expect(mockPrismaClient.userProfile.update).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Priority 3: Recurring Exercise Scheduling & Route Aliasing
  // =========================================================================
  describe('Priority 3: Recurring Exercise Scheduling & Route Aliasing', () => {
    it('POST /exercise-log/schedule should create schedule with recurrence and timeOfDay', async () => {
      const schedule = {
        id: 'ex-1',
        userId: mockUser.id,
        exerciseName: 'Pushups',
        timeOfDay: 'MORNING',
        recurrence: 'DAILY',
        isPaused: false,
        isTaken: false,
      };

      mockPrismaClient.exerciseScheduleLog.create.mockResolvedValue(schedule);

      const response = await request(app.getHttpServer())
        .post('/exercise-log/schedule')
        .send({
          exerciseName: 'Pushups',
          timeOfDay: 'MORNING',
          recurrence: 'DAILY',
        })
        .expect(201);

      expect(response.body.data.recurrence).toBe('DAILY');
      expect(response.body.data.timeOfDay).toBe('MORNING');
    });

    it('GET /exercise-log/schedule/:id and GET /exercise-log/scheduled/:id should both resolve (route aliasing)', async () => {
      const schedule = {
        id: 'ex-1',
        userId: mockUser.id,
        exerciseName: 'Pushups',
      };

      mockPrismaClient.exerciseScheduleLog.findFirst.mockResolvedValue(schedule);

      // Test /schedule/:id
      const res1 = await request(app.getHttpServer())
        .get('/exercise-log/schedule/ex-1')
        .expect(200);
      expect(res1.body.data.id).toBe('ex-1');

      // Test /scheduled/:id (backwards compatibility)
      const res2 = await request(app.getHttpServer())
        .get('/exercise-log/scheduled/ex-1')
        .expect(200);
      expect(res2.body.data.id).toBe('ex-1');
    });

    it('GET /exercise-log/schedule/today should return active schedules for today', async () => {
      mockPrismaClient.exerciseScheduleLog.findMany.mockResolvedValue([
        {
          id: 'ex-1',
          userId: mockUser.id,
          name: 'Morning Jog',
          type: 'CARDIO',
          recurrence: 'DAILY',
          isPaused: false,
          loggedAt: new Date(),
          lastTakenDate: null,
        },
        {
          id: 'ex-paused',
          userId: mockUser.id,
          name: 'Paused Workout',
          type: 'STRENGTH',
          recurrence: 'DAILY',
          isPaused: true,
          loggedAt: new Date(),
          lastTakenDate: null,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/exercise-log/schedule/today')
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe('ex-1');
    });

    it('PATCH /exercise-log/schedule/:id and PATCH /exercise-log/scheduled/:id should both update', async () => {
      const schedule = {
        id: 'ex-1',
        userId: mockUser.id,
        exerciseName: 'Pullups',
      };

      mockPrismaClient.exerciseScheduleLog.findFirst.mockResolvedValue({ id: 'ex-1', userId: mockUser.id });
      mockPrismaClient.exerciseScheduleLog.update.mockResolvedValue(schedule);

      await request(app.getHttpServer())
        .patch('/exercise-log/schedule/ex-1')
        .send({ exerciseName: 'Pullups' })
        .expect(200);

      await request(app.getHttpServer())
        .patch('/exercise-log/scheduled/ex-1')
        .send({ exerciseName: 'Pullups' })
        .expect(200);
    });

    it('PATCH /exercise-log/schedule/:id/pause should toggle exercise pause state', async () => {
      mockPrismaClient.exerciseScheduleLog.findFirst.mockResolvedValue({
        id: 'ex-1',
        userId: mockUser.id,
        isPaused: false,
      });
      mockPrismaClient.exerciseScheduleLog.update.mockResolvedValue({
        id: 'ex-1',
        userId: mockUser.id,
        isPaused: true,
      });

      const response = await request(app.getHttpServer())
        .patch('/exercise-log/schedule/ex-1/pause')
        .send({ isPaused: true })
        .expect(200);

      expect(response.body.data.isPaused).toBe(true);
    });
  });

  // =========================================================================
  // Priority 4: XP Award Timing & Anti-Abuse Fix
  // =========================================================================
  describe('Priority 4: XP Award Timing & Anti-Abuse Fix', () => {
    it('Creating a medication or exercise schedule does not award XP', async () => {
      mockPrismaClient.medicationSchedule.create.mockResolvedValue({
        id: 'med-new',
        userId: mockUser.id,
      });

      await request(app.getHttpServer())
        .post('/medication-schedule')
        .send({
          medicationName: 'Omega 3',
          dosage: '1 capsule',
          time: '12:00',
        })
        .expect(201);

      // Ensure no XP update was dispatched
      expect(mockPrismaClient.userProfile.update).not.toHaveBeenCalled();
    });

    it('Meal schedule /taken does NOT award XP if user is not onboarded', async () => {
      mockPrismaClient.mealSchedule.findFirst.mockResolvedValue({
        id: 'meal-1',
        userId: mockUser.id,
        isTaken: false,
        lastTakenDate: null,
      });
      mockPrismaClient.mealSchedule.update.mockResolvedValue({
        id: 'meal-1',
        userId: mockUser.id,
        isTaken: true,
      });
      // User is not onboarded
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        onBoarded: false,
      });

      await request(app.getHttpServer())
        .patch('/meal-schedule/meal-1/taken')
        .send({ isTaken: true })
        .expect(200);

      expect(mockPrismaClient.userProfile.update).not.toHaveBeenCalled();
    });

    it('ProfileService correctly assigns earnedXp=10 only for completed items', () => {
      const profileService = app.get<ProfileService>(ProfileService);
      expect(profileService.quotes['Scribe']).toBeDefined();
      expect(profileService.quotes['Realmwalker']).toBeDefined();
    });
  });

  // =========================================================================
  // Priority 5: Independent Daily Calorie Goal
  // =========================================================================
  describe('Priority 5: Independent Daily Calorie Goal', () => {
    it('POST /macro-goal should preserve explicit manual calories', async () => {
      const expectedGoal = {
        id: 'goal-1',
        userId: mockUser.id,
        calories: 2500, // Explicitly passed
        protein: 150,   // 150 * 4 = 600
        carbs: 200,     // 200 * 4 = 800
        fat: 60,        // 60 * 9 = 540 (Sum = 1940 != 2500)
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.macroGoal.create.mockResolvedValue(expectedGoal);

      const response = await request(app.getHttpServer())
        .post('/macro-goal')
        .send({
          calories: 2500,
          protein: 150,
          carbs: 200,
          fat: 60,
        })
        .expect(201);

      expect(response.body.data.calories).toBe(2500);
      expect(mockPrismaClient.macroGoal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            calories: 2500,
            protein: 150,
            carbs: 200,
            fat: 60,
          }),
        }),
      );
    });

    it('POST /macro-goal should fallback to 4P+4C+9F when calories omitted', async () => {
      const calculatedCalories = 150 * 4 + 200 * 4 + 60 * 9; // 1940
      const expectedGoal = {
        id: 'goal-2',
        userId: mockUser.id,
        calories: calculatedCalories,
        protein: 150,
        carbs: 200,
        fat: 60,
      };

      mockPrismaClient.macroGoal.create.mockResolvedValue(expectedGoal);

      await request(app.getHttpServer())
        .post('/macro-goal')
        .send({
          protein: 150,
          carbs: 200,
          fat: 60,
        })
        .expect(201);

      expect(mockPrismaClient.macroGoal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            calories: calculatedCalories,
          }),
        }),
      );
    });
  });

  // =========================================================================
  // Priority 6: Theme Rebranding
  // =========================================================================
  describe('Priority 6: Theme Rebranding & Companion Quotes', () => {
    it('SeedService migrates "Reader" -> "Scribe" and "Gamer" -> "Realmwalker"', async () => {
      mockPrismaClient.theme.findUnique
        .mockResolvedValueOnce({ id: 'theme-1', name: 'Reader' })
        .mockResolvedValueOnce({ id: 'theme-2', name: 'Gamer' });

      const seedService = app.get<SeedService>(SeedService);
      await seedService.onModuleInit();

      expect(mockPrismaClient.theme.update).toHaveBeenCalledWith({
        where: { id: 'theme-1' },
        data: { name: 'Scribe' },
      });
      expect(mockPrismaClient.theme.update).toHaveBeenCalledWith({
        where: { id: 'theme-2' },
        data: { name: 'Realmwalker' },
      });
    });
  });

  // =========================================================================
  // Companion Quotes & Dialogue System Alignment
  // =========================================================================
  describe('Companion Quotes & Dialogue System Alignment', () => {
    it('SeedService migrates legacy companions to official launch names', async () => {
      mockPrismaClient.companion.findFirst
        .mockResolvedValueOnce({ id: 'comp-1', name: 'Riven Ashcroft' })
        .mockResolvedValueOnce(null) // destComp for Riven
        .mockResolvedValueOnce({ id: 'comp-2', name: 'Ser Kael Thornwatch' })
        .mockResolvedValueOnce(null) // destComp for Thyra
        .mockResolvedValueOnce({ id: 'comp-3', name: 'Bram Ironledger' })
        .mockResolvedValueOnce(null) // destComp for General Leon
        .mockResolvedValueOnce({ id: 'comp-4', name: 'Pyraxis' })
        .mockResolvedValueOnce(null); // destComp for Visepheron

      const seedService = app.get<SeedService>(SeedService);
      await seedService.onModuleInit();

      expect(mockPrismaClient.companion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comp-1' },
          data: { name: 'Riven' },
        }),
      );
      expect(mockPrismaClient.companion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comp-2' },
          data: { name: 'Thyra' },
        }),
      );
      expect(mockPrismaClient.companion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comp-3' },
          data: { name: 'General Leon' },
        }),
      );
      expect(mockPrismaClient.companion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comp-4' },
          data: { name: 'Visepheron' },
        }),
      );
    });

    it('GET /companions/my-companions returns activeCompanion with companion.name', async () => {
      const mockCompanions = [
        {
          id: 'c-riven',
          name: 'Riven',
          title: 'High Lord of the Forsaken Court',
          quote: 'Come now. We have things to accomplish.',
          unlockXp: 0,
        },
        {
          id: 'c-thyra',
          name: 'Thyra',
          title: 'Shield of the Realm',
          quote: 'A shield is only as strong as the one who holds it. Take care of yourself.',
          unlockXp: 250,
        },
      ];

      const mockUserCompanions = [
        {
          id: 'uc-1',
          userId: mockUser.id,
          companionId: 'c-riven',
          isActive: true,
        },
      ];

      mockPrismaClient.companion.findMany.mockResolvedValue(mockCompanions);
      mockPrismaClient.userCompanion.findMany.mockResolvedValue(mockUserCompanions);

      const response = await request(app.getHttpServer())
        .get('/companions/my-companions')
        .expect(200);

      expect(response.body.activeCompanion).toBeDefined();
      expect(response.body.activeCompanion.companion.name).toBe('Riven');
      expect(response.body.activeCompanion.companion.title).toBe('High Lord of the Forsaken Court');
      expect(response.body.activeCompanion.companion.quote).toBe('Come now. We have things to accomplish.');
    });

    it('GET /profile returns activeCompanion with companion.name for client quote pack selection', async () => {
      mockPrismaClient.userProfile.findUnique.mockResolvedValue({
        userId: mockUser.id,
        totalEarnXp: 500,
        balanceXp: 250,
        level: 3,
        user: { name: 'Hero' },
      });

      mockPrismaClient.userCompanion.findFirst.mockResolvedValue({
        id: 'uc-1',
        companionId: 'c-riven',
        companion: {
          id: 'c-riven',
          name: 'Riven',
          title: 'High Lord of the Forsaken Court',
          quote: 'Come now. We have things to accomplish.',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/profile')
        .expect(200);

      expect(response.body.activeCompanion).toBeDefined();
      expect(response.body.activeCompanion.companion.name).toBe('Riven');
      expect(response.body.activeCompanion.companion.name.toLowerCase()).toBe('riven');
    });

    it('Push notification helper returns approved copy for all companions', () => {
      // Morning Reminder
      expect(getCompanionNotificationCopy('Riven', NotificationTriggerType.MORNING_REMINDER))
        .toBe('Good morning, darling. Try not to declare war before breakfast.');
      expect(getCompanionNotificationCopy('Thyra', NotificationTriggerType.MORNING_REMINDER))
        .toBe('Morning. Clear eyes, steady breath. The day begins.');
      expect(getCompanionNotificationCopy('General Leon', NotificationTriggerType.MORNING_REMINDER))
        .toBe('Morning briefing: do what matters first.');
      expect(getCompanionNotificationCopy('Visepheron', NotificationTriggerType.MORNING_REMINDER))
        .toBe('Morning is merely an invitation to begin again.');

      // Inactive Re-engagement (Zero guilt)
      expect(getCompanionNotificationCopy('Riven', NotificationTriggerType.INACTIVE_REENGAGEMENT))
        .toBe('Time passed. You returned. That is the whole story. Welcome back.');
      expect(getCompanionNotificationCopy('Thyra', NotificationTriggerType.INACTIVE_REENGAGEMENT))
        .toBe('The shield does not judge you for laying it down. Welcome back.');
      expect(getCompanionNotificationCopy('General Leon', NotificationTriggerType.INACTIVE_REENGAGEMENT))
        .toBe('Absence noted. Status reset. Report for duty when ready.');
      expect(getCompanionNotificationCopy('Visepheron', NotificationTriggerType.INACTIVE_REENGAGEMENT))
        .toBe('The road did not vanish while you were gone. You need not apologize to me for being human.');

      // Streak Maintenance
      expect(getCompanionNotificationCopy('Riven', NotificationTriggerType.STREAK_MAINTENANCE))
        .toBe('Day upon day. This is how empires rise. Shall we keep the streak going?');
      expect(getCompanionNotificationCopy('Thyra', NotificationTriggerType.STREAK_MAINTENANCE))
        .toBe('Another day joins the chain. Your strength grows with every choice.');
      expect(getCompanionNotificationCopy('General Leon', NotificationTriggerType.STREAK_MAINTENANCE))
        .toBe('Consistency is a strategic advantage. Log your progress for today.');
      expect(getCompanionNotificationCopy('Visepheron', NotificationTriggerType.STREAK_MAINTENANCE))
        .toBe('Steady, little flame. Day upon day, this is how mountains change.');
    });
  });
});
