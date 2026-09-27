import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TestRunsService } from './test-runs.service';
import type { TestRunRequest } from './test-runs.service';

@Controller('admin/test-runs')
@UseGuards(JwtAuthGuard)
export class TestRunsController {
  constructor(private readonly testRunsService: TestRunsService) {}

  @Get()
  list() {
    return this.testRunsService.listRuns();
  }

  @Get('status')
  status() {
    return this.testRunsService.getStatus();
  }

  @Post()
  request(@Body() body: TestRunRequest, @Req() req: any) {
    return this.testRunsService.requestRun(body, req.user?.email);
  }

  @Get(':runId')
  get(@Param('runId') runId: string) {
    return this.testRunsService.getRun(runId);
  }

  @Get(':runId/files/:caseId/:file')
  screenshot(
    @Param('runId') runId: string,
    @Param('caseId') caseId: string,
    @Param('file') file: string,
    @Res() res: Response,
  ) {
    res.sendFile(this.testRunsService.screenshotPath(runId, caseId, file));
  }
}
