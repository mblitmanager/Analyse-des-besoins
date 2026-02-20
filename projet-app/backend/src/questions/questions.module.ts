import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from '../entities/question.entity';
import { Level } from '../entities/level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Level])],
  providers: [QuestionsService],
  controllers: [QuestionsController],
})
export class QuestionsModule {}
