import { Global, Module } from '@nestjs/common';
import { OptionalJwtGuard } from '../optional-auth.guard';
import { RoleGuard } from './role.guard';
import { OwnUserGuard } from './own-user.guard';
import { OptionalRoleGuard } from './optional-role.guard';
import { AuthModule } from '../../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
    imports: [
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
    providers: [
        OptionalJwtGuard,
        RoleGuard,
        OwnUserGuard,
        OptionalRoleGuard,
    ],
    exports: [
        OptionalJwtGuard,
        RoleGuard,
        OwnUserGuard,
        OptionalRoleGuard,
        JwtModule,
        AuthModule,
    ],
})
export class GuardsModule { }