import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionRulesService } from './question-rules.service';
import { QuestionRulesController } from './question-rules.controller';
import { QuestionRule } from '../entities/question-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionRule])],
  controllers: [QuestionRulesController],
  providers: [QuestionRulesService],
  exports: [QuestionRulesService],
})
export class QuestionRulesModule {}
