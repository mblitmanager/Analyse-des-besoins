import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formation } from '../entities/formation.entity';
import { Level } from '../entities/level.entity';

@Injectable()
export class FormationsService {
  constructor(
    @InjectRepository(Formation)
    private formationRepo: Repository<Formation>,
    @InjectRepository(Level)
    private levelRepo: Repository<Level>,
  ) {}

  findAll() {
    return this.formationRepo.find({
      order: { label: 'ASC' },
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
        .map((l: any) => l.id)
        .filter((id: any) => id != null);

      // Remove levels that are no longer in the array
      const levelsToRemove = formation.levels.filter(
        (existingLevel) => !incomingLevelIds.includes(existingLevel.id),
      );

      if (levelsToRemove.length > 0) {
        await this.levelRepo.remove(levelsToRemove);
      }
    }

    // TypeORM save() handles updates and new inserts via cascade
    const updatedFormation = this.formationRepo.merge(formation, data);
    return this.formationRepo.save(updatedFormation);
  }

  async remove(id: number) {
    const formation = await this.formationRepo.findOne({
      where: { id },
      relations: ['levels'],
    });
    if (formation) {
      // Must delete levels cascade first, or rely on onDelete: 'CASCADE'
      if (formation.levels && formation.levels.length > 0) {
        await this.levelRepo.remove(formation.levels);
      }
      return this.formationRepo.remove(formation);
    }
    return null;
  }
}
