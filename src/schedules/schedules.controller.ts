import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import {
  ScheduleItemDto,
  CreateScheduleResponseDto,
  ScheduleListResponseDto,
} from './dto/schedule-response.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidUser } from '../common/decorators/validate.decorator';

@ApiTags('Schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Create a new recurring schedule (workout, medication, etc.)' })
  @ApiResponse({
    status: 201,
    description: 'Schedule created successfully',
    type: CreateScheduleResponseDto,
  })
  async create(
    @GetUser('id') userId: string,
    @Body() dto: CreateScheduleDto,
  ): Promise<CreateScheduleResponseDto> {
    return this.schedulesService.create(userId, dto);
  }

  @Get()
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Get schedules, automatically expanding recurring items for the given date' })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Target date to expand recurring schedule items (YYYY-MM-DD)',
    example: '2026-09-24',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedules retrieved and expanded successfully',
    type: ScheduleListResponseDto,
  })
  async findAll(
    @GetUser('id') userId: string,
    @Query('date') date?: string,
  ): Promise<ScheduleListResponseDto> {
    return this.schedulesService.findAll(userId, date);
  }

  @Get(':id')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Get a single schedule item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Schedule item retrieved successfully',
    type: ScheduleItemDto,
  })
  async findOne(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ScheduleItemDto> {
    return this.schedulesService.findOne(userId, id);
  }

  @Patch(':id')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Update schedule item fields or toggle isPaused status' })
  @ApiResponse({
    status: 200,
    description: 'Schedule item updated successfully',
    type: ScheduleItemDto,
  })
  async update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ): Promise<ScheduleItemDto> {
    return this.schedulesService.update(userId, id, dto);
  }

  @Delete(':id')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Delete or remove a recurring schedule item' })
  @ApiResponse({
    status: 200,
    description: 'Schedule item removed successfully',
  })
  async remove(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.schedulesService.remove(userId, id);
  }
}
