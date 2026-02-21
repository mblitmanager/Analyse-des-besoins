import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formation } from '../entities/formation.entity';

@Injectable()
export class FormationsService {
  constructor(
    @InjectRepository(Formation)
    private formationRepo: Repository<Formation>,
  ) {}

  findAll() {
    return this.formationRepo.find({ where: { isActive: true }, order: { label: 'ASC' } });
  }
}
