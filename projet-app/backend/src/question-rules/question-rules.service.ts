import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionRule } from '../entities/question-rule.entity';
import { CreateQuestionRuleDto } from './dto/create-question-rule.dto';
import { UpdateQuestionRuleDto } from './dto/update-question-rule.dto';

@Injectable()
export class QuestionRulesService {
  constructor(
    @InjectRepository(QuestionRule)
    private questionRuleRepo: Repository<QuestionRule>,
  ) {}

  async create(createDto: CreateQuestionRuleDto): Promise<QuestionRule> {
    const rule = this.questionRuleRepo.create(createDto);
    return this.questionRuleRepo.save(rule);
  }

  async findAll(): Promise<QuestionRule[]> {
    return this.questionRuleRepo.find({
      order: {
        workflow: 'ASC',
        order: 'ASC',
      },
    });
  }

  async findByWorkflow(
    workflow: string,
    formation?: string,
  ): Promise<QuestionRule[]> {
    const query = this.questionRuleRepo
      .createQueryBuilder('qr')
      .where('qr.workflow = :workflow', { workflow })
      .andWhere('qr.isActive = :isActive', { isActive: true })
      .orderBy('qr.order', 'ASC');

    if (formation) {
      query.andWhere('(qr.formation = :formation OR qr.formation IS NULL)', {
        formation,
      });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<QuestionRule> {
    const rule = await this.questionRuleRepo.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Question rule with ID ${id} not found`);
    }
    return rule;
  }

  async update(
    id: string,
    updateDto: UpdateQuestionRuleDto,
  ): Promise<QuestionRule> {
    const rule = await this.findOne(id);
    this.questionRuleRepo.merge(rule, updateDto);
    return this.questionRuleRepo.save(rule);
  }

  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    await this.questionRuleRepo.remove(rule);
  }
}
