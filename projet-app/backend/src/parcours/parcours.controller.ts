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
import { ParcoursService } from './parcours.service';

@Controller('parcours')
export class ParcoursController {
  constructor(private readonly parcoursService: ParcoursService) {}

  @Get()
  findAll(@Query('formation') formation?: string) {
    if (formation) {
      return this.parcoursService.findByFormation(formation);
    }
    return this.parcoursService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() data: any) {
    return this.parcoursService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() data: any) {
    return this.parcoursService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.parcoursService.remove(+id);
  }
}
