import { Controller, Get, Query, Param } from '@nestjs/common';
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
    return this.questionsService.findQuestions(type, formation);
  }

  @Get('positionnement')
  findByLevel(
    @Query('formation') formation: string,
    @Query('niveau') niveau: string,
  ) {
    return this.questionsService.findByLevel(formation, niveau);
  }
}
