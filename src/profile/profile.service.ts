import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    let profile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
      include: {
        activeTheme: true,
        activeCompanion: true,
      },
    });

    if (!profile) {
      // Create profile if it doesn't exist
      profile = await this.prisma.client.userProfile.create({
        data: { userId },
        include: {
          activeTheme: true,
          activeCompanion: true,
        },
      });
    }

    return profile;
  }

  async addXp(userId: string, xpAmount: number) {
    let profile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.client.userProfile.create({
        data: { userId, xp: 0, level: 1 },
      });
    }

    const newXp = profile.xp + xpAmount;
    const newLevel = this.calculateLevel(newXp);

    return this.prisma.client.userProfile.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel,
      },
    });
  }

  // Simple level calculation: Level = floor(XP / 1000) + 1
  private calculateLevel(xp: number): number {
    return Math.floor(xp / 1000) + 1;
  }

  async getLeaderboard(limit: number = 10) {
    return this.prisma.client.userProfile.findMany({
      take: limit,
      orderBy: {
        xp: 'desc',
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
