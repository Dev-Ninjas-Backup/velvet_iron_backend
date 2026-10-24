import { Global, Module } from '@nestjs/common';
import { ScheduleCompletionService } from './schedule-completion.service';
import { PrismaModule } from '../lib/prisma/prisma.module';
import { LeveladdModule } from '@/leveladd/leveladd.module';

@Global()
@Module({
  imports: [PrismaModule, LeveladdModule],
  providers: [ScheduleCompletionService],
  exports: [ScheduleCompletionService],
})
export class ScheduleCompletionModule {}
