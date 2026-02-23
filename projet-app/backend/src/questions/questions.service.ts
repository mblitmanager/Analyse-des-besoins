import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const whereCondition = formationSlug
      ? [
          { type, isActive: true, formation: { slug: formationSlug } },
          { type, isActive: true, formation: null },
        ]
      : { type, isActive: true, formation: null };

    return this.questionRepo.find({
      where: whereCondition as any,
      order: { order: 'ASC' },
      relations: ['formation'],
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

  async findAll(formationSlug?: string) {
    const whereCondition = formationSlug
      ? [
          { formation: { slug: formationSlug } },
          { formation: null }, // Include globals
        ]
      : {};

    return this.questionRepo.find({
      where: whereCondition,
      relations: ['formation'],
      order: { type: 'ASC', order: 'ASC' },
    });
  }

  async create(data: Partial<Question> & { formationId?: number }) {
    const { formationId, ...rest } = data;
    const question = this.questionRepo.create({
      ...rest,
      formation: formationId ? ({ id: formationId } as any) : null,
    });
    return this.questionRepo.save(question);
  }

  async update(id: number, data: Partial<Question> & { formationId?: number }) {
    const { formationId, ...rest } = data;
    await this.questionRepo.update(id, {
      ...rest,
      formation: formationId ? ({ id: formationId } as any) : null,
    });
    return this.questionRepo.findOne({ where: { id } });
  }

  async remove(id: number) {
    const question = await this.questionRepo.findOne({ where: { id } });
    if (question) {
      await this.questionRepo.remove(question);
      return true;
    }
    return false;
  }
}
