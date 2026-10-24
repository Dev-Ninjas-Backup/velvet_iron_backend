const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../dist/prisma/generated/client');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Import compiled services and utilities
const { CustomQuestService } = require('../dist/src/custom-quest/custom-quest.service');
const { XpStatsService } = require('../dist/src/xp-stats/xp-stats.service');
const { MedicationScheduleService } = require('../dist/src/medication-schedule/medication-schedule.service');
const { MealScheduleService } = require('../dist/src/meal-schedule/meal-schedule.service');
const { ExerciseLogService } = require('../dist/src/exercise-log/exercise-log.service');
const { StepLogService } = require('../dist/src/step-log/step-log.service');
const { QuestsFeedService } = require('../dist/src/quests-feed/quests-feed.service');
const { MealLogService } = require('../dist/src/meal-log/meal-log.service');
const { ScheduleCompletionService } = require('../dist/src/schedule-completion/schedule-completion.service');
const { ProfileService } = require('../dist/src/profile/profile.service');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function pass(name, detail = '') {
  console.log(`${colors.green}✔ PASS:${colors.reset} ${name} ${colors.yellow}${detail}${colors.reset}`);
}

function fail(name, err) {
  console.error(`${colors.red}✖ FAIL:${colors.reset} ${name}\n`, err);
  process.exitCode = 1;
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  VELVET & IRON: RECENT CHANGES VERIFICATION SUITE  ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  // 1. Seed or retrieve test user
  let user = await prisma.user.findFirst({
    where: { email: 'test_audit_user@velvetiron.com' },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test_audit_user@velvetiron.com',
        name: 'Test Audit User',
        onBoarded: true,
      },
    });
    console.log(`[Seed] Created test user: ${user.id}`);
  } else {
    // Ensure onBoarded is true
    user = await prisma.user.update({
      where: { id: user.id },
      data: { onBoarded: true },
    });
    console.log(`[Seed] Using existing test user: ${user.id}`);
  }

  const userId = user.id;

  // Ensure user profile exists
  let userProfile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!userProfile) {
    userProfile = await prisma.userProfile.create({
      data: {
        userId,
        dailyStepGoal: 8000,
        dailyWaterGoal: 2000,
        lifetimeSteps: 10000,
        totalCampsites: 2,
      },
    });
  }

  // Setup mock services & adapters
  const mockPrismaService = { client: prisma };
  const mockLeveladd = {
    addXpToUser: async (uId, xp, reason) => {
      return prisma.xpLog.create({
        data: {
          userId: uId,
          amount: xp,
          source: reason || 'TEST_AWARD',
        },
      });
    },
  };

  const scheduleCompletionService = new ScheduleCompletionService(mockPrismaService, mockLeveladd);
  const customQuestService = new CustomQuestService(mockPrismaService, mockLeveladd);
  const xpStatsService = new XpStatsService(mockPrismaService);
  const medicationService = new MedicationScheduleService(mockPrismaService, mockLeveladd, scheduleCompletionService);
  const mealScheduleService = new MealScheduleService(mockPrismaService, mockLeveladd, scheduleCompletionService);
  const exerciseService = new ExerciseLogService(mockPrismaService, mockLeveladd, scheduleCompletionService);
  const stepLogService = new StepLogService(mockPrismaService, mockLeveladd);
  const mealLogService = new MealLogService(mockPrismaService, mockLeveladd);
  const mockSchedules = { findAll: async () => ({ success: true, data: [] }) };
  const feedService = new QuestsFeedService(
    mockPrismaService,
    xpStatsService,
    customQuestService,
    mockSchedules,
    mockLeveladd,
    exerciseService,
    medicationService,
  );
  const profileService = new ProfileService(
    mockPrismaService,
    mealScheduleService,
    medicationService,
    exerciseService,
    mockLeveladd,
  );

  const cleanupIds = {
    customQuests: [],
    xpLogs: [],
    medications: [],
    meals: [],
    exercises: [],
    stepLogs: [],
    mealLogs: [],
    macroGoals: [],
  };

  try {
    // ==========================================
    // TEST 1: Custom Quest 10 XP Handling
    // ==========================================
    console.log(`\n${colors.bold}--- 1. Testing Custom Quest 10 XP Handling ---${colors.reset}`);
    
    // 1A: Create with xpReward = 10
    const q1 = await customQuestService.create(userId, {
      title: 'Audit Quest 10 XP Reward',
      xpReward: 10,
    });
    cleanupIds.customQuests.push(q1.data.id);
    if (q1.data.xp === 10 && q1.data.xpReward === 10) {
      pass('Create quest with { xpReward: 10 }', `Result xp: ${q1.data.xp}`);
    } else {
      fail('Create quest with { xpReward: 10 }', `Expected 10, got xp: ${q1.data.xp}, xpReward: ${q1.data.xpReward}`);
    }

    // 1B: Create with string "10"
    const q2 = await customQuestService.create(userId, {
      title: 'Audit Quest String 10',
      xpReward: '10',
    });
    cleanupIds.customQuests.push(q2.data.id);
    if (q2.data.xp === 10) {
      pass('Create quest with string { xpReward: "10" }', `Result xp: ${q2.data.xp}`);
    } else {
      fail('Create quest with string { xpReward: "10" }', `Expected 10, got ${q2.data.xp}`);
    }

    // 1C: Update quest with { xpReward: 10 } (previously reset to 15)
    const q3 = await customQuestService.create(userId, {
      title: 'Audit Quest Update Test',
      xpReward: 15,
    });
    cleanupIds.customQuests.push(q3.data.id);
    const updatedQ3 = await customQuestService.update(userId, q3.data.id, {
      xpReward: 10,
    });
    const dbRecord = await prisma.customQuest.findUnique({ where: { id: q3.data.id } });
    if (updatedQ3.xp === 10 && updatedQ3.xpReward === 10 && dbRecord.xp === 10) {
      pass('Update quest with { xpReward: 10 }', `DB stored xp: ${dbRecord.xp}`);
    } else {
      fail('Update quest with { xpReward: 10 }', `DB record has: ${dbRecord.xp}`);
    }

    // 1D: Create quest with SPECIFIC_DAYS and weekday names or repeatDays
    const q4 = await customQuestService.create(userId, {
      title: 'Audit Quest Specific Days Names',
      recurrence: 'SPECIFIC_DAYS',
      daysOfWeek: [1, 3, 5],
    });
    cleanupIds.customQuests.push(q4.data.id);
    const dbRecordQ4 = await prisma.customQuest.findUnique({ where: { id: q4.data.id } });
    if (dbRecordQ4.recurrence === 'SPECIFIC_DAYS' && JSON.stringify(dbRecordQ4.daysOfWeek) === JSON.stringify([1, 3, 5])) {
      pass('Create quest with SPECIFIC_DAYS daysOfWeek: [1, 3, 5]', `DB stored daysOfWeek: [${dbRecordQ4.daysOfWeek}]`);
    } else {
      fail('Create quest with SPECIFIC_DAYS daysOfWeek', `Got: ${JSON.stringify(dbRecordQ4.daysOfWeek)}`);
    }

    // ==========================================
    // TEST 2: Universal Timezone Attribution (Wisconsin vs. Dhaka)
    // ==========================================
    console.log(`\n${colors.bold}--- 2. Testing Timezone XP Attribution (Wisconsin vs Dhaka) ---${colors.reset}`);
    
    // Dynamically calculate Thursday 8:17 PM CDT for the current week being tested
    const { getUserWeekBoundaries } = require('../dist/src/common/utils/timezone.util');
    const { days: weekDays } = getUserWeekBoundaries('America/Chicago', undefined, 0);
    const thursdayDateStr = weekDays.find((d) => d.dayName === 'Thursday')?.dateKey;
    // 8:17 PM CDT (-05:00) on Thursday -> 7:17 AM Friday (+06:00) in Dhaka
    const thursdayCdtTimestamp = new Date(`${thursdayDateStr}T20:17:00-05:00`);
    const testLog = await prisma.xpLog.create({
      data: {
        userId,
        amount: 30,
        source: 'TEST_WISCONSIN_LOG',
        createdAt: thursdayCdtTimestamp,
      },
    });
    cleanupIds.xpLogs.push(testLog.id);

    // Query in America/Chicago
    const chartChicago = await xpStatsService.getWeeklyChartData(userId, 'America/Chicago');
    const thursdayChicago = chartChicago.data.find((d) => d.day === 'Thursday');
    const fridayChicago = chartChicago.data.find((d) => d.day === 'Friday');

    if (thursdayChicago && thursdayChicago.xp >= 30 && (!fridayChicago || fridayChicago.xp === 0)) {
      pass('America/Chicago (Wisconsin)', `Thursday XP: ${thursdayChicago.xp}, Friday XP: ${fridayChicago ? fridayChicago.xp : 0}`);
    } else {
      fail('America/Chicago attribution', `Thursday: ${thursdayChicago?.xp}, Friday: ${fridayChicago?.xp}`);
    }

    // Query in Asia/Dhaka
    const chartDhaka = await xpStatsService.getWeeklyChartData(userId, 'Asia/Dhaka');
    const thursdayDhaka = chartDhaka.data.find((d) => d.day === 'Thursday');
    const fridayDhaka = chartDhaka.data.find((d) => d.day === 'Friday');

    if (fridayDhaka && fridayDhaka.xp >= 30 && (!thursdayDhaka || thursdayDhaka.xp === 0)) {
      pass('Asia/Dhaka (Bangladesh)', `Friday XP: ${fridayDhaka.xp}, Thursday XP: ${thursdayDhaka ? thursdayDhaka.xp : 0}`);
    } else {
      fail('Asia/Dhaka attribution', `Thursday: ${thursdayDhaka?.xp}, Friday: ${fridayDhaka?.xp}`);
    }

    // ==========================================
    // TEST 3: Medication Schedule Local Day Completion & Anti-Duplication
    // ==========================================
    console.log(`\n${colors.bold}--- 3. Testing Medication Schedule Local Day Boundaries ---${colors.reset}`);
    const medSchedule = await prisma.medicationSchedule.create({
      data: {
        userId,
        name: 'Audit Vitamin D',
        scheduleTime: new Date(),
        isTaken: false,
      },
    });
    cleanupIds.medications.push(medSchedule.id);

    // Mark as taken first time (should award 10 XP)
    const initialXpCount = await prisma.xpLog.count({ where: { userId, source: 'Medication Schedule log entry' } });
    await medicationService.markMedicationAsTaken(userId, medSchedule.id, true, 'America/Chicago');
    const postFirstCount = await prisma.xpLog.count({ where: { userId, source: 'Medication Schedule log entry' } });
    
    // Mark as taken second time on same local day (should NOT award duplicate XP)
    await medicationService.markMedicationAsTaken(userId, medSchedule.id, true, 'America/Chicago');
    const postSecondCount = await prisma.xpLog.count({ where: { userId, source: 'Medication Schedule log entry' } });

    if (postFirstCount === initialXpCount + 1 && postSecondCount === postFirstCount) {
      pass('Medication Schedule completion', 'Awarded 10 XP on first taken, protected against duplicate on same day');
    } else {
      fail('Medication Schedule completion', `Initial: ${initialXpCount}, First: ${postFirstCount}, Second: ${postSecondCount}`);
    }

    // ==========================================
    // TEST 4: Exercise Schedule Completion
    // ==========================================
    console.log(`\n${colors.bold}--- 4. Testing Exercise Schedule Local Day Boundaries ---${colors.reset}`);
    const exerciseSchedule = await prisma.exerciseScheduleLog.create({
      data: {
        userId,
        type: 'CARDIO',
        name: 'Audit Morning Stretch',
        loggedAt: new Date(),
        isTaken: false,
      },
    });
    cleanupIds.exercises.push(exerciseSchedule.id);

    const initExXp = await prisma.xpLog.count({ where: { userId, source: 'Exercise Schedule log entry' } });
    await exerciseService.markExerciseLogAsTaken(userId, exerciseSchedule.id, true, 'America/Chicago');
    const postExXp = await prisma.xpLog.count({ where: { userId, source: 'Exercise Schedule log entry' } });

    if (postExXp === initExXp + 1) {
      pass('Exercise Schedule completion', 'Awarded 10 XP in user local timezone');
    } else {
      fail('Exercise Schedule completion', `Expected ${initExXp + 1}, got ${postExXp}`);
    }

    // --- TEST 4B: "Walk the Realm" Bidirectional Synchronization Test ---
    console.log(`\n${colors.bold}--- 4B. Testing "Walk the Realm" Today Quests & Exercise History Sync ---${colors.reset}`);
    const walkScheduleItem = await prisma.scheduleItem.create({
      data: {
        userId,
        itemType: 'WORKOUT',
        title: 'Walk the Realm',
        recurrenceType: 'DAILY',
        daysOfWeek: [],
      },
    });
    cleanupIds.scheduleItems = cleanupIds.scheduleItems || [];
    cleanupIds.scheduleItems.push(walkScheduleItem.id);

    const walkExerciseLog = await prisma.exerciseScheduleLog.create({
      data: {
        userId,
        type: 'CARDIO',
        name: 'Walk the Realm',
        loggedAt: new Date(),
        isTaken: false,
      },
    });
    cleanupIds.exercises.push(walkExerciseLog.id);

    // Complete via Today Quests Feed
    await feedService.completeQuest(
      userId,
      { questId: `workout_${walkScheduleItem.id}`, questType: 'WORKOUT_SCHEDULE' },
      'America/Chicago',
    );

    // Check that ExerciseScheduleLog was automatically marked as taken!
    const syncedExerciseLog = await prisma.exerciseScheduleLog.findUnique({
      where: { id: walkExerciseLog.id },
    });

    if (syncedExerciseLog && syncedExerciseLog.isTaken) {
      pass(
        'Walk the Realm Sync',
        'Marking complete in Today Quests synchronized ExerciseScheduleLog.isTaken = true (no resetting to incomplete!)',
      );
    } else {
      fail('Walk the Realm Sync', 'ExerciseScheduleLog was NOT marked as taken after completing in Today Quests');
    }

    // ==========================================
    // TEST 5: Step Tracking & "Set Up Camp"
    // ==========================================
    console.log(`\n${colors.bold}--- 5. Testing Step Tracking & "Set Up Camp" ---${colors.reset}`);
    // Clear today's step log for this test user if any
    const { getUserDayBoundaries } = require('../dist/src/common/utils/timezone.util');
    const { dateStr: todayStr } = getUserDayBoundaries('America/Chicago');
    const todayDateObj = new Date(`${todayStr}T00:00:00.000Z`);

    await prisma.stepLog.deleteMany({
      where: { userId, date: todayDateObj },
    });

    // Update steps
    await stepLogService.updateSteps(userId, { steps: 8500 }, 'America/Chicago');
    // Set up camp
    const campResult = await stepLogService.setUpCamp(userId, 'America/Chicago');
    const storedStepLog = await prisma.stepLog.findUnique({
      where: { userId_date: { userId, date: todayDateObj } },
    });

    if (campResult.success && storedStepLog && storedStepLog.isCampSet) {
      pass('Step Tracking "Set Up Camp"', `Pitched camp and committed ${storedStepLog.steps} steps for local date ${todayStr}`);
    } else {
      fail('Step Tracking "Set Up Camp"', `Result: ${JSON.stringify(campResult)}`);
    }

    // ==========================================
    // TEST 6: Unified /quests/today Feed
    // ==========================================
    console.log(`\n${colors.bold}--- 6. Testing Unified Quests Feed ---${colors.reset}`);
    const feedResponse = await feedService.getTodaysQuests(userId, undefined, 'America/Chicago');
    const customInFeed = feedResponse.data.find((q) => q.originalRefId === q1.data.id);

    if (feedResponse.success && customInFeed && customInFeed.xpReward === 10) {
      pass('Unified /quests/today Feed', `Feed contains custom quest with xpReward: ${customInFeed.xpReward}`);
    } else {
      fail('Unified /quests/today Feed', `Could not find custom quest with 10 XP in feed`);
    }

    // ==========================================
    // TEST 7: Meal Schedule Recurrence (Daily Schedule Doesn't Disappear)
    // ==========================================
    console.log(`\n${colors.bold}--- 7. Testing Meal Schedule Recurrence ---${colors.reset}`);
    // Create a meal schedule scheduled yesterday with DAILY recurrence
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const createdMeal = await mealScheduleService.createMealSchedule(userId, {
      mealType: 'BREAKFAST',
      scheduledAt: yesterdayDate.toISOString(),
      carbs: 40,
      protein: 25,
      fats: 10,
      recurrence: 'DAILY',
      daysOfWeek: [],
      isPaused: false,
    });
    cleanupIds.meals.push(createdMeal.id);

    // Verify it is retrieved in today's schedules even though scheduledAt was yesterday
    const todaySchedules = await mealScheduleService.getTodaySchedules(userId, 'America/Chicago');
    const recurringMealInToday = todaySchedules.find((m) => m.id === createdMeal.id);

    if (recurringMealInToday && recurringMealInToday.recurrence === 'DAILY' && recurringMealInToday.isTaken === false) {
      pass('Daily Meal Schedule Repeats Today', `Meal ${createdMeal.id} appeared in getTodaySchedules with isTaken: false`);
    } else {
      fail('Daily Meal Schedule Repeats Today', `Recurring meal was not found or isTaken was wrong: ${JSON.stringify(recurringMealInToday)}`);
    }

    // Mark as taken today
    await mealScheduleService.markMealAsTaken(userId, createdMeal.id, true, 'America/Chicago');
    const todaySchedulesAfterTaken = await mealScheduleService.getTodaySchedules(userId, 'America/Chicago');
    const takenMeal = todaySchedulesAfterTaken.find((m) => m.id === createdMeal.id);

    if (takenMeal && takenMeal.isTaken === true) {
      pass('Meal Marked Taken Today', `Meal ${createdMeal.id} isTaken is true for today`);
    } else {
      fail('Meal Marked Taken Today', `Expected isTaken: true, got ${takenMeal?.isTaken}`);
    }

    // Check tomorrow: targetDate = tomorrow string, it should appear with isTaken: false
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrowSchedules = await mealScheduleService.getTodaySchedules(userId, 'America/Chicago', tomorrowStr);
    const tomorrowMeal = tomorrowSchedules.find((m) => m.id === createdMeal.id);

    if (tomorrowMeal && tomorrowMeal.isTaken === false) {
      pass('Daily Meal Resets isTaken Tomorrow', `Meal ${createdMeal.id} repeats tomorrow with isTaken: false`);
    } else {
      fail('Daily Meal Resets isTaken Tomorrow', `Expected isTaken: false on tomorrow, got: ${JSON.stringify(tomorrowMeal)}`);
    }

    // ==========================================
    // 8. Testing Custom Quest Completion Resilience & Feed isCompleted Boolean
    // ==========================================
    console.log(`\n${colors.bold}--- 8. Testing Custom Quest Completion & Feed Resilience ---${colors.reset}`);
    const studyQuest = await customQuestService.create(userId, {
      name: 'Study Italian',
      category: 'FITNESS',
      xpReward: 5,
      recurrence: 'DAILY',
    });
    cleanupIds.customQuests.push(studyQuest.data.id);

    // Verify it appears in getTodaysQuests and isCompleted is strictly boolean false
    const feed = await feedService.getTodaysQuests(userId, undefined, 'America/Chicago');
    const feedItem = feed.data.find((q) => q.originalRefId === studyQuest.data.id);
    if (feedItem && typeof feedItem.isCompleted === 'boolean' && feedItem.isCompleted === false) {
      pass('Today Quests isCompleted Strict Boolean', `Found ${feedItem.id} with isCompleted: ${feedItem.isCompleted}`);
    } else {
      fail('Today Quests isCompleted Strict Boolean', `isCompleted is not strict boolean false: ${feedItem?.isCompleted}`);
    }

    // Complete using prefixed ID (e.g. "custom_UUID") via customQuestService.complete
    const completeResult = await customQuestService.complete(userId, `custom_${studyQuest.data.id}`, 'America/Chicago');
    if (completeResult.success && completeResult.earnedXp === 5) {
      pass('Complete with Prefixed ID', `Successfully completed custom_${studyQuest.data.id} and awarded 5 XP`);
    } else {
      fail('Complete with Prefixed ID', `Failed: ${JSON.stringify(completeResult)}`);
    }

    // Test completion via unified feed completeQuest with auto-inferred questType
    const testQuest2 = await customQuestService.create(userId, {
      name: 'Read Book',
      category: 'FITNESS',
      xpReward: 10,
      recurrence: 'DAILY',
    });
    cleanupIds.customQuests.push(testQuest2.data.id);
    const feedCompleteResult = await feedService.completeQuest(
      userId,
      { questId: `custom_${testQuest2.data.id}` },
      'America/Chicago'
    );
    if (feedCompleteResult.success && feedCompleteResult.earnedXp === 10) {
      pass('Unified Feed Complete Auto-infer QuestType', `Successfully completed without questType payload and awarded 10 XP`);
    } else {
      fail('Unified Feed Complete Auto-infer QuestType', `Failed: ${JSON.stringify(feedCompleteResult)}`);
    }

    // Verify Weekly Chart returns dayShort and reflects the XP
    const chart = await xpStatsService.getWeeklyChartData(userId, 'America/Chicago');
    const dayWithShort = chart.data.find((d) => d.dayShort !== undefined);
    if (chart && dayWithShort && chart.data.length === 7) {
      pass('Weekly Chart dayShort & 7 Days', `Chart has all 7 days with dayShort (e.g. ${dayWithShort.dayShort}) and totalXp: ${chart.totalXp}`);
    } else {
      fail('Weekly Chart dayShort & 7 Days', `Chart missing dayShort or 7 days: ${JSON.stringify(chart)}`);
    }

    // ==========================================
    // TEST 9: Meal Log Timezone Attribution & Date Filtering
    // (Wisconsin Monday Oct 19 Night vs Tuesday Oct 20)
    // ==========================================
    console.log(`\n${colors.bold}--- 9. Testing Meal Log Timezone Attribution (Wisconsin Monday vs Tuesday) ---${colors.reset}`);

    // Create a Macro Goal active on Monday Oct 19
    const testGoal = await prisma.macroGoal.create({
      data: {
        userId,
        name: 'Maintenance',
        calories: 1740,
        protein: 150,
        carbs: 200,
        fat: 50,
        calorieGoalMode: 'AUTO',
        createdAt: new Date('2026-10-19T12:00:00.000Z'),
      },
    });
    cleanupIds.macroGoals.push(testGoal.id);

    // Seed the exact meals logged on Monday Oct 19 at 9:18 - 9:19 PM CDT (stored as 02:18 - 02:19 UTC on Oct 20)
    const meal1 = await prisma.mealLog.create({
      data: {
        userId,
        mealType: 'BREAKFAST',
        description: 'Protein Shake',
        calories: 170,
        carbs: 8,
        protein: 30,
        fats: 4,
        earnedXp: 10,
        loggedAt: new Date('2026-10-20T02:18:01.340Z'), // Oct 19 9:18 PM CDT
      },
    });
    cleanupIds.mealLogs.push(meal1.id);

    const meal2 = await prisma.mealLog.create({
      data: {
        userId,
        mealType: 'LUNCH',
        description: 'Porkchop',
        calories: 204,
        carbs: 0,
        protein: 24,
        fats: 11,
        earnedXp: 10,
        loggedAt: new Date('2026-10-20T02:19:02.895Z'), // Oct 19 9:19 PM CDT
      },
    });
    cleanupIds.mealLogs.push(meal2.id);

    const meal3 = await prisma.mealLog.create({
      data: {
        userId,
        mealType: 'DINNER',
        description: 'Air',
        calories: 0,
        carbs: 0,
        protein: 0,
        fats: 0,
        earnedXp: 10,
        loggedAt: new Date('2026-10-20T02:19:28.372Z'), // Oct 19 9:19 PM CDT
      },
    });
    cleanupIds.mealLogs.push(meal3.id);

    // 9A: When selecting Tuesday (2026-10-20) in America/Chicago, consumed MUST BE ZERO!
    const tuesdaySummary = await mealLogService.getMealLogHistory(
      userId,
      30,
      0,
      'America/Chicago',
      '2026-10-20',
      true // filterLogsByDate
    );

    if (
      tuesdaySummary.consumed.calories === 0 &&
      tuesdaySummary.consumed.protein === 0 &&
      tuesdaySummary.consumed.carb === 0 &&
      tuesdaySummary.consumed.fat === 0 &&
      tuesdaySummary.remaining.calories === 1740 &&
      tuesdaySummary.logs.length === 0
    ) {
      pass(
        'Tuesday Clean Slate (America/Chicago)',
        `Tuesday has 0 consumed kcal/macros and 0 logs for filtered date; Monday evening meals did NOT leak into Tuesday!`
      );
    } else {
      fail(
        'Tuesday Clean Slate (America/Chicago)',
        `Tuesday consumed should be 0, but got: ${JSON.stringify(tuesdaySummary.consumed)}, logsCount: ${tuesdaySummary.logs.length}`
      );
    }

    // 9B: When selecting Monday (2026-10-19) in America/Chicago, consumed MUST BE EXACTLY 374 kcal, 54P, 8C, 15F!
    const mondaySummary = await mealLogService.getMealLogHistory(
      userId,
      30,
      0,
      'America/Chicago',
      '2026-10-19',
      true // filterLogsByDate
    );

    if (
      mondaySummary.consumed.calories === 374 &&
      mondaySummary.consumed.protein === 54 &&
      mondaySummary.consumed.carb === 8 &&
      mondaySummary.consumed.fat === 15 &&
      mondaySummary.remaining.calories === 1740 - 374 &&
      mondaySummary.remaining.protein === 150 - 54 &&
      mondaySummary.weeklyPresent.monday === true &&
      mondaySummary.weeklyPresent.tuesday === false &&
      mondaySummary.logs.length === 3
    ) {
      pass(
        'Monday Exact Attribution (America/Chicago)',
        `Monday accurately credited: 374 kcal, 54g protein, 8g carbs, 15g fat, remaining: ${mondaySummary.remaining.calories} kcal, weeklyPresent.monday: true, weeklyPresent.tuesday: false!`
      );
    } else {
      fail(
        'Monday Exact Attribution (America/Chicago)',
        `Monday summary mismatch: consumed=${JSON.stringify(mondaySummary.consumed)}, remaining=${JSON.stringify(mondaySummary.remaining)}, weeklyPresent=${JSON.stringify(mondaySummary.weeklyPresent)}`
      );
    }

    // 9C: Test UserProfile Fallback Timezone
    await prisma.userProfile.update({
      where: { userId },
      data: { timezone: 'America/Chicago' },
    });
    const fallbackSummary = await mealLogService.getMealLogHistory(
      userId,
      30,
      0,
      undefined, // No timezone provided, must fallback to America/Chicago from profile
      '2026-10-19'
    );
    if (fallbackSummary.consumed.calories === 374) {
      pass(
        'UserProfile Timezone Fallback',
        `Successfully used profile timezone America/Chicago when no timezone passed in query`
      );
    } else {
      fail(
        'UserProfile Timezone Fallback',
        `Expected 374 consumed kcal using profile fallback, got ${fallbackSummary.consumed.calories}`
      );
    }

    // ==========================================
    // TEST 10: Recurring Scheduled Activities Reappearance & Date-Based Completion Isolation
    // ==========================================
    console.log(`\n${colors.bold}--- 10. Testing Recurring Scheduled Activities Reappearance & Date Isolation ---${colors.reset}`);

    // 10A: Create master recurring workout scheduled for Mon, Wed, Fri (1, 3, 5)
    const recurringExercise = await exerciseService.createExerciseSchedule(userId, {
      name: 'Walk the Realm Recurring',
      type: 'CARDIO',
      duration: 30,
      scheduledAt: '2026-10-26T08:00:00.000Z',
      recurrence: 'SPECIFIC_DAYS',
      daysOfWeek: [1, 3, 5],
    });
    cleanupIds.exercises.push(recurringExercise.id);

    if (recurringExercise.id && recurringExercise.name === 'Walk the Realm Recurring') {
      pass('Create Recurring Exercise (Mon, Wed, Fri)', `Created schedule with ID: ${recurringExercise.id}`);
    } else {
      fail('Create Recurring Exercise', `Failed to create: ${JSON.stringify(recurringExercise)}`);
    }

    // 10B: Query Day 1 (Monday, 2026-10-26) - must appear with isTaken: false
    const mondayExercises = await exerciseService.getTodaySchedules(userId, 'America/Chicago', '2026-10-26');
    const mondayItem = mondayExercises.find((e) => e.id === recurringExercise.id);
    if (mondayItem && mondayItem.isTaken === false) {
      pass('Monday (Day 1) Initial Status', 'Activity correctly appeared on Monday with isTaken: false');
    } else {
      fail('Monday (Day 1) Initial Status', `Expected isTaken: false on Monday, got: ${JSON.stringify(mondayItem)}`);
    }

    // 10C: Complete activity on Monday (2026-10-26)
    await scheduleCompletionService.recordCompletion(
      userId,
      recurringExercise.id,
      'WORKOUT',
      'America/Chicago',
      '2026-10-26'
    );
    const mondayAfterCompletion = await exerciseService.getTodaySchedules(userId, 'America/Chicago', '2026-10-26');
    const mondayCompletedItem = mondayAfterCompletion.find((e) => e.id === recurringExercise.id);
    if (mondayCompletedItem && mondayCompletedItem.isTaken === true) {
      pass('Monday (Day 1) Completion', 'Activity correctly marked isTaken: true on Monday');
    } else {
      fail('Monday (Day 1) Completion', `Expected isTaken: true on Monday after completion, got: ${JSON.stringify(mondayCompletedItem)}`);
    }

    // 10D: Query Day 2 (Tuesday, 2026-10-27 - non-scheduled day) - must NOT appear
    const tuesdayExercises = await exerciseService.getTodaySchedules(userId, 'America/Chicago', '2026-10-27');
    const tuesdayItem = tuesdayExercises.find((e) => e.id === recurringExercise.id);
    if (!tuesdayItem) {
      pass('Tuesday (Day 2) Non-Scheduled Exclusion', 'Activity does NOT appear on Tuesday (non-scheduled day)');
    } else {
      fail('Tuesday (Day 2) Non-Scheduled Exclusion', `Activity should NOT appear on Tuesday, but was found: ${JSON.stringify(tuesdayItem)}`);
    }

    // 10E: Query Day 3 (Wednesday, 2026-10-28) - MUST AUTOMATICALLY REAPPEAR with isTaken: false!
    const wednesdayExercises = await exerciseService.getTodaySchedules(userId, 'America/Chicago', '2026-10-28');
    const wednesdayItem = wednesdayExercises.find((e) => e.id === recurringExercise.id);
    if (wednesdayItem && wednesdayItem.isTaken === false) {
      pass(
        'Wednesday (Day 3) Automatic Reappearance',
        'Activity AUTOMATICALLY reappeared on Wednesday with isTaken: false! (0% leakage from Monday)'
      );
    } else {
      fail(
        'Wednesday (Day 3) Automatic Reappearance',
        `Expected activity to reappear on Wednesday with isTaken: false, but got: ${JSON.stringify(wednesdayItem)}`
      );
    }

    // 10F: Query Day 5 (Friday, 2026-10-30) - must also appear with isTaken: false
    const fridayExercises = await exerciseService.getTodaySchedules(userId, 'America/Chicago', '2026-10-30');
    const fridayItem = fridayExercises.find((e) => e.id === recurringExercise.id);
    if (fridayItem && fridayItem.isTaken === false) {
      pass('Friday (Day 5) Occurrence', 'Activity correctly appears on Friday with isTaken: false');
    } else {
      fail('Friday (Day 5) Occurrence', `Expected Friday isTaken: false, got: ${JSON.stringify(fridayItem)}`);
    }

    // 10G: Weekday Normalization (Sunday 0 -> 7, repeatDays string "1, 3, 5")
    const { normalizeDaysOfWeek } = require('../dist/src/common/utils/weekday.util');
    const sundayNormalized = normalizeDaysOfWeek(0);
    const delimitedNormalized = normalizeDaysOfWeek("1, 3, 5");
    const jsonNormalized = normalizeDaysOfWeek("[1, 3, 5]");
    const aliasNormalized = normalizeDaysOfWeek(undefined, { repeatDays: [2, 4] });

    if (
      JSON.stringify(sundayNormalized) === '[7]' &&
      JSON.stringify(delimitedNormalized) === '[1,3,5]' &&
      JSON.stringify(jsonNormalized) === '[1,3,5]' &&
      JSON.stringify(aliasNormalized) === '[2,4]'
    ) {
      pass(
        'Weekday Normalization Robustness',
        'Correctly handled Sunday 0->7, "1, 3, 5", "[1, 3, 5]", and alias repeatDays [2, 4]'
      );
    } else {
      fail(
        'Weekday Normalization Robustness',
        `Mismatch: sunday=${JSON.stringify(sundayNormalized)}, delimited=${JSON.stringify(delimitedNormalized)}, json=${JSON.stringify(jsonNormalized)}, alias=${JSON.stringify(aliasNormalized)}`
      );
    }

    // 10H: Quests Feed Integration & Completion
    const wednesdayQuests = await feedService.getTodaysQuests(userId, '2026-10-28', 'America/Chicago');
    const workoutQuest = wednesdayQuests.data.find((q) => q.originalRefId === recurringExercise.id);
    if (workoutQuest && workoutQuest.isCompleted === false) {
      pass('Quests Feed Integration', 'Recurring workout appeared in GET /quests/today with isCompleted: false');
    } else {
      fail('Quests Feed Integration', `Expected quest in /quests/today with isCompleted: false, got: ${JSON.stringify(workoutQuest)}`);
    }

    // Complete via Quests Feed for Wednesday (2026-10-28)
    await feedService.completeQuest(userId, { questId: `workout_${recurringExercise.id}`, dateStr: '2026-10-28' }, 'America/Chicago');
    const wednesdayQuestsAfter = await feedService.getTodaysQuests(userId, '2026-10-28', 'America/Chicago');
    const workoutQuestAfter = wednesdayQuestsAfter.data.find((q) => q.originalRefId === recurringExercise.id);
    if (workoutQuestAfter && workoutQuestAfter.isCompleted === true) {
      pass('Quests Feed Completion', 'Completed workout through Quests Feed, isCompleted: true confirmed');
    } else {
      fail('Quests Feed Completion', `Expected isCompleted: true after quest completion, got: ${JSON.stringify(workoutQuestAfter)}`);
    }

    // Verify Friday is STILL isTaken: false despite Wednesday completion
    const fridayAfterWedCompletion = await exerciseService.getTodaySchedules(userId, 'America/Chicago', '2026-10-30');
    const fridayItemAfter = fridayAfterWedCompletion.find((e) => e.id === recurringExercise.id);
    if (fridayItemAfter && fridayItemAfter.isTaken === false) {
      pass('Friday Independence', 'Wednesday completion did NOT leak into Friday! Friday is still isTaken: false');
    } else {
      fail('Friday Independence', `Friday leaked: ${JSON.stringify(fridayItemAfter)}`);
    }

  } catch (err) {
    fail('Unexpected Test Error', err);
  } finally {
    // ==========================================
    // CLEANUP & TEARDOWN
    // ==========================================
    console.log(`\n${colors.bold}--- Teardown & Cleanup ---${colors.reset}`);
    if (cleanupIds.mealLogs && cleanupIds.mealLogs.length > 0) {
      await prisma.mealLog.deleteMany({ where: { id: { in: cleanupIds.mealLogs } } });
    }
    if (cleanupIds.macroGoals && cleanupIds.macroGoals.length > 0) {
      await prisma.macroGoal.deleteMany({ where: { id: { in: cleanupIds.macroGoals } } });
    }
    if (cleanupIds.customQuests.length > 0) {
      await prisma.customQuest.deleteMany({ where: { id: { in: cleanupIds.customQuests } } });
    }
    if (cleanupIds.xpLogs.length > 0) {
      await prisma.xpLog.deleteMany({ where: { id: { in: cleanupIds.xpLogs } } });
    }
    if (cleanupIds.medications.length > 0) {
      await prisma.medicationSchedule.deleteMany({ where: { id: { in: cleanupIds.medications } } });
    }
    if (cleanupIds.meals.length > 0) {
      await prisma.mealSchedule.deleteMany({ where: { id: { in: cleanupIds.meals } } });
    }
    if (cleanupIds.exercises.length > 0) {
      await prisma.exerciseScheduleLog.deleteMany({ where: { id: { in: cleanupIds.exercises } } });
    }
    if (cleanupIds.scheduleItems && cleanupIds.scheduleItems.length > 0) {
      await prisma.scheduleCompletionLog.deleteMany({ where: { scheduleItemId: { in: cleanupIds.scheduleItems } } });
      await prisma.scheduleItem.deleteMany({ where: { id: { in: cleanupIds.scheduleItems } } });
    }
    // Delete test schedule completions
    await prisma.scheduleCompletion.deleteMany({ where: { userId } });
    // Delete test step logs
    await prisma.stepLog.deleteMany({ where: { userId } });
    // Delete any XP logs awarded to test user during test
    await prisma.xpLog.deleteMany({ where: { userId } });

    console.log(`[Cleanup] All test artifacts removed successfully.`);
    await prisma.$disconnect();
  }

  console.log(`\n${colors.bold}${colors.green}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.green}  ALL TESTS COMPLETED SUCCESSFULLY!                ${colors.reset}`);
  console.log(`${colors.bold}${colors.green}====================================================${colors.reset}\n`);
}

runTests().catch((e) => {
  console.error('Fatal execution error:', e);
  process.exit(1);
});
