import { Controller, Get, Query } from '@nestjs/common';
import { XpStatsService } from './xp-stats.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ValidAll, ValidUser } from '@/common/decorators/validate.decorator';
import { XpStatsQueryDto } from './dto/xp-stats-query.dto';

@ApiTags('XP Statistics')
@Controller('xp-stats')
export class XpStatsController {
  constructor(private readonly xpStatsService: XpStatsService) { }

  @Get('today')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: "Get today's total XP" })
  async getTodayXp(@GetUser('id') userId: string) {
    return this.xpStatsService.getTodayXp(userId);
  }

  @Get('quests')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Get quest data from XP today' })
  async getTodayQuestXp(@GetUser('id') userId: string) {
    return this.xpStatsService.getTodayQuestXp(userId);
  }

  @Get('weekly')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: "Get this week's total XP" })
  async getWeeklyXp(@GetUser('id') userId: string) {
    return this.xpStatsService.getWeeklyXp(userId);
  }

  @Get('monthly')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: "Get this month's total XP" })
  async getMonthlyXp(@GetUser('id') userId: string) {
    return this.xpStatsService.getMonthlyXp(userId);
  }

  @Get('summary')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Get XP summary (today, week, month combined)' })
  async getXpSummary(@GetUser('id') userId: string) {
    return this.xpStatsService.getXpSummary(userId);
  }

  @Get('logs')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Get all XP logs with pagination' })
  @ApiQuery({ name: 'skip', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 50 })
  async getAllXpLogs(
    @GetUser('id') userId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 50;
    return this.xpStatsService.getAllXpLogs(userId, skipNum, takeNum);
  }

  @Get('chart/weekly')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Get weekly chart data - Daily XP for each day of the week',
  })
  async getWeeklyChartData(@GetUser('id') userId: string) {
    return this.xpStatsService.getWeeklyChartData(userId);
  }

  @Get('chart/monthly')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Get monthly chart data - Weekly XP for each week of the month',
  })
  async getMonthlyChartData(@GetUser('id') userId: string) {
    return this.xpStatsService.getMonthlyChartData(userId);
  }
}
