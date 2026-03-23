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
    @Param('type') type: string,
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

  @Patch('bulk')
  @UseGuards(JwtAuthGuard)
  bulkUpdate(@Body() body: { ids: number[]; data: Partial<Question> }) {
    return this.questionsService.bulkUpdate(body.ids, body.data);
  }

  @Delete('bulk')
  @UseGuards(JwtAuthGuard)
  bulkRemove(@Body() body: { ids: number[] }) {
    return this.questionsService.bulkRemove(body.ids);
  }

  @Post('duplicate')
  @UseGuards(JwtAuthGuard)
  duplicate(
    @Body()
    body: {
      ids: number[];
      targetFormationId: number | null;
      targetLevelId: number | null;
    },
  ) {
    return this.questionsService.duplicate(
      body.ids,
      body.targetFormationId,
      body.targetLevelId,
    );
  }

  @Get(':id/is-used')
  @UseGuards(JwtAuthGuard)
  getIsUsed(@Param('id') id: number) {
    return this.questionsService.getIsUsed(id);
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
