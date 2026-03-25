import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiParam,
    ApiBody,
} from '@nestjs/swagger';
import { MacroGoalService } from './macro-goal.service';
import { CreateMacroGoalDto } from './dto/create-macro-goal.dto';
import { UpdateMacroGoalDto } from './dto/update-macro-goal.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidAll, ValidUser } from '../common/decorators/validate.decorator';

@ApiTags('Macro Goal')
@Controller('macro-goal')
@ApiBearerAuth()
export class MacroGoalController {
    constructor(private readonly macroGoalService: MacroGoalService) { }

    @Post()
    @ValidUser()
    @ApiBearerAuth('JWT-auth')
    @ApiBearerAuth('refresh-token')
    @ApiOperation({ summary: 'Create a new macro goal (calories auto-calculated)' })
    @ApiResponse({
        status: 201,
        description: 'Macro goal created successfully',
    })
    @ApiBody({
        description: 'Macro goal data — calories will be auto-calculated from carbs, fat, and protein',
        schema: {
            type: 'object',
            required: ['carbs', 'fat', 'protein'],
            properties: {
                name: {
                    type: 'string',
                    description: 'Name of the macro goal (optional)',
                    example: 'Bulking Goal',
                },
                carbs: {
                    type: 'number',
                    description: 'Carbohydrates in grams',
                    example: 300,
                },
                fat: {
                    type: 'number',
                    description: 'Fat in grams',
                    example: 80,
                },
                protein: {
                    type: 'number',
                    description: 'Protein in grams',
                    example: 150,
                },
            },
        },
    })
    async createMacroGoal(
        @GetUser() user: any,
        @Body() dto: CreateMacroGoalDto,
    ) {
        const macroGoal = await this.macroGoalService.createMacroGoal(user.id, dto);
        return {
            statusCode: 201,
            message: 'Macro goal created successfully',
            data: macroGoal,
        };
    }

    @Get()
    @ValidUser()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all macro goals for the user' })
    @ApiResponse({
        status: 200,
        description: 'List of macro goals',
    })
    async getAllMacroGoals(@GetUser() user: any) {
        console.log(user);

        const macroGoals = await this.macroGoalService.getAllMacroGoals(user.id);
        return {
            statusCode: 200,
            message: 'Macro goals retrieved successfully',
            data: macroGoals,
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific macro goal by ID' })
    @ApiParam({
        name: 'id',
        description: 'Macro goal ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Macro goal details',
    })
    async getMacroGoalById(@GetUser() user: any, @Param('id') id: string) {
        const macroGoal = await this.macroGoalService.getMacroGoalById(user.id, id);
        return {
            statusCode: 200,
            message: 'Macro goal retrieved successfully',
            data: macroGoal,
        };
    }

    @Patch(':id')
    @ValidUser()
    @ApiBearerAuth('JWT-auth')
    @ApiBearerAuth('refresh-token')
    @ApiOperation({ summary: 'Update a macro goal (calories auto-calculated)' })
    @ApiParam({
        name: 'id',
        description: 'Macro goal ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Macro goal updated successfully',
    })
    @ApiBody({
        description: 'Updated macro goal data — calories will be auto-recalculated if macros are changed',
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Name of the macro goal',
                    example: 'Updated Goal',
                },
                carbs: {
                    type: 'number',
                    description: 'Carbohydrates in grams',
                    example: 320,
                },
                fat: {
                    type: 'number',
                    description: 'Fat in grams',
                    example: 85,
                },
                protein: {
                    type: 'number',
                    description: 'Protein in grams',
                    example: 160,
                },
            },
        },
    })
    async updateMacroGoal(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() dto: UpdateMacroGoalDto,
    ) {
        const macroGoal = await this.macroGoalService.updateMacroGoal(user.id, id, dto);
        return {
            statusCode: 200,
            message: 'Macro goal updated successfully',
            data: macroGoal,
        };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a macro goal' })
    @ApiParam({
        name: 'id',
        description: 'Macro goal ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Macro goal deleted successfully',
    })
    async deleteMacroGoal(@GetUser() user: any, @Param('id') id: string) {
        const result = await this.macroGoalService.deleteMacroGoal(user.id, id);
        return {
            statusCode: 200,
            message: result.message,
            data: { id: result.id },
        };
    }
}
