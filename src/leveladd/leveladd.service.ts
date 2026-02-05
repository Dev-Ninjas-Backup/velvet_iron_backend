import { PrismaService } from '@/lib/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LeveladdService {
  constructor(private prisma: PrismaService) {}

  async addXpToUser(userId: string, xpAmount: number) {
    try {
      // First, update the XP values
      const updateResult = await this.prisma.client.userProfile.update({
        where: { userId },
        data: {
          balanceXp: {
            increment: xpAmount,
          },
          totalEarnXp: {
            increment: xpAmount,
          },
        },
      });

      // Calculate the new level based on updated totalEarnXp
      const level =
        Math.floor((Number(updateResult.totalEarnXp) - 400) / 150) + 1 >= 50
          ? 50
          : Math.floor((Number(updateResult.totalEarnXp) - 400) / 150) + 1 < 1
            ? 1
            : Math.floor((Number(updateResult.totalEarnXp) - 400) / 150) + 1;

      // Update the level
      const updateLevel = await this.prisma.client.userProfile.update({
        where: { userId },
        data: {
          level,
        },
      });

      return {
        profile: updateLevel,
      };
    } catch (error) {
      throw new Error('Error updating XP and level: ' + error.message);
    }
  }
}
