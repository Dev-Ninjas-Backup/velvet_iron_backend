import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';

@Injectable()
export class ThemeService {
  constructor(private prisma: PrismaService) {}

  async create(createThemeDto: CreateThemeDto) {
    const existingTheme = await this.prisma.client.theme.findUnique({
      where: { name: createThemeDto.name },
    });

    if (existingTheme) {
      throw new BadRequestException('Theme with this name already exists');
    }

    return this.prisma.client.theme.create({
      data: createThemeDto,
    });
  }

  async findAll() {
    return this.prisma.client.theme.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const theme = await this.prisma.client.theme.findUnique({
      where: { id },
    });

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    return theme;
  }

  async update(id: string, updateThemeDto: UpdateThemeDto) {
    const theme = await this.findOne(id);

    if (updateThemeDto.name && updateThemeDto.name !== theme.name) {
      const existingTheme = await this.prisma.client.theme.findUnique({
        where: { name: updateThemeDto.name },
      });

      if (existingTheme) {
        throw new BadRequestException('Theme with this name already exists');
      }
    }

    return this.prisma.client.theme.update({
      where: { id },
      data: updateThemeDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.theme.delete({
      where: { id },
    });
  }

  // User unlocks a theme
  async unlockTheme(userId: string, themeId: string) {
    const theme = await this.findOne(themeId);

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
    if (userProfile.xp < theme.unlockXp) {
      throw new BadRequestException('Not enough XP to unlock this theme');
    }

    // Check if already unlocked
    const existingUnlock = await this.prisma.client.userTheme.findUnique({
      where: {
        userId_themeId: {
          userId,
          themeId,
        },
      },
    });

    if (existingUnlock) {
      throw new BadRequestException('Theme already unlocked');
    }

    // Unlock the theme
    return this.prisma.client.userTheme.create({
      data: {
        userId,
        themeId,
      },
      include: {
        theme: true,
      },
    });
  }

  // Set a theme as active
  async setActiveTheme(userId: string, themeId: string) {
    // Check if user has unlocked this theme
    const userTheme = await this.prisma.client.userTheme.findUnique({
      where: {
        userId_themeId: {
          userId,
          themeId,
        },
      },
    });

    if (!userTheme) {
      throw new BadRequestException(
        'Theme not unlocked. Please unlock it first.',
      );
    }

    // Deactivate all other themes for this user
    await this.prisma.client.userTheme.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Activate this theme
    await this.prisma.client.userTheme.update({
      where: {
        userId_themeId: {
          userId,
          themeId,
        },
      },
      data: { isActive: true },
    });

    // Update user profile
    await this.prisma.client.userProfile.update({
      where: { userId },
      data: { activeThemeId: themeId },
    });

    return { message: 'Theme activated successfully' };
  }

  // Get user's unlocked themes
  async getUserThemes(userId: string) {
    return this.prisma.client.userTheme.findMany({
      where: { userId },
      include: {
        theme: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });
  }
}
