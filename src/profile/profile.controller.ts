import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AddXpDto } from './dto/add-xp.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidAll, ValidUser } from '../common/decorators/validate.decorator';
import { fitnessGoalDTO } from './dto/fitnessGoal.dto';
import { ScheduleRange } from './profile.service';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get()
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary:
      'Get my profile with XP and level, optionally with scheduled items',
  })
  @ApiQuery({
    name: 'withSchedules',
    required: false,
    type: Boolean,
    description: 'Deprecated: schedules are returned by default',
  })
  @ApiQuery({
    name: 'scheduleRange',
    required: false,
    enum: ['today', 'week', 'month', 'all'],
    description: 'Filter schedules by range (defaults to all)',
  })
  getMyProfile(
    @GetUser('id') userId: string,
    @Query('withSchedules') withSchedules?: string | boolean,
    @Query('scheduleRange') scheduleRange?: ScheduleRange,
  ) {
    const includeSchedules =
      withSchedules === undefined ||
      withSchedules === 'true' ||
      withSchedules === true;

    if (!includeSchedules) {
      return this.profileService.getProfile(userId);
    }

    return this.profileService.getProfileWithSchedules(userId, scheduleRange);
  }

  @Post('add-xp')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Add XP to my profile (for testing)' })
  addXp(@GetUser('id') userId: string, @Body() addXpDto: AddXpDto) {
    return this.profileService.addXp(userId, addXpDto.xp);
  }

  //add xp with valid reason and log it in leveladd table
  @Post('add-xp/log')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Add XP to my profile and log it in leveladd table',
  })
  async addXpAndLog(@GetUser('id') userId: string, @Body() addXpDto: AddXpDto) {
    // console.log(addXpDto);

    // const result = await this.profileService.addXp(userId, addXpDto.xp);
    return await this.profileService.logXpChange(
      userId,
      addXpDto.xp,
      addXpDto.reason,
    );
  }

  @Post('daily-login')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Claim daily login XP' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        xp: { type: 'number', example: 15 },
      },
    },
  })
  async claimDailyXp(@GetUser('id') userId: string, @Body('xp') xp: number) {
    return await this.profileService.claimDailyLoginXp(userId, xp);
  }

  @Patch('fitness-goal')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Update my fitness goal' })
  updateFitnessGoal(
    @GetUser('id') userId: string,
    @Body() updateFitnessGoalDto: fitnessGoalDTO,
  ) {
    return this.profileService.updateFitnessGoal(userId, updateFitnessGoalDto);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get XP leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLeaderboard(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.profileService.getLeaderboard(limit || 10);
  }

  @Get('chart/weekly')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Get weekly chart data - Daily XP for each day of the week',
  })
  getWeeklyChart(@GetUser('id') userId: string) {
    return this.profileService.getWeeklyChartData(userId);
  }

  @Get('chart/monthly')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Get monthly chart data - Weekly XP for each week of the month',
  })
  getMonthlyChart(@GetUser('id') userId: string) {
    return this.profileService.getMonthlyChartData(userId);
  }
}
