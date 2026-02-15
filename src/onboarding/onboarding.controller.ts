import { Controller, Patch, Get, Query, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { ValidUser } from '@/common/decorators/validate.decorator';

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Patch()
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Update onboarding completion status' })
  @ApiQuery({
    name: 'iscomplete',
    required: true,
    type: Boolean,
    description:
      'Set to true if onboarding is complete, false to mark incomplete',
    example: true,
  })
  updateOnboarding(@Query('iscomplete') iscomplete: boolean, @Req() req: any) {
    return this.onboardingService.updateOnboardingStatus(
      req.user.id,
      iscomplete,
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
}
