import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CustomQuestService } from './custom-quest.service';
import { CreateCustomQuestDto } from './dto/create-custom-quest.dto';
import {
  UpdateCustomQuestDto,
  PauseCustomQuestDto,
} from './dto/update-custom-quest.dto';
import {
  CustomQuestResponseDto,
  CustomQuestCreateResponseDto,
  CustomQuestListResponseDto,
  CompleteCustomQuestResponseDto,
} from './dto/custom-quest-response.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidUser } from '../common/decorators/validate.decorator';

@ApiTags('Custom Quests')
@Controller('quests/custom')
export class CustomQuestController {
  constructor(private readonly customQuestService: CustomQuestService) {}

  @Post()
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Create a new custom quest (capped at 15 XP)' })
  @ApiResponse({
    status: 201,
    description: 'Custom quest created successfully',
    type: CustomQuestCreateResponseDto,
  })
  async create(
    @GetUser('id') userId: string,
    @Body() dto: CreateCustomQuestDto,
  ): Promise<CustomQuestCreateResponseDto> {
    return this.customQuestService.create(userId, dto);
  }

  @Get()
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: "Fetch user's custom quests for requested date" })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Target date (YYYY-MM-DD)',
    example: '2026-09-24',
  })
  @ApiResponse({
    status: 200,
    description: 'List of custom quests retrieved successfully',
    type: CustomQuestListResponseDto,
  })
  async findAll(
    @GetUser('id') userId: string,
    @Query('date') date?: string,
  ): Promise<CustomQuestListResponseDto> {
    return this.customQuestService.findAll(userId, date);
  }

  @Get(':id')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Get a single custom quest by ID' })
  @ApiResponse({
    status: 200,
    description: 'Custom quest retrieved successfully',
    type: CustomQuestResponseDto,
  })
  async findOne(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<CustomQuestResponseDto> {
    return this.customQuestService.findOne(userId, id);
  }

  @Patch(':id/pause')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Pause or resume custom quest' })
  @ApiResponse({
    status: 200,
    description: 'Custom quest pause status toggled successfully',
  })
  async pause(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: PauseCustomQuestDto,
  ): Promise<{ success: boolean; isPaused: boolean }> {
    return this.customQuestService.pause(userId, id, dto.isPaused);
  }

  @Post(':id/complete')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Mark a custom quest as complete and award XP (subject to daily 50 XP cap)' })
  @ApiResponse({
    status: 200,
    description: 'Custom quest completed successfully',
    type: CompleteCustomQuestResponseDto,
  })
  async complete(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<CompleteCustomQuestResponseDto> {
    return this.customQuestService.complete(userId, id);
  }

  // Dual-support: Keep PATCH /quests/custom/:id/complete for existing frontend builds
  @Patch(':id/complete')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Legacy alias: Complete a custom quest and award capped XP' })
  @ApiResponse({
    status: 200,
    description: 'Custom quest completed successfully',
    type: CompleteCustomQuestResponseDto,
  })
  async completePatch(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<CompleteCustomQuestResponseDto> {
    return this.customQuestService.complete(userId, id);
  }

  @Patch(':id')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Edit custom quest fields' })
  @ApiResponse({
    status: 200,
    description: 'Custom quest updated successfully',
    type: CustomQuestResponseDto,
  })
  async update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomQuestDto,
  ): Promise<CustomQuestResponseDto> {
    return this.customQuestService.update(userId, id, dto);
  }

  @Delete(':id')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Delete a custom quest' })
  @ApiResponse({
    status: 200,
    description: 'Custom quest deleted successfully',
  })
  async remove(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.customQuestService.remove(userId, id);
  }
}
