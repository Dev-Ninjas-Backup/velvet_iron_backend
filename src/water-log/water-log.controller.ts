import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WaterLogService } from './water-log.service';
import { LogWaterDto, UpdateWaterGoalDto } from './dto/water-log.dto';
import { WaterTodayResponseDto } from './dto/water-today-response.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidUser } from '../common/decorators/validate.decorator';
import { extractTimezone } from '../common/utils/timezone.util';

@ApiTags('Water Log')
@Controller('water-log')
export class WaterLogController {
  constructor(private readonly waterLogService: WaterLogService) {}

  @Post()
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Log water intake (Quick-add or custom amount)' })
  @ApiResponse({
    status: 201,
    description: 'Water intake logged successfully',
  })
  async logWater(
    @GetUser('id') userId: string,
    @Body() dto: LogWaterDto,
  ) {
    return this.waterLogService.logWater(userId, dto);
  }

  @Get('today')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Get today water intake vs goal with potion flask visual state',
  })
  @ApiQuery({ name: 'date', required: false, type: String, example: '2026-10-14' })
  @ApiResponse({
    status: 200,
    description: 'Today water intake with potion flask fill level',
    type: WaterTodayResponseDto,
  })
  async getTodayWater(
    @GetUser('id') userId: string,
    @Req() req: any,
    @Query('date') dateStr?: string,
  ): Promise<WaterTodayResponseDto> {
    const tz = extractTimezone(req);
    return this.waterLogService.getTodayWater(userId, tz, dateStr);
  }

  @Put('goal')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Update user daily water goal and preferred unit (OZ or ML)' })
  @ApiResponse({
    status: 200,
    description: 'Daily water goal updated successfully',
  })
  async updateWaterGoal(
    @GetUser('id') userId: string,
    @Body() dto: UpdateWaterGoalDto,
  ) {
    return this.waterLogService.updateWaterGoal(userId, dto);
  }

  @Delete(':id')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Delete a water log entry' })
  @ApiResponse({
    status: 200,
    description: 'Water log deleted successfully',
  })
  async deleteWaterLog(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.waterLogService.deleteWaterLog(userId, id);
  }
}

