import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { P3OverrideRule } from '../entities/p3-override-rule.entity';

@Injectable()
export class P3OverrideService {
  constructor(
    @InjectRepository(P3OverrideRule)
    private p3OverrideRepo: Repository<P3OverrideRule>,
  ) {}

  private normalizeParcoursTitle(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const title = String(value).replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
    return title || null;
  }

  findAll(activeOnly = false) {
    return this.p3OverrideRepo.find({
      where: activeOnly ? { isActive: true } : undefined,
      order: { order: 'ASC' },
      relations: ['formationEntity'],
    });
  }

  findByFormation(formation: string, activeOnly = false) {
    return this.p3OverrideRepo.find({
      where: activeOnly ? { formation, isActive: true } : { formation },
      order: { order: 'ASC' },
      relations: ['formationEntity'],
    });
  }

  findOne(id: number) {
    return this.p3OverrideRepo.findOne({ where: { id } });
  }

  create(data: any) {
    const rule = this.p3OverrideRepo.create({
      ...data,
      parcoursTitle: this.normalizeParcoursTitle(data.parcoursTitle),
    });
    return this.p3OverrideRepo.save(rule);
  }

  update(id: number, data: any) {
    const normalizedData = { ...data };
    if (Object.prototype.hasOwnProperty.call(normalizedData, 'parcoursTitle')) {
      normalizedData.parcoursTitle = this.normalizeParcoursTitle(
        normalizedData.parcoursTitle,
      );
    }
    return this.p3OverrideRepo.update(id, normalizedData);
  }

  remove(id: number) {
    return this.p3OverrideRepo.delete(id);
  }
}
