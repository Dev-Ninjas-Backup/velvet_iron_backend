import { Module } from '@nestjs/common';
import { MacroGoalService } from './macro-goal.service';
import { MacroGoalController } from './macro-goal.controller';
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
    controllers: [MacroGoalController],
    providers: [MacroGoalService],
})
export class MacroGoalModule { }
