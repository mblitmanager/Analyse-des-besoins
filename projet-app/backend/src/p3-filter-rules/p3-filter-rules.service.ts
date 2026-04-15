import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { P3FilterRule } from '../entities/p3-filter-rule.entity';

@Injectable()
export class P3FilterRulesService {
  constructor(
    @InjectRepository(P3FilterRule)
    private readonly repo: Repository<P3FilterRule>,
  ) {}

  findAll() {
    return this.repo.find({ order: { order: 'ASC' } });
  }

  findActive() {
    return this.repo.find({ where: { isActive: true }, order: { order: 'ASC' } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<P3FilterRule>) {
    const rule = this.repo.create(data);
    return this.repo.save(rule);
  }

  async update(id: string, data: Partial<P3FilterRule>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
