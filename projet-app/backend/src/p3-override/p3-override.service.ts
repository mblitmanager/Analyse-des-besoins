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

  findAll() {
    return this.p3OverrideRepo.find({ 
      order: { order: 'ASC' }
    });
  }

  findByFormation(formation: string) {
    return this.p3OverrideRepo.find({ 
      where: { formation },
      order: { order: 'ASC' }
    });
  }

  findOne(id: number) {
    return this.p3OverrideRepo.findOne({ where: { id } });
  }

  create(data: any) {
    const rule = this.p3OverrideRepo.create(data);
    return this.p3OverrideRepo.save(rule);
  }

  update(id: number, data: any) {
    return this.p3OverrideRepo.update(id, data);
  }

  remove(id: number) {
    return this.p3OverrideRepo.delete(id);
  }
}
