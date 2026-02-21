import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowStep } from '../entities/workflow-step.entity';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(WorkflowStep)
    private workflowRepo: Repository<WorkflowStep>,
  ) {}

  async findAll() {
    return this.workflowRepo.find({
      where: { isActive: true },
      order: { order: 'ASC' },
    });
  }

  async updateOrder(steps: { id: number; order: number }[]) {
    for (const step of steps) {
      await this.workflowRepo.update(step.id, { order: step.order });
    }
    return this.findAll();
  }

  async updateStep(id: number, data: Partial<WorkflowStep>) {
    await this.workflowRepo.update(id, data);
    return this.workflowRepo.findOne({ where: { id } });
  }
}
