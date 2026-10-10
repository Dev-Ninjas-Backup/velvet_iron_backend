import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StepLogService } from './step-log.service';
import { UpdateStepsDto, UpdateStepGoalDto } from './dto/step-log.dto';
import {
  StepTodayResponseDto,
  SetUpCampResponseDto,
} from './dto/step-today-response.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidUser } from '../common/decorators/validate.decorator';
import { extractTimezone } from '../common/utils/timezone.util';

@ApiTags('Step Journey')
@Controller('step-log')
export class StepLogController {
  constructor(private readonly stepLogService: StepLogService) {}

  @Get('today')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Get today step progress, fantasy journey map position, and lore milestones',
  })
  @ApiQuery({ name: 'date', required: false, type: String, example: '2026-10-14' })
  @ApiResponse({
    status: 200,
    description: 'Current steps vs goal, fantasy map state, and camp status',
    type: StepTodayResponseDto,
  })
  async getTodaySteps(
    @GetUser('id') userId: string,
    @Req() req: any,
    @Query('date') dateStr?: string,
  ): Promise<StepTodayResponseDto> {
    const tz = extractTimezone(req);
    return this.stepLogService.getTodaySteps(userId, tz, dateStr);
  }

  @Post()
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Enter or update steps for today (or increment)' })
  @ApiResponse({
    status: 200,
    description: 'Steps updated successfully',
  })
  async updateSteps(
    @GetUser('id') userId: string,
    @Body() dto: UpdateStepsDto,
  ) {
    return this.stepLogService.updateSteps(userId, dto);
  }

  @Post('set-up-camp')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Perform Set Up Camp ritual: locks day distance, pitches camp, adds steps to journey',
  })
  @ApiResponse({
    status: 200,
    description: 'Camp pitched successfully, lifetime journey updated',
    type: SetUpCampResponseDto,
  })
  async setUpCamp(
    @GetUser('id') userId: string,
  ): Promise<SetUpCampResponseDto> {
    return this.stepLogService.setUpCamp(userId);
  }

  @Put('goal')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Update personal daily step goal' })
  @ApiResponse({
    status: 200,
    description: 'Daily step goal updated successfully',
  })
  async updateStepGoal(
    @GetUser('id') userId: string,
    @Body() dto: UpdateStepGoalDto,
  ) {
    return this.stepLogService.updateStepGoal(userId, dto);
  }

  @Get('history')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Get 30-day step history and campsite log for calendar' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 30 })
  @ApiResponse({
    status: 200,
    description: 'Array of historical daily step and camp logs',
  })
  async getStepHistory(
    @GetUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.stepLogService.getStepHistory(userId, limit);
  }
}

