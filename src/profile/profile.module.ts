import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { MealScheduleModule } from '../meal-schedule/meal-schedule.module';
import { MedicationScheduleModule } from '../medication-schedule/medication-schedule.module';
import { ExerciseLogModule } from '../exercise-log/exercise-log.module';

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
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule { }
