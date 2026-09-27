import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FormationsService } from './formations.service';

@Controller('formations')
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    const isClientContext = activeOnly === 'true';
    return this.formationsService.findAll(isClientContext);
  }

  @Get(':slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.formationsService.findBySlug(slug);
  }

  @Get(':slug/levels')
  findLevelsBySlug(@Param('slug') slug: string) {
    return this.formationsService.findLevelsBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() data: any) {
    return this.formationsService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() data: any) {
    return this.formationsService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.formationsService.remove(+id);
  }
}
