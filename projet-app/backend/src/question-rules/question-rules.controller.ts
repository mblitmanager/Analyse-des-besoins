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
import { QuestionRulesService } from './question-rules.service';
import { CreateQuestionRuleDto } from './dto/create-question-rule.dto';
import { UpdateQuestionRuleDto } from './dto/update-question-rule.dto';

@Controller('question-rules')
export class QuestionRulesController {
  constructor(private readonly questionRulesService: QuestionRulesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createQuestionRuleDto: CreateQuestionRuleDto) {
    return this.questionRulesService.create(createQuestionRuleDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.questionRulesService.findAll();
  }

  @Get('evaluate')
  findByWorkflow(
    @Query('workflow') workflow: string,
    @Query('formation') formation?: string,
  ) {
    return this.questionRulesService.findByWorkflow(workflow, formation);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.questionRulesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateQuestionRuleDto: UpdateQuestionRuleDto,
  ) {
    return this.questionRulesService.update(id, updateQuestionRuleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.questionRulesService.remove(id);
  }
}
