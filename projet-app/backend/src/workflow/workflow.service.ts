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

  async findAll(all: boolean = false) {
    return this.workflowRepo.find({
      where: all ? {} : { isActive: true },
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

  async createStep(data: Partial<WorkflowStep>) {
    // compute order as last + 1
    const last = await this.workflowRepo.findOne({ order: { order: 'DESC' } as any });
    const nextOrder = (last?.order ?? 0) + 1;
    const step = this.workflowRepo.create({
      ...data,
      order: data.order ?? nextOrder,
      isActive: data.isActive === undefined ? true : data.isActive,
    } as any);
    return this.workflowRepo.save(step);
  }

  async removeStep(id: number) {
    const step = await this.workflowRepo.findOne({ where: { id } });
    if (!step) return false;
    // Soft-delete: mark inactive
    await this.workflowRepo.update(id, { isActive: false });
    return true;
  }
}
