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
import { Question } from '../entities/question.entity';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('prerequisites')
  findPrerequisites(
    @Query('formation') formation?: string,
    @Query('scope') scope?: 'auto' | 'global' | 'formation',
  ) {
    return this.questionsService.findPrerequisites(formation, scope || 'auto');
  }

  @Get('workflow/:type')
  findWorkflowQuestions(
    @Param('type')
    type: 'prerequis' | 'positionnement' | 'complementary' | 'availabilities',
    @Query('formation') formation?: string,
    @Query('scope') scope?: 'auto' | 'global' | 'formation',
  ) {
    return this.questionsService.findQuestions(
      type,
      formation,
      scope || 'auto',
    );
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
  create(
    @Body()
    data: Partial<Question> & { formationId?: number; levelId?: number },
  ) {
    return this.questionsService.create(data);
  }

  @Patch('order')
  @UseGuards(JwtAuthGuard)
  updateOrder(@Body() orders: { id: number; order: number }[]) {
    return this.questionsService.updateOrder(orders);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: number,
    @Body()
    data: Partial<Question> & { formationId?: number; levelId?: number },
  ) {
    return this.questionsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: number) {
    return this.questionsService.remove(id);
  }
}
