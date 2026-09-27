import { Module } from '@nestjs/common';
import { QuestsFeedController } from './quests-feed.controller';
import { QuestsFeedService } from './quests-feed.service';

@Module({
  controllers: [QuestsFeedController],
  providers: [QuestsFeedService]
})
export class QuestsFeedModule {}
