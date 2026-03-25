import { forwardRef, Module } from '@nestjs/common';
import { XpTimeoutService } from './xp-timeout.service';
import { XpTimeoutController } from './xp-timeout.controller';
import { PrismaModule } from '@/lib/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [XpTimeoutController],
  providers: [XpTimeoutService],
})
export class XpTimeoutModule {}
