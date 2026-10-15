import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuestsFeedService } from './quests-feed.service';
import { ValidUser } from '../common/decorators/validate.decorator';
import { CompleteQuestDto } from './dto/complete-quest.dto';

@ApiTags('Unified Quests Feed')
@Controller('quests')
export class QuestsFeedController {
  constructor(private readonly questsFeedService: QuestsFeedService) {}

  @Get('today')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get unified quests feed for today (Custom, Schedules, Codex)' })
  @ApiQuery({ name: 'date', required: false, description: 'Format YYYY-MM-DD' })
  async getTodaysQuests(@Req() req: any, @Query('date') dateStr?: string) {
    const tz = req.headers?.['x-timezone'] || req.headers?.['x-time-zone'] || req.query?.timezone;
    return this.questsFeedService.getTodaysQuests(req.user.id, dateStr, tz);
  }

  @Post('today/complete')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark a unified quest as complete' })
  async completeQuest(@Req() req: any, @Body() dto: CompleteQuestDto) {
    return this.questsFeedService.completeQuest(req.user.id, dto);
  }
}
