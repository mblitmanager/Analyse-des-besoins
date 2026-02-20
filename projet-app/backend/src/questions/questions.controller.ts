import { Controller, Get, Query } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('prerequisites')
  findPrerequisites() {
    return this.questionsService.findPrerequisites();
  }

  @Get('positionnement')
  findByLevel(
    @Query('formation') formation: string,
    @Query('niveau') niveau: string,
  ) {
    return this.questionsService.findByLevel(formation, niveau);
  }
}
