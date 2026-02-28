import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DeepPartial, IsNull } from 'typeorm';
import { Question } from '../entities/question.entity';
import { Formation } from '../entities/formation.entity';
import { Level } from '../entities/level.entity';

// Use a type alias for more flexibility with DeepPartial
type QuestionPayload = DeepPartial<Question> & {
  formationId?: number;
  levelId?: number;
};

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
    @InjectRepository(Formation)
    private formationRepo: Repository<Formation>,
  ) {}

  async findQuestions(
    type: string,
    formationSlug?: string,
    scope: 'global' | 'formation' | 'both' | 'auto' = 'global',
  ) {
    let activeScope: 'global' | 'formation' | 'both' =
      scope === 'auto' ? 'both' : scope;

    if (scope === 'auto' && formationSlug) {
      const formation = await this.formationRepo.findOne({
        where: { slug: formationSlug },
      });
      if (formation) {
        // Map type to the correct scope field
        const typeMap: Record<string, keyof Formation> = {
          prerequis: 'prerequisQuestionsScope',
          complementary: 'complementaryQuestionsScope',
          availabilities: 'availabilitiesQuestionsScope',
          'mise-a-niveau': 'miseANiveauQuestionsScope',
          mise_a_niveau: 'miseANiveauQuestionsScope',
        };
        const field = typeMap[type];
        if (field && formation[field]) {
          activeScope = formation[field] as 'global' | 'formation' | 'both';
        }
      }
    }

    // Default to global if no formation or scope still unresolved
    if (!formationSlug || activeScope === 'global') {
      return this.questionRepo.find({
        where: {
          type,
          isActive: true,
          formation: undefined,
        } as FindOptionsWhere<Question>,
        order: { order: 'ASC' },
        relations: ['formation', 'level'],
      });
    }

    // If scope specifically requested formation only
    if (activeScope === 'formation') {
      return this.questionRepo.find({
        where: {
          type,
          isActive: true,
          formation: { slug: formationSlug },
        } as FindOptionsWhere<Question>,
        order: { order: 'ASC' },
        relations: ['formation', 'level'],
      });
    }

    // Mode 'both' or fallback
    const specific = await this.questionRepo.find({
      where: {
        type,
        isActive: true,
        formation: { slug: formationSlug },
      } as FindOptionsWhere<Question>,
      order: { order: 'ASC' },
      relations: ['formation', 'level'],
    });

    const global = await this.questionRepo.find({
      where: {
        type,
        isActive: true,
        formation: undefined,
      } as FindOptionsWhere<Question>,
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
    scope: 'global' | 'formation' | 'both' | 'auto' = 'global',
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
    const whereCondition:
      | FindOptionsWhere<Question>
      | FindOptionsWhere<Question>[] = formationSlug
      ? [
          { formation: { slug: formationSlug } },
          { formation: IsNull() }, // Include globals
        ]
      : {};

    return this.questionRepo.find({
      where: whereCondition,
      relations: ['formation', 'level'],
      order: { type: 'ASC', order: 'ASC' },
    });
  }

  async create(data: QuestionPayload) {
    const {
      formationId,
      levelId,
      showIfQuestionId,
      showIfResponseIndexes,
      showIfResponseValue,
      showIfRules: incomingShowIfRules,
      ...rest
    } = data;
    const isLevelScoped =
      rest.type === 'prerequis' || rest.type === 'positionnement';

    // Calcul automatique de l'ordre (dernier + 1 dans le même contexte)
    const whereForOrder: FindOptionsWhere<Question> = {
      type: rest.type as string,
    };

    if (formationId) {
      whereForOrder.formation = { id: formationId };
    } else {
      whereForOrder.formation = undefined;
    }

    if (isLevelScoped && levelId) {
      whereForOrder.level = { id: levelId };
    }

    const lastInScope = await this.questionRepo.findOne({
      where: whereForOrder,
      order: { order: 'DESC' },
    });

    const nextOrder = (lastInScope?.order ?? 0) + 1;

    // Normalize legacy conditional fields into showIfRules (array) for multi-parent support
    const showIfRules =
      incomingShowIfRules && Array.isArray(incomingShowIfRules)
        ? (incomingShowIfRules as unknown[])
        : showIfQuestionId
          ? [
              {
                questionId: Number(showIfQuestionId),
                responseIndexes:
                  Array.isArray(showIfResponseIndexes) &&
                  showIfResponseIndexes.length > 0
                    ? (showIfResponseIndexes as unknown[]).map((i) => Number(i))
                    : undefined,
                responseValue:
                  showIfResponseValue && String(showIfResponseValue).trim()
                    ? String(showIfResponseValue).trim()
                    : undefined,
              },
            ]
          : undefined;

    const question = this.questionRepo.create({
      text: rest.text,
      options: rest.options,
      correctResponseIndex: rest.correctResponseIndex,
      type: rest.type,
      responseType: rest.responseType || 'qcm',
      category: rest.category,
      icon: rest.icon,
      metadata: rest.metadata,
      isActive: rest.isActive ?? true,
      order: rest.order ?? nextOrder,
      formation: formationId
        ? ({ id: formationId } as DeepPartial<Formation>)
        : undefined,
      level:
        isLevelScoped && levelId
          ? ({ id: levelId } as DeepPartial<Level>)
          : undefined,
      // Handle conditional display fields
      showIfQuestionId: showIfQuestionId ? Number(showIfQuestionId) : undefined,
      showIfResponseIndexes:
        Array.isArray(showIfResponseIndexes) &&
        (showIfResponseIndexes as unknown[]).length > 0
          ? (showIfResponseIndexes as unknown[]).map((idx) => Number(idx))
          : undefined,
      showIfResponseValue:
        showIfResponseValue && String(showIfResponseValue).trim()
          ? String(showIfResponseValue).trim()
          : undefined,
      showIfRules: showIfRules ? (showIfRules as any) : undefined,
      correctResponseIndexes: rest.correctResponseIndexes,
    } as DeepPartial<Question>);
    return this.questionRepo.save(question);
  }

  async update(id: number, data: QuestionPayload) {
    const {
      formationId,
      levelId,
      responseType,
      showIfQuestionId,
      showIfResponseIndexes,
      showIfResponseValue,
      showIfRules: incomingShowIfRules,
      ...rest
    } = data;
    const isLevelScoped =
      rest.type === 'prerequis' || rest.type === 'positionnement';

    const updateData: DeepPartial<Question> = {
      ...(rest as DeepPartial<Question>),
      formation: formationId
        ? ({ id: formationId } as DeepPartial<Formation>)
        : undefined,
      level:
        isLevelScoped && levelId
          ? ({ id: levelId } as DeepPartial<Level>)
          : undefined,
    };

    if (responseType) {
      updateData.responseType = responseType;
    }

    // Normalize legacy conditional fields into showIfRules (array) for multi-parent support
    const normalizedShowIfRules =
      incomingShowIfRules && Array.isArray(incomingShowIfRules)
        ? (incomingShowIfRules as unknown[])
        : showIfQuestionId
          ? [
              {
                questionId: Number(showIfQuestionId),
                responseIndexes:
                  Array.isArray(showIfResponseIndexes) &&
                  showIfResponseIndexes.length > 0
                    ? (showIfResponseIndexes as unknown[]).map((i) => Number(i))
                    : undefined,
                responseValue:
                  showIfResponseValue && String(showIfResponseValue).trim()
                    ? String(showIfResponseValue).trim()
                    : undefined,
              },
            ]
          : undefined;

    updateData.showIfQuestionId = showIfQuestionId
      ? Number(showIfQuestionId)
      : undefined;
    updateData.showIfResponseIndexes =
      Array.isArray(showIfResponseIndexes) &&
      (showIfResponseIndexes as unknown[]).length > 0
        ? (showIfResponseIndexes as unknown[]).map((idx) => Number(idx))
        : undefined;
    updateData.showIfResponseValue =
      showIfResponseValue && String(showIfResponseValue).trim()
        ? String(showIfResponseValue).trim()
        : undefined;
    updateData.showIfRules = normalizedShowIfRules
      ? (normalizedShowIfRules as any)
      : undefined;
    updateData.correctResponseIndexes = data.correctResponseIndexes;

    await this.questionRepo.update(id, updateData as any);
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
      // 1. Clear simple showIfQuestionId dependencies
      await this.questionRepo.update({ showIfQuestionId: id }, {
        showIfQuestionId: null,
        showIfResponseIndexes: null,
        showIfResponseValue: null,
      } as any);

      // 2. Cleanup showIfRules (JSON array)
      const allWithRules = await this.questionRepo.find();

      for (const q of allWithRules) {
        if (q.showIfRules && Array.isArray(q.showIfRules)) {
          const originalLength = q.showIfRules.length;
          q.showIfRules = q.showIfRules.filter(
            (rule) => Number(rule.questionId) !== Number(id),
          );

          if (originalLength !== q.showIfRules.length) {
            // If all rules were removed, TypeORM might prefer an empty array or null
            // We'll use an empty array if that was the intended type
            await this.questionRepo.save(q);
          }
        }
      }

      // 3. Remove the question itself
      await this.questionRepo.remove(question);
      return true;
    }
    return false;
  }
}
