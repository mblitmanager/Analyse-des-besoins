import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('prerequisites')
  findPrerequisites(@Query('formation') formation?: string) {
    return this.questionsService.findPrerequisites(formation);
  }

  @Get('workflow/:type')
  findWorkflowQuestions(
    @Param('type') type: string,
    @Query('formation') formation?: string,
  ) {
    return this.questionsService.findQuestions(type as any, formation);
  }

  @Get('positionnement')
  findByLevel(
    @Query('formation') formation: string,
    @Query('niveau') niveau: string,
  ) {
    return this.questionsService.findByLevel(formation, niveau);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('formation') formationSlug?: string) {
    if (formationSlug) {
      // Return specific formation + globals to admin
      return this.questionsService.findAll(formationSlug);
    }
    return this.questionsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() data: any) {
    return this.questionsService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: number, @Body() data: any) {
    return this.questionsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: number) {
    return this.questionsService.remove(id);
  }
}
