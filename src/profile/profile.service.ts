import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { LeveladdService } from '@/leveladd/leveladd.service';
import { calculateLevel } from '@/leveladd/levelCalculator';
import { fitnessGoalDTO } from './dto/fitnessGoal.dto';
import { levelStatus } from '@/leveladd/levelStatus';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private leveladdService: LeveladdService,
  ) { }

  async getProfile(userId: string) {
    let profile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            userProfile: {
              select: {
                balanceXp: true,
              }
            },
            name: true,
          },
        },
      },
    });

    let level = calculateLevel(profile?.totalEarnXp || 0);

    if (!profile) {
      // Create profile if it doesn't exist
      profile = await this.prisma.client.userProfile.create({
        data: { userId },
        include: {

          user: {
            select: {
              userProfile: {
                select: {
                  balanceXp: true,
                }
              },
              name: true,
            },
          },
        },
      });
    }
    console.log(profile);

    const activeTheme = await this.prisma.client.userTheme.findFirst({
      where: { userId, isActive: true },
      select: {
        theme: true,
      },

    });
    const activecomponion = await this.prisma.client.userCompanion.findFirst({
      where: { userId, isActive: true },
      select: {
        companion: true,
      },
    });

    let finalProfile = {
      ...profile,
      userName: profile?.user?.name || null,
      level,
      activeTheme,
      activecomponion,
      levelStatus: levelStatus(level),
      // if level 50 or above, show then next level is max and xp required is 0
      nextLevel:{
        level: level >= 50 ? 50 : level + 1,
        xpRequired: level >= 50 ? 0 : (level + 1) * 150 + 400,
      }
    };

    return finalProfile;
  }

  async updateFitnessGoal(
    userId: string,
    updateFitnessGoalDto: fitnessGoalDTO,
  ) {
    let profile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    profile = await this.prisma.client.userProfile.update({
      where: { userId },
      data: { fitnessGoal: updateFitnessGoalDto.goal }
    });

    return profile;
  }

  async addXp(userId: string, xpAmount: number) {
    try {
      let profile = await this.prisma.client.userProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        profile = await this.prisma.client.userProfile.create({
          data: { userId, level: 1, totalEarnXp: 0, balanceXp: 0 },
        });
      }

      const addXP = await this.leveladdService.addXpToUser(userId, xpAmount);

      return { message: 'XP added successfully', ...addXP };
    } catch (error) {
      console.log(error);

      error.message = 'Failed to add XP: ' + error.message;
      throw error;
    }
  }

  // Simple level calculation: Level = floor((totalEarnXp - 400) / 150) + 1
  private calculateLevel(totalEarnXp: number): number {
    return Math.floor((totalEarnXp - 400) / 150) + 1;
  }

  async getLeaderboard(limit: number = 10) {
    return this.prisma.client.userProfile.findMany({
      take: limit,
      orderBy: {
        totalEarnXp: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }
}
