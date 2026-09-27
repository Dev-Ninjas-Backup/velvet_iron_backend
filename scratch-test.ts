import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { QuestsFeedService } from './src/quests-feed/quests-feed.service';
import { MealLogService } from './src/meal-log/meal-log.service';
import { PrismaService } from './src/lib/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const questsService = app.get(QuestsFeedService);
  const mealLogService = app.get(MealLogService);

  console.log('--- DB Connection Established ---');
  
  // 1. Create a test user
  let user = await prisma.client.user.findFirst({ where: { email: 'test@scratch.com' }});
  if (!user) {
      user = await prisma.client.user.create({
          data: {
              email: 'test@scratch.com',
              password: 'password123',
              name: 'Scratch Test User',
              onBoarded: true,
          }
      });
  }

  // 2. Create UserProfile for XP
  let profile = await prisma.client.userProfile.findUnique({ where: { userId: user.id }});
  if (!profile) {
      profile = await prisma.client.userProfile.create({
          data: {
              userId: user.id,
              level: 1,
              balanceXp: 0,
              totalEarnXp: 0
          } as any
      });
  }

  console.log(`\n--- Test User Ready: ${user.id} ---`);

  // --- Test Meal Log Calorie Override ---
  console.log('\n--- 1. Testing Meal Log Override ---');
  const ml1 = await mealLogService.createMealLog(user.id, {
      mealType: 'LUNCH',
      carbs: 10,
      protein: 10,
      fats: 10,
      // fallback should be 40 + 40 + 90 = 170
  } as any);
  console.log(`Fallback Calories (expected 170): ${ml1.calories}`);

  const ml2 = await mealLogService.createMealLog(user.id, {
      mealType: 'DINNER',
      carbs: 10,
      protein: 10,
      fats: 10,
      calories: 300 // override!
  } as any);
  console.log(`Overridden Calories (expected 300): ${ml2.calories}`);


  // --- Test Quests Feed ---
  console.log('\n--- 2. Testing Quests Feed ---');
  
  // create a custom quest
  const cq = await prisma.client.customQuest.create({
      data: {
          userId: user.id,
          name: 'Scratch Custom Quest',
          category: 'GENERAL',
          recurrence: 'DAILY',
          xp: 15
      }
  });

  // create a med schedule
  const ms = await prisma.client.medicationSchedule.create({
      data: {
          userId: user.id,
          name: 'Scratch Meds',
          doseMg: 10,
          scheduleTime: new Date(),
          recurrence: 'DAILY'
      }
  });

  // Fetch unified quests
  const questsRes = await questsService.getTodaysQuests(user.id);
  console.log('\nUnified Quests Data:');
  console.log(JSON.stringify(questsRes.data.map((q: any) => ({ title: q.title, type: q.questType, id: q.id })), null, 2));

  // --- Test Completion Endpoint ---
  console.log('\n--- 3. Testing Completion Routing ---');
  const medQuest = questsRes.data.find((q: any) => q.questType === 'MEDICATION_SCHEDULE');
  if (medQuest) {
      console.log(`Completing Med Quest: ${medQuest.id}`);
      const res = await questsService.completeQuest(user.id, {
          questId: medQuest.id,
          questType: medQuest.questType
      } as any);
      console.log('Completion Result:', res);
  }

  // Cleanup
  console.log('\n--- Cleanup ---');
  await prisma.client.customQuest.deleteMany({ where: { userId: user.id }});
  await prisma.client.medicationSchedule.deleteMany({ where: { userId: user.id }});
  await prisma.client.mealLog.deleteMany({ where: { userId: user.id }});
  
  await app.close();
}
bootstrap();
