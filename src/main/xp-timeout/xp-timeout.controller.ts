import { Controller, Get } from '@nestjs/common';
import { XpTimeoutService } from './xp-timeout.service';
import { ValidateUser } from '@/common/decorators/validate.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('xp-timeout')
export class XpTimeoutController {
  constructor(private readonly xpTimeoutService: XpTimeoutService) {}

  @ApiOperation({ summary: 'Check if user can use XP timeout' })
  @ValidateUser()
  @ApiBearerAuth()
  @Get()
  async getXpTimeout(@GetUser('id') userId: string) {
    return this.xpTimeoutService.getXpTimeout(userId);
  }

  //-------- readstory xp timeout --------
  @ApiOperation({ summary: 'Check if user can use readstory XP timeout' })
  @ValidateUser()
  @ApiBearerAuth()
  @Get('/readstory')
  async getReadstoryXpTimeout(@GetUser('id') userId: string) {
    return this.xpTimeoutService.getXpTimeout(userId);
  }

}
