import { PrismaService } from '@/lib/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { calculateLevel } from './levelCalculator';

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
      const level =await calculateLevel(updateResult.totalEarnXp);

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
