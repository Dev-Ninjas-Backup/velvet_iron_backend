import {
  Controller,
  Patch,
  Get,
  Query,
  Req,
  Post,
  Param,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { ValidUser } from '@/common/decorators/validate.decorator';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Patch()
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'Update onboarding status and fitness goal',
    description:
      'Update onboarding completion status and fitness goal. Both fields are optional and can be null or empty.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        iscomplete: {
          type: 'boolean',
          description:
            'Set to true if onboarding is complete, false to mark incomplete',
          example: false,
        },
        fitnessGoal: {
          type: 'string', 
          nullable: true,
          description:
            'Fitness goal of the user (optional, can be null or empty)',
          example: 'Weight Loss',
        },
      },
    },
  })
  updateOnboarding(
    @Body() updateOnboardingDto: any,
    @Req() req: any,
  ) {
    console.log(updateOnboardingDto);
    
    return this.onboardingService.updateOnboardingStatus(
      req.user.id,
      updateOnboardingDto,
    );
  }

  @Get()
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Get onboarding status' })
  getOnboardingStatus(@Req() req: any) {
    return this.onboardingService.getOnboardingStatus(req.user.id);
  }

  @Post('theme/:themeId')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Unlock and activate theme during onboarding',
    description:
      'Unlocks and activates a theme during onboarding. Only available when onboarding is incomplete (iscomplete: false). Deactivates all other themes.',
  })
  unlockThemeOnboarding(@Param('themeId') themeId: string, @Req() req: any) {
    return this.onboardingService.unlockThemeOnboarding(req.user.id, themeId);
  }

  @Post('companion/:companionId')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Unlock and activate companion during onboarding',
    description:
      'Unlocks and activates a companion during onboarding. Only available when onboarding is incomplete (iscomplete: false). Deactivates all other companions.',
  })
  unlockCompanionOnboarding(
    @Param('companionId') companionId: string,
    @Req() req: any,
  ) {
    return this.onboardingService.unlockCompanionOnboarding(
      req.user.id,
      companionId,
    );
  }
}
