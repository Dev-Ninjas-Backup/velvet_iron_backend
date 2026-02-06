import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateCompanionDto } from './dto/create-companion.dto';
import { UpdateCompanionDto } from './dto/update-companion.dto';
import {
  availableCompanionForLevel,
  calculateLevel,
} from '@/leveladd/levelCalculator';

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
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: { userProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const unlockedCompanions = await this.prisma.client.userCompanion.findMany({
      where: { userId },
    });
    const length = unlockedCompanions.length;
    const level = calculateLevel(user?.userProfile?.totalEarnXp || 0);

    const availableCompanions = availableCompanionForLevel(level, length);

    if (availableCompanions) {
      const existingUnlock = await this.prisma.client.userCompanion.findFirst({
        where: {
          userId,
          companionId,
        },
      });
      if (existingUnlock) {
        throw new BadRequestException('Companion already unlocked');
      }

      if (
        user?.userProfile?.balanceXp === undefined ||
        user?.userProfile?.balanceXp === null
      ) {
        throw new BadRequestException(
          'User profile XP data is missing first create a user profile by unlocking a theme with XP',
        );
      }

      const companionUnlockXp: any =
        await this.prisma.client.companion.findUnique({
          where: { id: companionId },
          select: { unlockXp: true },
        });

      if (
        user?.userProfile?.balanceXp < 0 ||
        user?.userProfile?.balanceXp < companionUnlockXp?.unlockXp
      ) {
        throw new BadRequestException('Not enough XP to unlock this companion');
      }
      const currentBalanceUpdateXp =
        await this.prisma.client.userProfile.update({
          where: { userId },
          data: {
            balanceXp: {
              decrement: companionUnlockXp?.unlockXp,
            },
          },
        });
      const unlockedCompanionResult =
        await this.prisma.client.userCompanion.create({
          data: {
            userId,
            companionId,
          },
          include: {
            companion: true,
          },
        });

      return {
        message: 'Companion unlocked successfully',
        unlockedCompanion: unlockedCompanionResult,
        updatedBalanceXp: currentBalanceUpdateXp.balanceXp,
      };

      // const companion = await this.findOne(companionId);

      // // Check if user has a profile
      // let userProfile = await this.prisma.client.userProfile.findUnique({
      //   where: { userId },
      // });

      // if (!userProfile) {
      //   // Create profile if it doesn't exist
      //   userProfile = await this.prisma.client.userProfile.create({
      //     data: { userId },
      //   });
      // }

      // // Check if user has enough XP
      // // if (userProfile.xp < companion.unlockXp) {
      // //   throw new BadRequestException('Not enough XP to unlock this companion');
      // // }

      // // Check if already unlocked
      // const existingUnlock = await this.prisma.client.userCompanion.findUnique({
      //   where: {
      //     userId_companionId: {
      //       userId,
      //       companionId,
      //     },
      //   },
      // });

      // if (existingUnlock) {
      //   throw new BadRequestException('Companion already unlocked');
      // }

      // // Unlock the companion
      // return this.prisma.client.userCompanion.create({
      //   data: {
      //     userId,
      //     companionId,
      //   },
      //   include: {
      //     companion: true,
      //   },
      // });
    }

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

     // Check if user has enough XP
    if (userProfile.balanceXp < companion.unlockXp) {
      throw new BadRequestException('Not enough XP to unlock this companion');
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
    try {
      const user = await this.prisma.client.user.findUnique({
        where: { id: userId },
        include: { userProfile: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
      const companions = await this.prisma.client.companion.findMany();
      const level = calculateLevel(user?.userProfile?.totalEarnXp || 0);
      const unlockedCompanions =
        await this.prisma.client.userCompanion.findMany({
          where: { userId },
        });

      const length = unlockedCompanions.length;
      const availableCompanionForUnlock =
        (level >= 32
          ? 4
          : level >= 22
            ? 3
            : level >= 12
              ? 2
              : level < 10
                ? 1
                : 0) -
          length <
        0
          ? 0
          : (level >= 32
              ? 4
              : level >= 22
                ? 3
                : level >= 12
                  ? 2
                  : level < 10
                    ? 1
                    : 0) - length;

      let companionsWithUnlockStatus = companions.map((companion) => {
        const isUnlocked = unlockedCompanions.some(
          (uc) => uc.companionId === companion.id,
        );
        const isAcitve = unlockedCompanions.some(
          (uc) => uc.companionId === companion.id && uc.isActive,
        );
        return {
          ...companion,
          isAcitve,
          isUnlocked,
        };
      }); 

      return {
        companions: companionsWithUnlockStatus,
        Unlockable: availableCompanionForUnlock,
        level,
        unlockedCompanions: length,
      };
    } catch (error) {
      throw new NotFoundException('my companions error ' + error.message);
    }
  }
}
