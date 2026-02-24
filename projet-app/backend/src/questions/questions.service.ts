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
    scope: 'auto' | 'global' | 'formation' = 'auto',
  ) {
    // 1) Forcer global
    if (!formationSlug || scope === 'global') {
      return this.questionRepo.find({
        where: { type, isActive: true, formation: null } as any,
        order: { order: 'ASC' },
        relations: ['formation', 'level'],
      });
    }

    // 2) Forcer uniquement la formation
    if (scope === 'formation') {
      return this.questionRepo.find({
        where: {
          type,
          isActive: true,
          formation: { slug: formationSlug },
        } as any,
        order: { order: 'ASC' },
        relations: ['formation', 'level'],
      });
    }

    // 3) Mode auto (défaut) : formation-specific + global, deduplicated by text
    const specific = await this.questionRepo.find({
      where: {
        type,
        isActive: true,
        formation: { slug: formationSlug },
      } as any,
      order: { order: 'ASC' },
      relations: ['formation', 'level'],
    });

    const global = await this.questionRepo.find({
      where: { type, isActive: true, formation: null } as any,
      order: { order: 'ASC' },
      relations: ['formation', 'level'],
    });

    // Merge: formation-specific takes priority, deduplicate by text
    const seen = new Set<string>();
    const merged: Question[] = [];
    for (const q of specific) {
      const key = q.text.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(q);
      }
    }
    for (const q of global) {
      const key = q.text.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(q);
      }
    }

    return merged;
  }

  findPrerequisites(
    formationSlug?: string,
    scope: 'auto' | 'global' | 'formation' = 'auto',
  ) {
    return this.findQuestions('prerequis', formationSlug, scope);
  }

  async findByLevel(formationSlug: string, levelLabel: string) {
    const questions = await this.questionRepo.find({
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

    // Deduplicate by text (case-insensitive)
    const seen = new Set<string>();
    return questions.filter((q) => {
      const key = q.text.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
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
      relations: ['formation', 'level'],
      order: { type: 'ASC', order: 'ASC' },
    });
  }

  async create(
    data: Partial<Question> & { formationId?: number; levelId?: number },
  ) {
    const { formationId, levelId, ...rest } = data;
    const isLevelScoped =
      rest.type === 'prerequis' || rest.type === 'positionnement';

    // Calcul automatique de l'ordre (dernier + 1 dans le même contexte)
    const whereForOrder: any = {
      type: rest.type,
    };

    if (formationId) {
      whereForOrder.formation = { id: formationId } as any;
    } else {
      whereForOrder.formation = null;
    }

    if (isLevelScoped && levelId) {
      whereForOrder.level = { id: levelId } as any;
    }

    const lastInScope = await this.questionRepo.findOne({
      where: whereForOrder,
      order: { order: 'DESC' },
    });

    const nextOrder = (lastInScope?.order ?? 0) + 1;

    const question = this.questionRepo.create({
      ...rest,
      order: rest.order ?? nextOrder,
      formation: formationId ? ({ id: formationId } as any) : null,
      level: isLevelScoped && levelId ? ({ id: levelId } as any) : null,
      responseType: rest.responseType || 'qcm',
    });
    return this.questionRepo.save(question);
  }

  async update(
    id: number,
    data: Partial<Question> & { formationId?: number; levelId?: number },
  ) {
    const { formationId, levelId, responseType, ...rest } = data;
    const isLevelScoped =
      rest.type === 'prerequis' || rest.type === 'positionnement';

    const updateData: any = {
      ...rest,
      formation: formationId ? ({ id: formationId } as any) : null,
      level: isLevelScoped && levelId ? ({ id: levelId } as any) : null,
    };

    if (responseType) {
      updateData.responseType = responseType;
    }

    await this.questionRepo.update(id, updateData);
    return this.questionRepo.findOne({
      where: { id },
      relations: ['formation', 'level'],
    });
  }

  async updateOrder(orders: { id: number; order: number }[]) {
    for (const item of orders) {
      await this.questionRepo.update(item.id, { order: item.order });
    }
    return { success: true };
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
