import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParcoursRule } from '../entities/parcours-rule.entity';

@Injectable()
export class ParcoursService {
  constructor(
    @InjectRepository(ParcoursRule)
    private readonly repo: Repository<ParcoursRule>,
  ) {}

  findAll(): Promise<ParcoursRule[]> {
    return this.repo.find({ order: { formation: 'ASC', order: 'ASC' } });
  }

  findByFormation(formation: string): Promise<ParcoursRule[]> {
    return this.repo.find({
      where: { formation },
      order: { order: 'ASC' },
    });
  }

  findOne(id: number): Promise<ParcoursRule | null> {
    return this.repo.findOneBy({ id });
  }

  create(data: Partial<ParcoursRule>): Promise<ParcoursRule> {
    const rule = this.repo.create(data);
    return this.repo.save(rule);
  }

  async update(
    id: number,
    data: Partial<ParcoursRule>,
  ): Promise<ParcoursRule | null> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  /** Seed initial data from the provided Parcours rules */
  async seedIfEmpty(rules: Partial<ParcoursRule>[]): Promise<void> {
    const count = await this.repo.count();
    if (count > 0) return; // Already seeded
    const entities = this.repo.create(rules);
    await this.repo.save(entities);
  }
}
