import { PrismaService } from '@/lib/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { calculateLevel } from './levelCalculator';

@Injectable()
export class LeveladdService {
  constructor(private prisma: PrismaService) {}

  async addXpToUser(userId: string, xpAmount: number, source: string = 'MANUAL') {
    try {
      // First, update the XP values
      await this.prisma.client.userProfile.update({
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

      // Create XP log entry
      await this.prisma.client.xpLog.create({
        data: {
          userId,
          amount: xpAmount,
          source,
        },
      });

      const userProfile = await this.prisma.client.userProfile.findUnique({
        where: { userId },
      });

      // Calculate the new level based on updated totalEarnXp
      const level = await calculateLevel(userProfile?.totalEarnXp || 0);

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
