import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './lib/prisma/prisma.module';
import { UserModule } from './user/user.module';
import { S3Module } from './s3/s3.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ThemeModule } from './theme/theme.module';
import { CompanionModule } from './companion/companion.module';
import { ProfileModule } from './profile/profile.module';
import { LeveladdService } from './leveladd/leveladd.service';
import { LeveladdModule } from './leveladd/leveladd.module';
import { SeedService } from './common/seed.service';
import { WeightLogModule } from './weight-log/weight-log.module';
import { XpStatsModule } from './xp-stats/xp-stats.module';
import { MoodLogModule } from './mood-log/mood-log.module';
import { MealLogModule } from './meal-log/meal-log.module';
import { MealScheduleModule } from './meal-schedule/meal-schedule.module';
import { MedicationModule } from './medication/medication.module';
import { MedicationScheduleModule } from './medication-schedule/medication-schedule.module';
import { ExerciseLogModule } from './exercise-log/exercise-log.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { MacroGoalModule } from './macro-goal/macro-goal.module';
import { PaymentModule } from './payment/payment.module';
import { GuardsModule } from './common/guards/guards.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    AuthModule,
    S3Module,
    ThemeModule,
    CompanionModule,
    ProfileModule,
    LeveladdModule,
    WeightLogModule,
    XpStatsModule,
    MoodLogModule,
    MealLogModule,
    MealScheduleModule,
    MedicationModule,
    MedicationScheduleModule,
    ExerciseLogModule,
    OnboardingModule,
    MacroGoalModule,
    PaymentModule,
    GuardsModule,
  ],
  controllers: [AppController],
  providers: [AppService, LeveladdService, SeedService],
})
export class AppModule { }
