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
import { MealLogService } from './meal-log.service';
import { CreateMealLogDto } from './dto/create-meal-log.dto';
import { UpdateMealLogDto } from './dto/update-meal-log.dto';
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
    MealLogResponseDto,
    MealLogHistoryDto,
} from './dto/meal-log-response.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Meal Log')
@Controller('meal-log')
export class MealLogController {
    constructor(private readonly mealLogService: MealLogService) { }

    @Post()
    @ValidAll()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Log a meal entry (calories auto-calculated)' })
    @ApiResponse({
        status: 201,
        description: 'Meal logged successfully',
        type: MealLogResponseDto,
    })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(AnyFilesInterceptor())
    @ApiBody({
        description: 'Meal log entry data — provide carbs, protein, fats and calories will be auto-calculated',
        schema: {
            type: 'object',
            required: ['mealType', 'carbs', 'protein', 'fats'],
            properties: {
                mealType: {
                    type: 'string',
                    enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'],
                    description: 'Type of meal',
                    example: 'BREAKFAST',
                },
                description: {
                    type: 'string',
                    description: 'Meal description',
                    example: 'Oatmeal with banana',
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
                // loggedAt: {
                //     type: 'string',
                //     format: 'date-time',
                //     description: 'Log timestamp (ISO 8601)',
                //     example: '2026-02-14T10:30:00Z',
                // },
            },
        },
    })
    async createMealLog(
        @GetUser('id') userId: string,
        @Body() dto: CreateMealLogDto,
    ): Promise<MealLogResponseDto> {
        return this.mealLogService.createMealLog(userId, dto);
    }

    @Get('history')
    @ValidAll()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get meal log history with daily nutrition summary' })
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
        description: 'Meal log history with daily need, consumed, and remaining macros',
        type: MealLogHistoryDto,
    })
    async getMealLogHistory(
        @GetUser('id') userId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ): Promise<MealLogHistoryDto> {
        const parsedLimit = limit ? parseInt(limit, 10) : 30;
        const parsedOffset = offset ? parseInt(offset, 10) : 0;
        return this.mealLogService.getMealLogHistory(
            userId,
            parsedLimit,
            parsedOffset,
        );
    }

    @Get('latest')
    @ValidAll()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get latest meal log' })
    @ApiResponse({
        status: 200,
        description: 'Latest meal log',
        type: MealLogResponseDto,
    })
    async getLatestMealLog(
        @GetUser('id') userId: string,
    ): Promise<MealLogResponseDto | null> {
        return this.mealLogService.getLatestMealLog(userId);
    }

    @Patch(':id')
    @ValidAll()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update meal log by ID (calories auto-recalculated)' })
    @ApiParam({
        name: 'id',
        description: 'Meal log ID',
        type: String,
    })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(AnyFilesInterceptor())
    @ApiBody({

        description: 'Updated meal log data (all fields optional, calories auto-recalculated) but if you want to change carb, protein or fats, you must provide carb,protein and fats data other wise all 0 update. if you want to update spesific one data so you can change only you spesific data and give me ohter filed old data',
        schema: {
            type: 'object',
            properties: {
                mealType: {
                    type: 'string',
                    enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'],
                    description: 'Type of meal',
                    example: 'LUNCH',
                },
                description: {
                    type: 'string',
                    description: 'Meal description',
                    example: 'Grilled chicken salad',
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
                loggedAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Log timestamp (ISO 8601)',
                    example: '2026-02-14T12:00:00Z',
                },
            },
            required: [],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Meal log updated successfully',
        type: MealLogResponseDto,
    })
    async updateMealLog(
        @GetUser('id') userId: string,
        @Param('id') logId: string,
        @Body() dto: UpdateMealLogDto,
    ): Promise<MealLogResponseDto> {

        console.log("controller value", dto);

        return this.mealLogService.updateMealLog(userId, logId, dto);
    }

    @Delete(':id')
    @ValidAll()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete meal log' })
    @ApiParam({
        name: 'id',
        description: 'Meal log ID',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Meal log deleted successfully',
    })
    async deleteMealLog(
        @GetUser('id') userId: string,
        @Param('id') logId: string,
    ): Promise<{ message: string }> {
        await this.mealLogService.deleteMealLog(userId, logId);
        return { message: 'Meal log deleted successfully' };
    }
}
