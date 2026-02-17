import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async updateOnboardingStatus(userId: string, updateOnboardingDto: any) {
    try {
      // Build update object with only provided fields
      const updateData: any = {};

      // Update fitnessGoal only if provided and not empty
      if (
        updateOnboardingDto.fitnessGoal !== undefined &&
        updateOnboardingDto.fitnessGoal !== null
      ) {
        // Only update if it's not an empty string
        if (updateOnboardingDto.fitnessGoal.trim() !== '') {
          updateData.fitnessGoal = updateOnboardingDto.fitnessGoal;
        }
      }

      if (updateOnboardingDto.iscomplete == '') {
        const findOnboarding = await this.prisma.client.onboarding.findUnique({
          where: { userId },
        });
        updateOnboardingDto.iscomplete = findOnboarding?.iscomplete;
      }

      if (updateOnboardingDto.iscomplete == 'false') {
        updateOnboardingDto.iscomplete = false;
      }
      updateData.iscomplete = Boolean(updateOnboardingDto.iscomplete);

      // If no fields provided, return current state and iscomplete status update getting value
      if (Object.keys(updateData).length === 0) {
        const result = await this.prisma.client.onboarding.findUnique({
          where: { userId },
        });
        return {
          success: true,
          message: 'No changes provided',
          data: result,
        };
      }
      // udpate iscomplete and fitnessGoal if provided, otherwise keep existing values
      //user isOnboarding complete true instaace
      const userUpdateOnboarding = await this.prisma.client.user.update({
        where: { id: userId },
        data: {
          onBoarded: updateData.iscomplete === true ? true : undefined,
        },
      });
      //profile isOnboarding complete true instaace
      const profileUpdateOnboarding =
        await this.prisma.client.userProfile.updateMany({
          where: { userId },
          data: {
            onBoardingCompleted:
              updateData.iscomplete === true ? true : undefined,
          },
        });

      const result = await this.prisma.client.onboarding.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          ...updateData,
        },
      });

      return {
        success: true,
        message: 'Onboarding status updated successfully',
        data: result,
      };
    } catch (error) {
      console.error('Error updating onboarding status:', error);
      throw new BadRequestException(
        'Failed to update onboarding status: ' + error.message,
      );
    }
  }

  async getOnboardingStatus(userId: string) {
    try {
      const result = await this.prisma.client.onboarding.findUnique({
        where: { userId },
      });

      return {
        success: true,
        message: 'Onboarding status retrieved successfully',
        data: result,
      };
    } catch (error) {
      console.error('Error retrieving onboarding status:', error);
      throw new BadRequestException(
        'Failed to retrieve onboarding status: ' + error.message,
      );
    }
  }

  async unlockThemeOnboarding(userId: string, themeId: string) {
    try {
      // Check if onboarding is complete
      const onboarding = await this.prisma.client.onboarding.findUnique({
        where: { userId },
      });

      if (onboarding?.iscomplete) {
        throw new BadRequestException(
          'Cannot unlock theme after onboarding is complete',
        );
      }

      // Check if user exists
      const user = await this.prisma.client.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if theme exists
      const theme = await this.prisma.client.theme.findUnique({
        where: { id: themeId },
      });

      if (!theme) {
        throw new NotFoundException('Theme not found');
      }

      // Check if theme is already unlocked
      const existingTheme = await this.prisma.client.userTheme.findUnique({
        where: {
          userId_themeId: {
            userId,
            themeId,
          },
        },
      });

      if (existingTheme && existingTheme.isActive) {
        throw new BadRequestException('Theme already unlocked and active');
      }

      // Deactivate and lock all other themes for this user
      await this.prisma.client.userTheme.deleteMany({
        where: { userId },
      });

      // Unlock and activate the selected theme
      const userTheme = await this.prisma.client.userTheme.upsert({
        where: {
          userId_themeId: {
            userId,
            themeId,
          },
        },
        update: { isActive: true },
        create: {
          userId,
          themeId,
          isActive: true,
        },
      });

      return {
        success: true,
        message: 'Theme unlocked and activated successfully during onboarding',
        data: userTheme,
      };
    } catch (error) {
      console.error('Error unlocking theme during onboarding:', error);
      throw error instanceof BadRequestException ||
        error instanceof NotFoundException
        ? error
        : new BadRequestException('Failed to unlock theme: ' + error.message);
    }
  }

  async unlockCompanionOnboarding(userId: string, companionId: string) {
    try {
      // Check if onboarding is complete
      const onboarding = await this.prisma.client.onboarding.findUnique({
        where: { userId },
      });

      if (onboarding?.iscomplete) {
        throw new BadRequestException(
          'Cannot unlock companion after onboarding is complete',
        );
      }

      // Check if user exists
      const user = await this.prisma.client.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if companion exists
      const companion = await this.prisma.client.companion.findUnique({
        where: { id: companionId },
      });

      if (!companion) {
        throw new NotFoundException('Companion not found');
      }

      // Check if companion is already unlocked
      const existingCompanion =
        await this.prisma.client.userCompanion.findUnique({
          where: {
            userId_companionId: {
              userId,
              companionId,
            },
          },
        });

      if (existingCompanion && existingCompanion.isActive) {
        throw new BadRequestException('Companion already unlocked and active');
      }

      // delete all other companions for this user
      await this.prisma.client.userCompanion.deleteMany({
        where: { userId },
      });
      // Unlock and activate the selected companion
      const userCompanion = await this.prisma.client.userCompanion.upsert({
        where: {
          userId_companionId: {
            userId,
            companionId,
          },
        },
        update: { isActive: true },
        create: {
          userId,
          companionId,
          isActive: true,
        },
      });

      return {
        success: true,
        message:
          'Companion unlocked and activated successfully during onboarding',
        data: userCompanion,
      };
    } catch (error) {
      console.error('Error unlocking companion during onboarding:', error);
      throw error instanceof BadRequestException ||
        error instanceof NotFoundException
        ? error
        : new BadRequestException(
            'Failed to unlock companion: ' + error.message,
          );
    }
  }
}
