import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':key')
  update(@Param('key') key: string, @Body('value') value: string) {
    return this.settingsService.update(key, value);
  }
}
