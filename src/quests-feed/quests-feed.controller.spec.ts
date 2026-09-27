import { Test, TestingModule } from '@nestjs/testing';
import { QuestsFeedController } from './quests-feed.controller';

describe('QuestsFeedController', () => {
  let controller: QuestsFeedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestsFeedController],
    }).compile();

    controller = module.get<QuestsFeedController>(QuestsFeedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
