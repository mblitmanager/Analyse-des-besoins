import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { P3FilterRulesService } from './p3-filter-rules.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('p3-filter-rules')
@Controller('p3-filter-rules')
export class P3FilterRulesController {
  constructor(private readonly service: P3FilterRulesService) {}

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    if (activeOnly === 'true') {
      return this.service.findActive();
    }
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
