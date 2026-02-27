import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from '../entities/question.entity';
import { Level } from '../entities/level.entity';
import { Formation } from '../entities/formation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Level, Formation])],
  providers: [QuestionsService],
  controllers: [QuestionsController],
})
export class QuestionsModule {}
