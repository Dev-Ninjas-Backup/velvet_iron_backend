import { Module } from '@nestjs/common';
import { MealLogController } from './meal-log.controller';
import { MealLogService } from './meal-log.service';
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
    controllers: [MealLogController],
    providers: [MealLogService],
    exports: [MealLogService],
})
export class MealLogModule { }
