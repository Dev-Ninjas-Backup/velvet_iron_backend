import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MacroGoalService } from './macro-goal.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidUser } from '../common/decorators/validate.decorator';

@ApiTags('Nutrition Goals')
@Controller('nutrition/goals')
export class NutritionGoalController {
  constructor(private readonly macroGoalService: MacroGoalService) {}

  @Get()
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Get current nutrition and independent calorie targets directly' })
  @ApiResponse({
    status: 200,
    description: 'Current nutrition goals retrieved successfully',
  })
  async getNutritionGoals(@GetUser('id') userId: string) {
    return this.macroGoalService.getNutritionGoals(userId);
  }
}
