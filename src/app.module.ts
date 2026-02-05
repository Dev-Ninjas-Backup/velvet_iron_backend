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
  ],
  controllers: [AppController],
  providers: [AppService, LeveladdService, SeedService],
})
export class AppModule {}
