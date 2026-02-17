import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MealScheduleModule } from '../meal-schedule/meal-schedule.module';
import { MedicationScheduleModule } from '../medication-schedule/medication-schedule.module';
import { ExerciseLogModule } from '../exercise-log/exercise-log.module';
import { XpStatsModule } from '../xp-stats/xp-stats.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '1h' },
      }),
    }),
    MealScheduleModule,
    MedicationScheduleModule,
    ExerciseLogModule,
    XpStatsModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule { }
