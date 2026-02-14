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
import { MedicationService } from './medication.service';
import {
  CreateMedicationDto,
  UpdateMedicationDto,
} from './dto/create-medication.dto';
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
  MedicationResponseDto,
  MedicationHistoryWithStatsDto,
} from './dto/medication-response.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { MedicationType } from '../../prisma/generated/enums';

@ApiTags('Medication')
@Controller('medication')
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  @Post()
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new medication' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    description: 'Medication data for creation',
    schema: {
      type: 'object',
      required: ['name'],
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
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Medication created successfully',
    type: MedicationResponseDto,
  })
  async createMedication(
    @GetUser('id') userId: string,
    @Body() dto: CreateMedicationDto,
  ): Promise<MedicationResponseDto> {
    return this.medicationService.createMedication(userId, dto);
  }

  @Get('history')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get medication history with total count' })
  @ApiResponse({
    status: 200,
    description: 'Medication history with total count retrieved successfully',
    type: MedicationHistoryWithStatsDto,
  })
  async getMedicationHistory(
    @GetUser('id') userId: string,
  ): Promise<MedicationHistoryWithStatsDto> {
    return this.medicationService.getMedicationHistory(userId);
  }

  @Get(':id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific medication by ID' })
  @ApiResponse({
    status: 200,
    description: 'Medication retrieved successfully',
    type: MedicationResponseDto,
  })
  async getMedicationById(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<MedicationResponseDto> {
    return this.medicationService.getMedicationById(userId, id);
  }

  @Patch(':id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a medication' })
  @ApiResponse({
    status: 200,
    description: 'Medication updated successfully',
    type: MedicationResponseDto,
  })
  async updateMedication(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMedicationDto,
  ): Promise<MedicationResponseDto> {
    return this.medicationService.updateMedication(userId, id, dto);
  }

  @Delete(':id')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a medication' })
  @ApiResponse({
    status: 200,
    description: 'Medication deleted successfully',
  })
  async deleteMedication(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.medicationService.deleteMedication(userId, id);
  }
}
