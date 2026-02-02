import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ThemeService } from './theme.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidAll, ValidAdmin } from '../common/decorators/validate.decorator';

@ApiTags('Themes')
@Controller('themes')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Post()
  @ValidAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new theme (Admin only)' })
  create(@Body() createThemeDto: CreateThemeDto) {
    return this.themeService.create(createThemeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all themes' })
  findAll() {
    return this.themeService.findAll();
  }

  @Get('my-themes')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my unlocked themes' })
  getMyThemes(@GetUser('id') userId: string) {
    return this.themeService.getUserThemes(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a theme by ID' })
  findOne(@Param('id') id: string) {
    return this.themeService.findOne(id);
  }

  @Patch(':id')
  @ValidAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a theme (Admin only)' })
  update(@Param('id') id: string, @Body() updateThemeDto: UpdateThemeDto) {
    return this.themeService.update(id, updateThemeDto);
  }

  @Delete(':id')
  @ValidAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a theme (Admin only)' })
  remove(@Param('id') id: string) {
    return this.themeService.remove(id);
  }

  @Post(':id/unlock')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlock a theme with XP' })
  unlockTheme(@Param('id') themeId: string, @GetUser('id') userId: string) {
    return this.themeService.unlockTheme(userId, themeId);
  }

  @Post(':id/activate')
  @ValidAll()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set a theme as active' })
  setActiveTheme(@Param('id') themeId: string, @GetUser('id') userId: string) {
    return this.themeService.setActiveTheme(userId, themeId);
  }
}
