import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import {
  availableThemesForLevel,
  calculateLevel,
} from '@/leveladd/levelCalculator';

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
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: { userProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const unlockedThemes = await this.prisma.client.userTheme.findMany({
      where: { userId },
    });
    const length = unlockedThemes.length;
    const level = calculateLevel(user?.userProfile?.totalEarnXp || 0);

    const availableThemes = availableThemesForLevel(level, length);
    console.log('amio pelam', availableThemes);

    if (availableThemes) {
      const existingUnlock = await this.prisma.client.userTheme.findFirst({
        where: {
          userId,
          themeId,
        },
      });
      if (existingUnlock) {
        throw new BadRequestException('Theme already unlocked');
      }

      if (
        user?.userProfile?.balanceXp === undefined ||
        user?.userProfile?.balanceXp === null
      ) {
        throw new BadRequestException(
          'User profile XP data is missing first create a user profile by unlocking a theme with XP',
        );
      }

      const themeUnlockXp: any = await this.prisma.client.theme.findUnique({
        where: { id: themeId },
        select: { unlockXp: true },
      });

      if (
        user?.userProfile?.balanceXp < 0 ||
        user?.userProfile?.balanceXp < themeUnlockXp?.unlockXp
      ) {
        throw new BadRequestException('Not enough XP to unlock this theme');
      }
      const currentBalanceUpdateXp =
        await this.prisma.client.userProfile.update({
          where: { userId },
          data: {
            balanceXp: {
              decrement: themeUnlockXp?.unlockXp,
            },
          },
        });
      const unlockedThemeResult = await this.prisma.client.userTheme.create({
        data: {
          userId,
          themeId,
        },
        include: {
          theme: true,
        },
      });

      return {
        message: 'Theme unlocked successfully',
        unlockedTheme: unlockedThemeResult,
        updatedBalanceXp: currentBalanceUpdateXp.balanceXp,
      };
    }

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

     // Check if user has enough XP
    if (userProfile.balanceXp < theme.unlockXp) {
      throw new BadRequestException('Not enough XP to unlock this theme');
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
  async getMyThemes(userId: string) {
    try {
      const user = await this.prisma.client.user.findUnique({
        where: { id: userId },
        include: { userProfile: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
      const themes = await this.prisma.client.theme.findMany();

      // if (!user?.userProfile?.onBoardingCompleted) {
      //   return themePayload;
      // }

      const level = calculateLevel(user?.userProfile?.totalEarnXp || 0);
      const unlockedThemes = await this.prisma.client.userTheme.findMany({
        where: { userId },
      });
      // const activeTheme = await this.prisma.client.userTheme.findFirst({
      //   where: { userId, isActive: true },
      //   include: { theme: true },
      // });
      const length = unlockedThemes.length;
      // const availableThemes = availableThemesForLevel(level, length);
      const availableForUnlock =
        (level > 30
          ? 4
          : level > 20
            ? 3
            : level > 10
              ? 2
              : level >= 1
                ? 1
                : 0) -
          length <
        0
          ? 0
          : (level > 30
              ? 4
              : level > 20
                ? 3
                : level > 10
                  ? 2
                  : level >= 1
                    ? 1
                    : 0) - length;

      //  themeData = {
      // isactive: Boolean (already built in unlockedThemes)
      //   unlocaked: Boolean
      //   ...themes
      // }

      let themesWithUnlockStatus = themes.map((theme) => {
        const isUnlocked = unlockedThemes.some((ut) => ut.themeId === theme.id);
        const isAcitve = unlockedThemes.some(
          (ut) => ut.themeId === theme.id && ut.isActive,
        );
        return {
          ...theme,
          isAcitve,
          isUnlocked,
        };
      });

      return {
        themes: themesWithUnlockStatus,
        Unlockable: availableForUnlock,
        level,
        unlockedThemes: length,
      };
    } catch (error) {
      throw new NotFoundException('my themes error ' + error.message);
    }
  }
}
