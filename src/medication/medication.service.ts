import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import {
  CreateMedicationDto,
  UpdateMedicationDto,
} from './dto/create-medication.dto';
import {
  MedicationResponseDto,
  MedicationHistoryWithStatsDto,
  MedicationHistoryLogDto,
} from './dto/medication-response.dto';

@Injectable()
export class MedicationService {
  constructor(private prisma: PrismaService) { }

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
    const [medications, schedules] = await Promise.all([
      this.prisma.client.medication.findMany({ where: { userId } }),
      this.prisma.client.medicationSchedule.findMany({ where: { userId } }),
    ]);

    const logs: MedicationHistoryLogDto[] = [
      ...medications.map((med) => ({
        id: med.id,
        userId: med.userId,
        name: med.name,
        type: med.type ?? undefined,
        doseMg: med.doseMg ?? undefined,
        isTaken: med.isTaken ?? false,
        loggedAt: med.createdAt,
        scheduledAt: null,
        entryType: 'LOG' as const,
      })),
      ...schedules.map((schedule) => ({
        id: schedule.id,
        userId: schedule.userId,
        name: schedule.name,
        type: schedule.type ?? undefined,
        doseMg: schedule.doseMg ?? undefined,
        isTaken: schedule.isTaken ?? false,
        loggedAt: schedule.scheduleTime,
        scheduledAt: schedule.scheduleTime,
        entryType: 'SCHEDULE' as const,
      })),
    ];

    logs.sort((a, b) => {
      if (a.isTaken !== b.isTaken) {
        return a.isTaken ? 1 : -1;
      }

      const dateA = a.loggedAt ?? a.scheduledAt ?? new Date(0);
      const dateB = b.loggedAt ?? b.scheduledAt ?? new Date(0);

      return dateB.getTime() - dateA.getTime();
    });

    const pendingCount = logs.filter((log) => !log.isTaken).length;

    return {
      totalCount: logs.length,
      pendingCount,
      logs,
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
