import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FormationsService } from './formations.service';

@Controller('formations')
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Get()
  findAll() {
    return this.formationsService.findAll();
  }

  @Get(':slug/levels')
  findLevelsBySlug(@Param('slug') slug: string) {
    return this.formationsService.findLevelsBySlug(slug);
  }

  @Post()
  create(@Body() data: any) {
    return this.formationsService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.formationsService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formationsService.remove(+id);
  }
}
