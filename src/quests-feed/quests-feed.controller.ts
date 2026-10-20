import { Controller, Get, Post, Patch, Body, Req, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { QuestsFeedService } from './quests-feed.service';
import { ValidUser } from '../common/decorators/validate.decorator';
import { CompleteQuestDto } from './dto/complete-quest.dto';
import { extractTimezone } from '../common/utils/timezone.util';

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
    const tz = extractTimezone(req);
    return this.questsFeedService.getTodaysQuests(req.user.id, dateStr, tz);
  }

  @Post(['today/complete', ':id/complete', 'complete'])
  @Patch(['today/complete', ':id/complete', 'complete'])
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark a unified quest as complete (supports /quests/today/complete and /quests/:id/complete)' })
  @ApiParam({ name: 'id', required: false, description: 'Quest identifier (optional if passed in body)' })
  async completeQuest(
    @Req() req: any,
    @Body() dto: CompleteQuestDto,
    @Param('id') paramId?: string,
  ) {
    const tz = extractTimezone(req);
    const resolvedDto: CompleteQuestDto = {
      ...dto,
      questId: dto?.questId || paramId || (dto as any)?.id,
    };
    return this.questsFeedService.completeQuest(req.user.id, resolvedDto, tz);
  }
}
