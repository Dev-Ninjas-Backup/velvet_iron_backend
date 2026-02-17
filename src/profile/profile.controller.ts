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
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidAll } from '../common/decorators/validate.decorator';
import { fitnessGoalDTO } from './dto/fitnessGoal.dto';
import { ScheduleRange } from './profile.service';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get()
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my profile with XP and level, optionally with scheduled items' })
  @ApiQuery({ name: 'withSchedules', required: false, type: Boolean, description: 'Deprecated: schedules are returned by default' })
  @ApiQuery({ name: 'scheduleRange', required: false, enum: ['today', 'week', 'month', 'all'], description: 'Filter schedules by range (defaults to all)' })
  getMyProfile(
    @GetUser('id') userId: string,
    @Query('withSchedules') withSchedules?: string | boolean,
    @Query('scheduleRange') scheduleRange?: ScheduleRange,
  ) {
    const includeSchedules = withSchedules === undefined || withSchedules === 'true' || withSchedules === true;

    if (!includeSchedules) {
      return this.profileService.getProfile(userId);
    }

    return this.profileService.getProfileWithSchedules(userId, scheduleRange);
  }

  @Post('add-xp')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add XP to my profile (for testing)' })
  addXp(@GetUser('id') userId: string, @Body() addXpDto: AddXpDto) {
    return this.profileService.addXp(userId, addXpDto.xp);
  }


  @Patch("fitness-goal")
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my fitness goal' })
  updateFitnessGoal(@GetUser('id') userId: string, @Body() updateFitnessGoalDto: fitnessGoalDTO) {
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
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get weekly chart data - Daily XP for each day of the week' })
  getWeeklyChart(@GetUser('id') userId: string) {
    return this.profileService.getWeeklyChartData(userId);
  }

  @Get('chart/monthly')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get monthly chart data - Weekly XP for each week of the month' })
  getMonthlyChart(@GetUser('id') userId: string) {
    return this.profileService.getMonthlyChartData(userId);
  }
}
