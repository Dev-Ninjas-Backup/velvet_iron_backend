import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async updateOnboardingStatus(userId: string, iscomplete: boolean) {
    try {
      const result = await this.prisma.client.onboarding.upsert({
        where: { userId },
        update: { iscomplete },
        create: {
          userId,
          iscomplete,
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
}
