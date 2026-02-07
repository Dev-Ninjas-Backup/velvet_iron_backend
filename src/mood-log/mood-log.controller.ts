import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { MoodLogService } from './mood-log.service';
import { CreateMoodLogDto, EnergyLevel } from './dto/create-mood-log.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidAll } from '../common/decorators/validate.decorator';
import {
  MoodLogResponseDto,
  MoodLogHistoryDto,
} from './dto/mood-log-response.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Mood Log')
@Controller('mood-log')
export class MoodLogController {
  constructor(private readonly moodLogService: MoodLogService) {}

  @Post()
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log mood entry' })
  @ApiResponse({
    status: 201,
    description: 'Mood logged successfully',
    type: MoodLogResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    description: 'Mood log entry data',
    schema: {
      type: 'object',
      required: ['mood', 'energyLevel', 'hungerLevel'],
      properties: {
        mood: {
          type: 'string',
          enum: ['TIRED', 'GOOD', 'PISSED', 'GREAT', 'POOR'],
          description: 'Current mood',
          example: 'GOOD',
        },
        energyLevel: {
          type: 'string',
          enum: ['EXHAUSTED', 'LOW', 'MODERATE', 'ENERGIZED', 'HIGH'],
          description: 'Current energy level',
          example: 'MODERATE',
        },
        hungerLevel: {
          type: 'string',
          enum: ['NOT_HUNGRY', 'HUNGRY', 'VERY_HUNGRY'],
          description: 'Current hunger level',
          example: 'HUNGRY',
        },
        note: {
          type: 'string',
          description: 'Additional notes about mood',
          example: 'Feeling good after workout',
        },
        loggedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Log timestamp (ISO 8601)',
          example: '2026-02-07T10:30:00Z',
        },
      },
    },
  })
  async createMoodLog(
    @GetUser('id') userId: string,
    @Body() dto: any,
  ): Promise<MoodLogResponseDto> {
    console.log(dto);
    return this.moodLogService.createMoodLog(userId, dto);
  }

  @Get('history')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get mood log history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of logs to fetch',
    example: 30,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of logs to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Mood log history with current mood and total count',
    type: MoodLogHistoryDto,
  })
  async getMoodLogHistory(
    @GetUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<MoodLogHistoryDto> {
    const parsedLimit = limit ? parseInt(limit, 10) : 30;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    return this.moodLogService.getMoodLogHistory(
      userId,
      parsedLimit,
      parsedOffset,
    );
  }

  @Get('latest')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get latest mood log' })
  @ApiResponse({
    status: 200,
    description: 'Latest mood log',
    type: MoodLogResponseDto,
  })
  async getLatestMoodLog(
    @GetUser('id') userId: string,
  ): Promise<MoodLogResponseDto | null> {
    return this.moodLogService.getLatestMoodLog(userId);
  }

  @Delete(':id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete mood log' })
  @ApiParam({
    name: 'id',
    description: 'Mood log ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Mood log deleted successfully',
  })
  async deleteMoodLog(
    @GetUser('id') userId: string,
    @Param('id') logId: string,
  ): Promise<{ message: string }> {
    await this.moodLogService.deleteMoodLog(userId, logId);
    return { message: 'Mood log deleted successfully' };
  }
}
