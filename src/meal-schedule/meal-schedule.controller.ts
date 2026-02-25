import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { MealScheduleService } from './meal-schedule.service';
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
import { ValidAll, ValidUser } from '../common/decorators/validate.decorator';
import {
  MealScheduleResponseDto,
  MealScheduleHistoryDto,
} from './dto/meal-schedule-response.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Meal Schedule')
@Controller('meal-schedule')
export class MealScheduleController {
  constructor(private readonly mealScheduleService: MealScheduleService) { }

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
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Create a meal schedule (calories auto-calculated)',
  })
  @ApiResponse({
    status: 201,
    description: 'Meal schedule created successfully',
    type: MealScheduleResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    description:
      'Meal schedule data — provide carbs, protein, fats and calories will be auto-calculated',
    schema: {
      type: 'object',
      required: ['mealType', 'scheduledAt', 'carbs', 'protein', 'fats'],
      properties: {
        mealType: {
          type: 'string',
          enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'],
          description: 'Type of meal',
          example: 'BREAKFAST',
        },
        scheduledAt: {
          type: 'string',
          format: 'date-time',
          description: 'Scheduled time (ISO 8601)',
          example: '2026-02-14T08:00:00Z',
        },
        carbs: {
          type: 'integer',
          description: 'Carbohydrates in grams',
          example: 50,
        },
        protein: {
          type: 'integer',
          description: 'Protein in grams',
          example: 30,
        },
        fats: {
          type: 'integer',
          description: 'Fats in grams',
          example: 15,
        },
      },
    },
  })
  async createMealSchedule(
    @GetUser('id') userId: string,
    @Body() dto: any,
  ): Promise<MealScheduleResponseDto> {
    return this.mealScheduleService.createMealSchedule(userId, dto);
  }

  //update only isTaken with api true false collect from Query swagger
  @Patch(':id/taken')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Mark meal schedule as taken' })
  @ApiQuery({
    name: 'isTaken',
    required: true,
    type: Boolean,
    description: 'Whether the meal was taken',
    example: true,
  })
  async markMealAsTaken(
    @GetUser('id') userId: string,
    @Param('id') scheduleId: string,
    @Query('isTaken') isTaken: boolean,
  ): Promise<any> {
    return this.mealScheduleService.markMealAsTaken(userId, scheduleId, isTaken);
  }



  @Get('history')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: "Get meal schedule history with today's summary" })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of schedules to fetch',
    example: 30,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of schedules to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: "Meal schedule history with today's nutrition summary",
    type: MealScheduleHistoryDto,
  })
  async getMealScheduleHistory(
    @GetUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<MealScheduleHistoryDto> {
    const parsedLimit = limit ? parseInt(limit, 10) : 30;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    return this.mealScheduleService.getMealScheduleHistory(
      userId,
      parsedLimit,
      parsedOffset,
    );
  }

  @Get('latest')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Get latest meal schedule' })
  @ApiResponse({
    status: 200,
    description: 'Latest meal schedule',
    type: MealScheduleResponseDto,
  })
  async getLatestMealSchedule(
    @GetUser('id') userId: string,
  ): Promise<MealScheduleResponseDto | null> {
    return this.mealScheduleService.getLatestMealSchedule(userId);
  }

  @Patch(':id')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Update meal schedule by ID (calories auto-recalculated)',
  })
  @ApiParam({
    name: 'id',
    description: 'Meal schedule ID',
    type: String,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    description:
      'Updated meal schedule data (all fields optional, calories auto-recalculated)',
    schema: {
      type: 'object',
      properties: {
        mealType: {
          type: 'string',
          enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'],
          description: 'Type of meal',
          example: 'LUNCH',
        },
        scheduledAt: {
          type: 'string',
          format: 'date-time',
          description: 'Scheduled time (ISO 8601)',
          example: '2026-02-14T12:00:00Z',
        },
        carbs: {
          type: 'integer',
          description: 'Carbohydrates in grams',
          example: 40,
        },
        protein: {
          type: 'integer',
          description: 'Protein in grams',
          example: 45,
        },
        fats: {
          type: 'integer',
          description: 'Fats in grams',
          example: 10,
        },
        isTaken: {
          type: 'boolean',
          description: 'Whether the meal was taken',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Meal schedule updated successfully',
    type: MealScheduleResponseDto,
  })
  async updateMealSchedule(
    @GetUser('id') userId: string,
    @Param('id') scheduleId: string,
    @Body() dto: any,
  ): Promise<MealScheduleResponseDto> {
    const normalizedIsTaken = this.normalizeBooleanInput(dto?.isTaken);
    const updatedDto = {
      ...dto,
      ...(normalizedIsTaken !== undefined && { isTaken: normalizedIsTaken }),
    };
    return this.mealScheduleService.updateMealSchedule(
      userId,
      scheduleId,
      updatedDto,
    );
  }

  @Delete(':id')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Delete meal schedule' })
  @ApiParam({
    name: 'id',
    description: 'Meal schedule ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Meal schedule deleted successfully',
  })
  async deleteMealSchedule(
    @GetUser('id') userId: string,
    @Param('id') scheduleId: string,
  ): Promise<{ message: string }> {
    await this.mealScheduleService.deleteMealSchedule(userId, scheduleId);
    return { message: 'Meal schedule deleted successfully' };
  }
}
