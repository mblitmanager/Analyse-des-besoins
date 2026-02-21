import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Question } from '../entities/question.entity';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
  ) {}

  async findQuestions(
    type: 'prerequis' | 'positionnement' | 'complementary' | 'availabilities',
    formationSlug?: string,
  ) {
    const where: FindOptionsWhere<Question> = { type, isActive: true };

    // If formationSlug is provided, we check for formation-specific questions
    if (formationSlug) {
      const specificQuestions = await this.questionRepo.find({
        where: { ...where, formation: { slug: formationSlug } },
        order: { order: 'ASC' },
      });

      if (specificQuestions.length > 0) {
        return specificQuestions;
      }
    }

    // Fallback to generic questions (formation is null)
    return this.questionRepo.find({
      where: { ...where, formation: null },
      order: { order: 'ASC' },
    });
  }

  findPrerequisites(formationSlug?: string) {
    return this.findQuestions('prerequis', formationSlug);
  }

  findByLevel(formationSlug: string, levelLabel: string) {
    return this.questionRepo.find({
      where: {
        type: 'positionnement',
        isActive: true,
        level: {
          label: levelLabel,
          formation: { slug: formationSlug },
        },
      },
      relations: ['level', 'level.formation'],
      order: { order: 'ASC' },
    });
  }
}
