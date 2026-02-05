import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateCompanionDto } from './dto/create-companion.dto';
import { UpdateCompanionDto } from './dto/update-companion.dto';

@Injectable()
export class CompanionService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanionDto: CreateCompanionDto) {
    return this.prisma.client.companion.create({
      data: createCompanionDto,
    });
  }

  async findAll() {
    return this.prisma.client.companion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const companion = await this.prisma.client.companion.findUnique({
      where: { id },
    });

    if (!companion) {
      throw new NotFoundException('Companion not found');
    }

    return companion;
  }

  async update(id: string, updateCompanionDto: UpdateCompanionDto) {
    await this.findOne(id);
    return this.prisma.client.companion.update({
      where: { id },
      data: updateCompanionDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.companion.delete({
      where: { id },
    });
  }

  // User unlocks a companion
  async unlockCompanion(userId: string, companionId: string) {
    const companion = await this.findOne(companionId);

    // Check if user has a profile
    let userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      // Create profile if it doesn't exist
      userProfile = await this.prisma.client.userProfile.create({
        data: { userId },
      });
    }

    // Check if user has enough XP
    // if (userProfile.xp < companion.unlockXp) {
    //   throw new BadRequestException('Not enough XP to unlock this companion');
    // }

    // Check if already unlocked
    const existingUnlock = await this.prisma.client.userCompanion.findUnique({
      where: {
        userId_companionId: {
          userId,
          companionId,
        },
      },
    });

    if (existingUnlock) {
      throw new BadRequestException('Companion already unlocked');
    }

    // Unlock the companion
    return this.prisma.client.userCompanion.create({
      data: {
        userId,
        companionId,
      },
      include: {
        companion: true,
      },
    });
  }

  // Set a companion as active
  async setActiveCompanion(userId: string, companionId: string) {
    // Check if user has unlocked this companion
    const userCompanion = await this.prisma.client.userCompanion.findUnique({
      where: {
        userId_companionId: {
          userId,
          companionId,
        },
      },
    });

    if (!userCompanion) {
      throw new BadRequestException(
        'Companion not unlocked. Please unlock it first.',
      );
    }

    // Deactivate all other companions for this user
    await this.prisma.client.userCompanion.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Activate this companion
    await this.prisma.client.userCompanion.update({
      where: {
        userId_companionId: {
          userId,
          companionId,
        },
      },
      data: { isActive: true },
    });

    // Update user profile
    await this.prisma.client.userProfile.update({
      where: { userId },
      data: { activeCompanionId: companionId },
    });

    return { message: 'Companion activated successfully' };
  }

  // Get user's unlocked companions
  async getUserCompanions(userId: string) {
    return this.prisma.client.userCompanion.findMany({
      where: { userId },
      include: {
        companion: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });
  }
}
