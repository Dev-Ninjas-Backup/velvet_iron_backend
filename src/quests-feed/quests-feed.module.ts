import { Module } from '@nestjs/common';
import { QuestsFeedService } from './quests-feed.service';
import { QuestsFeedController } from './quests-feed.controller';
import { CustomQuestModule } from '../custom-quest/custom-quest.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { XpStatsModule } from '../xp-stats/xp-stats.module';
import { LeveladdModule } from '../leveladd/leveladd.module';

@Module({
  imports: [CustomQuestModule, SchedulesModule, XpStatsModule, LeveladdModule],
  controllers: [QuestsFeedController],
  providers: [QuestsFeedService],
})
export class QuestsFeedModule {}
