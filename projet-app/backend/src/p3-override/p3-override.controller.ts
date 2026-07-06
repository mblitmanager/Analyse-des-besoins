import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { P3OverrideService } from './p3-override.service';

@Controller('p3-override')
export class P3OverrideController {
  constructor(private readonly p3OverrideService: P3OverrideService) {}

  @Get()
  findAll(@Query('formation') formation?: string, @Query('activeOnly') activeOnly?: string) {
    const onlyActive = activeOnly === 'true' || activeOnly === '1';
    if (formation) {
      return this.p3OverrideService.findByFormation(formation, onlyActive);
    }
    return this.p3OverrideService.findAll(onlyActive);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() data: any) {
    return this.p3OverrideService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() data: any) {
    return this.p3OverrideService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.p3OverrideService.remove(+id);
  }
}
