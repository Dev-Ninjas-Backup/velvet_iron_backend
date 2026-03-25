import { Module } from '@nestjs/common';
import { MedicationScheduleController } from './medication-schedule.controller';
import { MedicationScheduleService } from './medication-schedule.service';
import { PrismaModule } from '../lib/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '1h' },
      }),
    }),
    AuthModule,
  ],
  controllers: [MedicationScheduleController],
  providers: [MedicationScheduleService],
  exports: [MedicationScheduleService],
})
export class MedicationScheduleModule {}
