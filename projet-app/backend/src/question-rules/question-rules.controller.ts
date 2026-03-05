import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { QuestionRulesService } from './question-rules.service';
import { CreateQuestionRuleDto } from './dto/create-question-rule.dto';
import { UpdateQuestionRuleDto } from './dto/update-question-rule.dto';

@Controller('question-rules')
export class QuestionRulesController {
  constructor(private readonly questionRulesService: QuestionRulesService) {}

  @Post()
  create(@Body() createQuestionRuleDto: CreateQuestionRuleDto) {
    return this.questionRulesService.create(createQuestionRuleDto);
  }

  @Get()
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
  findOne(@Param('id') id: string) {
    return this.questionRulesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestionRuleDto: UpdateQuestionRuleDto,
  ) {
    return this.questionRulesService.update(id, updateQuestionRuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionRulesService.remove(id);
  }
}
