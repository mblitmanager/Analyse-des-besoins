import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Formation } from '../entities/formation.entity';
import { Level } from '../entities/level.entity';
import { Question } from '../entities/question.entity';

@Injectable()
export class FormationsService {
  constructor(
    @InjectRepository(Formation)
    private formationRepo: Repository<Formation>,
    @InjectRepository(Level)
    private levelRepo: Repository<Level>,
  ) {}

  findAll(activeOnly: boolean = false) {
    const whereCondition = activeOnly ? { isActive: true } : {};
    return this.formationRepo.find({
      where: whereCondition,
      order: { label: 'ASC' },
      relations: ['levels'],
    });
  }

  async findBySlug(slug: string) {
    return this.formationRepo.findOne({
      where: { slug },
      relations: ['levels'],
    });
  }

  async findLevelsBySlug(slug: string) {
    return this.levelRepo.find({
      where: { formation: { slug } },
      order: { order: 'ASC' },
    });
  }

  async create(data: any) {
    const formation = this.formationRepo.create(data);
    return this.formationRepo.save(formation);
  }

  async update(id: number, data: any) {
    const formation = await this.formationRepo.findOne({
      where: { id },
      relations: ['levels'],
    });

    if (!formation) {
      throw new Error('Formation not found');
    }

    // Process levels array if passed in the payload
    if (data.levels) {
      const incomingLevelIds = data.levels
        .map((l: any) => Number(l.id))
        .filter((id: number) => Number.isFinite(id));

      // Remove levels that are no longer in the array
      const levelsToRemove = formation.levels.filter(
        (existingLevel) => !incomingLevelIds.includes(Number(existingLevel.id)),
      );

      if (levelsToRemove.length > 0) {
        const levelsToRemoveIds = levelsToRemove.map((l) => l.id);
        
        // Detach questions from these levels before removal
        // Using QueryBuilder because manager.update() doesn't support nested relation criteria
        await this.formationRepo.manager
          .createQueryBuilder()
          .update(Question)
          .set({ level: null } as any)
          .where('"levelId" IN (:...ids)', { ids: levelsToRemoveIds })
          .execute();

        await this.levelRepo.remove(levelsToRemove);
      }
    }

    // Recharger la formation : après remove(), l'entité en mémoire listait encore les niveaux supprimés,
    // ce qui pouvait faire échouer le save() en cascade (référence à des lignes inexistantes).
    const formationSynced = await this.formationRepo.findOne({
      where: { id },
      relations: ['levels'],
    });
    if (!formationSynced) {
      throw new Error('Formation not found');
    }

    const updatedFormation = this.formationRepo.merge(formationSynced, data);
    return this.formationRepo.save(updatedFormation);
  }

  async remove(id: number) {
    const formation = await this.formationRepo.findOne({
      where: { id },
      relations: ['levels', 'questions'],
    });

    if (formation) {
      // Safely detach all questions linked to this formation OR its levels
      const levelIds = formation.levels?.map(l => l.id) || [];
      
      const qb = this.formationRepo.manager.createQueryBuilder().update(Question);
      
      if (levelIds.length > 0) {
        qb.set({ formation: null, level: null } as any)
          .where('"formationId" = :fid OR "levelId" IN (:...lids)', { fid: id, lids: levelIds });
      } else {
        qb.set({ formation: null } as any)
          .where('"formationId" = :fid', { fid: id });
      }
      
      await qb.execute();

      // Must delete levels cascade first, or rely on onDelete: 'CASCADE'
      if (formation.levels && formation.levels.length > 0) {
        await this.levelRepo.remove(formation.levels);
      }
      return this.formationRepo.remove(formation);
    }
    return null;
  }
}
