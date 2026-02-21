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
    return this.formationRepo.find({ order: { label: 'ASC' } });
  }

  async findLevelsBySlug(slug: string) {
    return this.levelRepo.find({
      where: { formation: { slug } },
      order: { order: 'ASC' },
    });
  }

  create(data: Partial<Formation>) {
    return this.formationRepo.save(data as Formation);
  }

  update(id: number, data: Partial<Formation>) {
    return this.formationRepo.update(id, data);
  }

  remove(id: number) {
    return this.formationRepo.delete(id);
  }
}
