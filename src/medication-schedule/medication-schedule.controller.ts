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
import { MedicationScheduleService } from './medication-schedule.service';
import {
  CreateMedicationScheduleDto,
  UpdateMedicationScheduleDto,
} from './dto/create-medication-schedule.dto';
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
  MedicationScheduleResponseDto,
  MedicationScheduleHistoryWithStatsDto,
  TodaySchedulesDto,
} from './dto/medication-schedule-response.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { MedicationType } from '../../prisma/generated/enums';

@ApiTags('Medication Schedule')
@Controller('medication-schedule')
export class MedicationScheduleController {
  constructor(
    private readonly medicationScheduleService: MedicationScheduleService,
  ) { }

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
  @ApiOperation({ summary: 'Create a new medication schedule' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    description: 'Medication schedule data for creation',
    schema: {
      type: 'object',
      required: ['name', 'scheduleTime'],
      properties: {
        name: {
          type: 'string',
          description: 'Name of the medication',
          example: 'Aspirin',
        },
        type: {
          type: 'string',
          enum: Object.values(MedicationType),
          description: 'Type of medication',
          example: MedicationType.TABLET,
        },
        doseMg: {
          type: 'integer',
          description: 'Dose in mg',
          example: 500,
        },
        scheduleTime: {
          type: 'string',
          format: 'date-time',
          description: 'Scheduled time (ISO 8601)',
          example: '2026-02-15T08:00:00Z',
        },

      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Medication schedule created successfully',
    type: MedicationScheduleResponseDto,
  })
  async createMedicationSchedule(
    @GetUser('id') userId: string,
    @Body() dto: CreateMedicationScheduleDto,
  ): Promise<MedicationScheduleResponseDto> {
    return this.medicationScheduleService.createMedicationSchedule(userId, dto);
  }


  //


  @Get('history')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get medication schedule history with total count (dose logs)',
  })
  @ApiResponse({
    status: 200,
    description: 'Medication schedule history retrieved successfully',
    type: MedicationScheduleHistoryWithStatsDto,
  })
  async getMedicationScheduleHistory(
    @GetUser('id') userId: string,
  ): Promise<MedicationScheduleHistoryWithStatsDto> {
    return this.medicationScheduleService.getMedicationScheduleHistory(userId);
  }

  @Get('today')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get today medication schedules' })
  @ApiResponse({
    status: 200,
    description: 'Today medication schedules retrieved successfully',
    type: TodaySchedulesDto,
  })
  async getTodaySchedules(
    @GetUser('id') userId: string,
  ): Promise<TodaySchedulesDto> {
    return this.medicationScheduleService.getTodaySchedules(userId);
  }

  @Get(':id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific medication schedule by ID' })
  @ApiResponse({
    status: 200,
    description: 'Medication schedule retrieved successfully',
    type: MedicationScheduleResponseDto,
  })
  async getMedicationScheduleById(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<MedicationScheduleResponseDto> {
    return this.medicationScheduleService.getMedicationScheduleById(userId, id);
  }

  @Patch(':id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a medication schedule' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    description: 'Updated medication schedule data (all fields optional)',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the medication',
          example: 'Aspirin',
        },
        type: {
          type: 'string',
          enum: Object.values(MedicationType),
          description: 'Type of medication',
          example: MedicationType.TABLET,
        },
        doseMg: {
          type: 'integer',
          description: 'Dose in mg',
          example: 500,
        },
        scheduleTime: {
          type: 'string',
          format: 'date-time',
          description: 'Scheduled time (ISO 8601)',
          example: '2026-02-15T08:00:00Z',
        },
        isTaken: {
          type: 'boolean',
          description: 'Whether the medication was taken',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Medication schedule updated successfully',
    type: MedicationScheduleResponseDto,
  })
  async updateMedicationSchedule(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMedicationScheduleDto,
  ): Promise<MedicationScheduleResponseDto> {
    const normalizedIsTaken = this.normalizeBooleanInput(dto.isTaken as unknown);
    const updatedDto = {
      ...dto,
      ...(normalizedIsTaken !== undefined && { isTaken: normalizedIsTaken }),
    } as UpdateMedicationScheduleDto;

    return this.medicationScheduleService.updateMedicationSchedule(
      userId,
      id,
      updatedDto,
    );
  }

  @Delete(':id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a medication schedule' })
  @ApiResponse({
    status: 200,
    description: 'Medication schedule deleted successfully',
  })
  async deleteMedicationSchedule(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.medicationScheduleService.deleteMedicationSchedule(userId, id);
  }
}
