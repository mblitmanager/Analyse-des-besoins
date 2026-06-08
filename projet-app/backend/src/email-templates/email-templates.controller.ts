import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailTemplatesService } from './email-templates.service';

@ApiTags('email-templates')
@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private readonly service: EmailTemplatesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post('preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  preview(@Body() body: { htmlContent: string; variables: Record<string, string> }) {
    const rendered = this.service.renderTemplate(body.htmlContent, body.variables || {});
    return { html: rendered };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
