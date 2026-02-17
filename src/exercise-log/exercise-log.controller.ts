import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { ExerciseLogService } from './exercise-log.service';
import {
  CreateExerciseLogDto,
  UpdateExerciseLogDto,
} from './dto/create-exercise-log.dto';
import {
  CreateExerciseScheduleDto,
  UpdateExerciseScheduleDto,
} from './dto/create-exercise-schedule.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidAll } from '../common/decorators/validate.decorator';
import {
  ExerciseLogResponseDto,
  ExerciseLogHistoryDto,
  ExerciseScheduleResponseDto,
  ExerciseScheduleDetailResponseDto,
  ExerciseScheduleHistoryDto,
} from './dto/exercise-log-response.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Exercise Log')
@Controller('exercise-log')
export class ExerciseLogController {
  constructor(private readonly exerciseLogService: ExerciseLogService) { }

  private normalizeBooleanInput(value: unknown): boolean | undefined {
    if (value === '' || value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'on'].includes(normalized)) return true;
      if (['false', '0', 'off'].includes(normalized)) return false;
      return undefined;
    }
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    if (value === true || value === false) {
      return value;
    }
    return undefined;
  }

  @Post()
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new exercise log' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    description: 'Exercise log data for creation',
    schema: {
      type: 'object',
      required: ['type', 'name'],
      properties: {
        type: {
          type: 'string',
          enum: ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE'],
          description: 'Type of exercise',
          example: 'CARDIO',
        },
        name: {
          type: 'string',
          description: 'Name of the exercise',
          example: 'Running',
        },
        intensity: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          description: 'Intensity level',
          example: 'MEDIUM',
        },
        duration: {
          type: 'integer',
          description: 'Duration in minutes',
          example: 30,
        },
        note: {
          type: 'string',
          description: 'Additional notes',
          example: 'Morning run',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Exercise log created successfully',
    type: ExerciseLogResponseDto,
  })
  async createExerciseLog(
    @GetUser('id') userId: string,
    @Body() dto: CreateExerciseLogDto,
  ): Promise<ExerciseLogResponseDto> {
    return this.exerciseLogService.createExerciseLog(userId, dto);
  }

  @Get('history')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get exercise log history with total count' })
  @ApiResponse({
    status: 200,
    description: 'Exercise log history with total count retrieved successfully',
    type: ExerciseLogHistoryDto,
  })
  async getExerciseLogHistory(
    @GetUser('id') userId: string,
  ): Promise<ExerciseLogHistoryDto> {
    return this.exerciseLogService.getExerciseLogHistory(userId);
  }

  @Get('schedule')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get exercise schedule (latest 30 logs)' })
  @ApiResponse({
    status: 200,
    description: 'Exercise schedule retrieved successfully',
    type: [ExerciseScheduleResponseDto],
  })
  async getExerciseSchedule(
    @GetUser('id') userId: string,
  ): Promise<ExerciseScheduleResponseDto[]> {
    return this.exerciseLogService.getExerciseSchedule(userId);
  }

  @Get(':id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific exercise log by ID' })
  @ApiResponse({
    status: 200,
    description: 'Exercise log retrieved successfully',
    type: ExerciseLogResponseDto,
  })
  async getExerciseLogById(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ExerciseLogResponseDto> {
    return this.exerciseLogService.getExerciseLogById(userId, id);
  }

  @Patch(':id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an exercise log' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    description: 'Updated exercise log data (all fields optional)',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE'],
          description: 'Type of exercise',
          example: 'STRENGTH',
        },
        name: {
          type: 'string',
          description: 'Name of the exercise',
          example: 'Push-ups',
        },
        intensity: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          description: 'Intensity level',
          example: 'HIGH',
        },
        duration: {
          type: 'integer',
          description: 'Duration in minutes',
          example: 45,
        },
        note: {
          type: 'string',
          description: 'Additional notes',
          example: 'Evening workout',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise log updated successfully',
    type: ExerciseLogResponseDto,
  })
  async updateExerciseLog(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExerciseLogDto,
  ): Promise<ExerciseLogResponseDto> {
    return this.exerciseLogService.updateExerciseLog(userId, id, dto);
  }

  @Delete(':id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an exercise log' })
  @ApiResponse({
    status: 200,
    description: 'Exercise log deleted successfully',
  })
  async deleteExerciseLog(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.exerciseLogService.deleteExerciseLog(userId, id);
  }

  // Exercise Schedule Endpoints
  @Post('schedule')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new exercise schedule' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    description: 'Exercise schedule data for creation',
    schema: {
      type: 'object',
      required: ['type', 'name', 'scheduledAt'],
      properties: {
        type: {
          type: 'string',
          enum: ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE'],
          description: 'Type of exercise',
          example: 'CARDIO',
        },
        name: {
          type: 'string',
          description: 'Name of the exercise',
          example: 'Running',
        },
        intensity: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          description: 'Intensity level',
          example: 'MEDIUM',
        },
        duration: {
          type: 'integer',
          description: 'Duration in minutes',
          example: 30,
        },
        note: {
          type: 'string',
          description: 'Additional notes',
          example: 'Morning run',
        },
        scheduledAt: {
          type: 'string',
          format: 'date-time',
          description: 'Scheduled time (ISO 8601)',
          example: '2026-02-15T08:00:00Z',
        },
        isTaken: {
          type: 'boolean',
          description: 'Whether the exercise was done',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Exercise schedule created successfully',
    type: ExerciseScheduleDetailResponseDto,
  })
  async createExerciseSchedule(
    @GetUser('id') userId: string,
    @Body() dto: CreateExerciseScheduleDto,
  ): Promise<ExerciseScheduleDetailResponseDto> {
    return this.exerciseLogService.createExerciseSchedule(userId, dto);
  }

  @Get('scheduled/history')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get exercise schedule history with total count' })
  @ApiResponse({
    status: 200,
    description: 'Exercise schedule history retrieved successfully',
    type: ExerciseScheduleHistoryDto,
  })
  async getExerciseScheduleHistory(
    @GetUser('id') userId: string,
  ): Promise<ExerciseScheduleHistoryDto> {
    return this.exerciseLogService.getExerciseScheduleHistory(userId);
  }

  @Get('scheduled/:id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific exercise schedule by ID' })
  @ApiResponse({
    status: 200,
    description: 'Exercise schedule retrieved successfully',
    type: ExerciseScheduleDetailResponseDto,
  })
  async getExerciseScheduleById(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ExerciseScheduleDetailResponseDto> {
    return this.exerciseLogService.getExerciseScheduleById(userId, id);
  }

  @Patch('scheduled/:id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an exercise schedule' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    description: 'Updated exercise schedule data (all fields optional)',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE'],
          description: 'Type of exercise',
          example: 'STRENGTH',
        },
        name: {
          type: 'string',
          description: 'Name of the exercise',
          example: 'Push-ups',
        },
        intensity: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          description: 'Intensity level',
          example: 'HIGH',
        },
        duration: {
          type: 'integer',
          description: 'Duration in minutes',
          example: 45,
        },
        note: {
          type: 'string',
          description: 'Additional notes',
          example: 'Evening workout',
        },
        scheduledAt: {
          type: 'string',
          format: 'date-time',
          description: 'Scheduled time (ISO 8601)',
          example: '2026-02-15T08:00:00Z',
        },
        isTaken: {
          type: 'boolean',
          description: 'Whether the exercise was done',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise schedule updated successfully',
    type: ExerciseScheduleDetailResponseDto,
  })
  async updateExerciseSchedule(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExerciseScheduleDto,
  ): Promise<ExerciseScheduleDetailResponseDto> {
    const normalizedIsTaken = this.normalizeBooleanInput(dto.isTaken as unknown);
    const updatedDto = {
      ...dto,
      ...(normalizedIsTaken !== undefined && { isTaken: normalizedIsTaken }),
    } as UpdateExerciseScheduleDto;
    return this.exerciseLogService.updateExerciseSchedule(userId, id, updatedDto);
  }

  @Delete('scheduled/:id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an exercise schedule' })
  @ApiResponse({
    status: 200,
    description: 'Exercise schedule deleted successfully',
  })
  async deleteExerciseSchedule(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.exerciseLogService.deleteExerciseSchedule(userId, id);
  }
}
