import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import {
  CreateMedicationDto,
  UpdateMedicationDto,
} from './dto/create-medication.dto';
import {
  MedicationResponseDto,
  MedicationHistoryWithStatsDto,
} from './dto/medication-response.dto';

@Injectable()
export class MedicationService {
  constructor(private prisma: PrismaService) {}

  async createMedication(
    userId: string,
    dto: CreateMedicationDto,
  ): Promise<MedicationResponseDto> {
    const medication = await this.prisma.client.medication.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        doseMg: dto.doseMg,
      },
    });

    return {
      ...medication,
      type: medication.type ?? undefined,
      doseMg: medication.doseMg ?? undefined,
    };
  }

  async getMedicationHistory(
    userId: string,
  ): Promise<MedicationHistoryWithStatsDto> {
    const medications = await this.prisma.client.medication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const totalCount = medications.length;

    return {
      totalCount,
      medications: medications.map((med) => ({
        ...med,
        type: med.type ?? undefined,
        doseMg: med.doseMg ?? undefined,
      })),
    };
  }

  async getMedicationById(
    userId: string,
    id: string,
  ): Promise<MedicationResponseDto> {
    const medication = await this.prisma.client.medication.findFirst({
      where: { id, userId },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    return {
      ...medication,
      type: medication.type ?? undefined,
      doseMg: medication.doseMg ?? undefined,
    };
  }

  async updateMedication(
    userId: string,
    id: string,
    dto: UpdateMedicationDto,
  ): Promise<MedicationResponseDto> {
    // Check if medication exists and belongs to user
    const existingMedication = await this.prisma.client.medication.findFirst({
      where: { id, userId },
    });

    if (!existingMedication) {
      throw new NotFoundException('Medication not found');
    }

    const medication = await this.prisma.client.medication.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        doseMg: dto.doseMg,
      },
    });

    return {
      ...medication,
      type: medication.type ?? undefined,
      doseMg: medication.doseMg ?? undefined,
    };
  }

  async deleteMedication(
    userId: string,
    id: string,
  ): Promise<{ message: string }> {
    // Check if medication exists and belongs to user
    const medication = await this.prisma.client.medication.findFirst({
      where: { id, userId },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    await this.prisma.client.medication.delete({
      where: { id },
    });

    return { message: 'Medication deleted successfully' };
  }
}
