import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CompanionService } from './companion.service';
import { CreateCompanionDto } from './dto/create-companion.dto';
import { UpdateCompanionDto } from './dto/update-companion.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidAll, ValidAdmin } from '../common/decorators/validate.decorator';

@ApiTags('Companions')
@Controller('companions')
export class CompanionController {
  constructor(private readonly companionService: CompanionService) {}

  // @Post()
  // @ValidAdmin()
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Create a new companion (Admin only)' })
  // create(@Body() createCompanionDto: CreateCompanionDto) {
  //   return this.companionService.create(createCompanionDto);
  // }

  // @Get()
  // @ApiOperation({ summary: 'Get all companions' })
  // findAll() {
  //   return this.companionService.findAll();
  // }

  @Get('my-companions')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my unlocked companions' })
  getMyCompanions(@GetUser('id') userId: string) {
    return this.companionService.getUserCompanions(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a companion by ID' })
  findOne(@Param('id') id: string) {
    return this.companionService.findOne(id);
  }

  // @Patch(':id')
  // @ValidAdmin()
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Update a companion (Admin only)' })
  // update(
  //   @Param('id') id: string,
  //   @Body() updateCompanionDto: UpdateCompanionDto,
  // ) {
  //   return this.companionService.update(id, updateCompanionDto);
  // }

  // @Delete(':id')
  // @ValidAdmin()
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Delete a companion (Admin only)' })
  // remove(@Param('id') id: string) {
  //   return this.companionService.remove(id);
  // }

  @Post(':id/unlock')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlock a companion with XP' })
  unlockCompanion(
    @Param('id') companionId: string,
    @GetUser('id') userId: string,
  ) {
    return this.companionService.unlockCompanion(userId, companionId);
  }

  @Post(':id/activate')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set a companion as active' })
  setActiveCompanion(
    @Param('id') companionId: string,
    @GetUser('id') userId: string,
  ) {
    return this.companionService.setActiveCompanion(userId, companionId);
  }
}
