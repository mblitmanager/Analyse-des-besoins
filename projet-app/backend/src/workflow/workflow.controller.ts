import { Controller, Get, Put, Body, Param, Query } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowStep } from '../entities/workflow-step.entity';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  findAll(@Query('all') all?: string) {
    const fetchAll = all === 'true';
    return this.workflowService.findAll(fetchAll);
  }

  @Put('order')
  updateOrder(@Body() steps: { id: number; order: number }[]) {
    return this.workflowService.updateOrder(steps);
  }

  @Put(':id')
  updateStep(@Param('id') id: string, @Body() data: Partial<WorkflowStep>) {
    return this.workflowService.updateStep(+id, data);
  }
}
