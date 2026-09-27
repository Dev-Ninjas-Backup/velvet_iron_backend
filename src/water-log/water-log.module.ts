import { Module } from '@nestjs/common';
import { WaterLogController } from './water-log.controller';
import { WaterLogService } from './water-log.service';
import { PrismaModule } from '../lib/prisma/prisma.module';
import { LeveladdModule } from '../leveladd/leveladd.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    LeveladdModule,
    PassportModule,
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [WaterLogController],
  providers: [WaterLogService],
  exports: [WaterLogService],
})
export class WaterLogModule {}

