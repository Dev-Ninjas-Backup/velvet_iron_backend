import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AddXpDto } from './dto/add-xp.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidAll } from '../common/decorators/validate.decorator';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my profile with XP and level' })
  getMyProfile(@GetUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Post('add-xp')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add XP to my profile (for testing)' })
  addXp(@GetUser('id') userId: string, @Body() addXpDto: AddXpDto) {
    return this.profileService.addXp(userId, addXpDto.xp);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get XP leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLeaderboard(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.profileService.getLeaderboard(limit || 10);
  }
}
