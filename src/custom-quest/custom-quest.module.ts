import { Module } from '@nestjs/common';
import { CustomQuestController } from './custom-quest.controller';
import { CustomQuestService } from './custom-quest.service';
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
  controllers: [CustomQuestController],
  providers: [CustomQuestService],
  exports: [CustomQuestService],
})
export class CustomQuestModule {}

