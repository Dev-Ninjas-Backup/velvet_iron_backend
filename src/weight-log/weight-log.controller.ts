import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import { WeightLogService } from './weight-log.service';
import {
  CreateWeightLogDto,
  UpdateWeightLogDto,
} from './dto/create-weight-log.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidAll } from '../common/decorators/validate.decorator';
import {
  WeightLogResponseDto,
  WeeklyWeightChartDto,
  WeightHistoryWithStatsDto,
} from './dto/weight-log-response.dto';
import { LeveladdService } from '@/leveladd/leveladd.service';

@ApiTags('Weight Log')
@Controller('weight-log')
export class WeightLogController {
  constructor(private readonly weightLogService: WeightLogService, private leveladdService: LeveladdService,) {}

  @Post()
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log weight entry' })
  @ApiResponse({
    status: 201,
    description: 'Weight logged successfully',
    type: WeightLogResponseDto,
  })
  async createWeightLog(
    @GetUser('id') userId: string,
    @Body() dto: CreateWeightLogDto,
  ): Promise<WeightLogResponseDto> {
    return this.weightLogService.createWeightLog(userId, dto);
  }

  @Get('history')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get weight log history with stats' })
  @ApiResponse({
    status: 200,
    description: 'Weight history with current weight, total changes, and count',
    type: WeightHistoryWithStatsDto,
  })
  async getWeightHistory(
    @GetUser('id') userId: string,
  ): Promise<WeightHistoryWithStatsDto> {
    return this.weightLogService.getWeightHistory(userId);
  }

  @Get('chart/weekly')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get weekly weight chart data' })
  @ApiResponse({
    status: 200,
    description: 'Weekly weight chart data retrieved successfully',
    type: WeeklyWeightChartDto,
  })
  async getWeeklyWeightChart(
    @GetUser('id') userId: string,
  ): Promise<WeeklyWeightChartDto> {
    return this.weightLogService.getWeeklyWeightChart(userId);
  }

  @Get('today')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get today's weight log" })
  @ApiResponse({
    status: 200,
    description: "Today's weight log retrieved successfully",
    type: WeightLogResponseDto,
  })
  async getTodayWeightLog(
    @GetUser('id') userId: string,
  ): Promise<WeightLogResponseDto | null> {
    return this.weightLogService.getTodayWeightLog(userId);
  }

  @Patch('today')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update today's weight log" })
  @ApiResponse({
    status: 200,
    description: "Today's weight log updated successfully",
    type: WeightLogResponseDto,
  })
  async updateTodayWeightLog(
    @GetUser('id') userId: string,
    @Body() dto: UpdateWeightLogDto,
  ): Promise<WeightLogResponseDto> {
    return this.weightLogService.updateTodayWeightLog(userId, dto);
  }
}
