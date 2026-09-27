import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  @UseGuards(JwtAuthGuard)
  updateOrder(@Body() steps: { id: number; order: number }[]) {
    return this.workflowService.updateOrder(steps);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updateStep(@Param('id') id: string, @Body() data: Partial<WorkflowStep>) {
    return this.workflowService.updateStep(+id, data);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createStep(@Body() data: Partial<WorkflowStep>) {
    return this.workflowService.createStep(data as WorkflowStep);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  removeStep(@Param('id') id: string) {
    return this.workflowService.removeStep(+id);
  }
}
